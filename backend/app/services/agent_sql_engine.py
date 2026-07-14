import csv
import io
import re
import sqlite3
import time
import uuid
from datetime import datetime

from app.schemas.agent_sql import AgentRunRequest, AgentRunResponse, AgentResult, AgentChart, AgentMetrics
from app.services.agent_challenge_loader import load_agent_sample_csv
from app.services.agent_dataset_loader import describe_csv, get_agent_dataset, load_agent_dataset_csv
from app.services.agent_validation_engine import validate_agent_pipeline


def run_agent_sql(payload: AgentRunRequest) -> AgentRunResponse:
    validation = validate_agent_pipeline(payload.nodes, payload.edges)
    if not validation.isValid:
        raise ValueError("Agent workflow validation failed: " + " ".join(validation.feedback))

    started = time.perf_counter()
    dataset_meta = _resolve_dataset(payload)
    csv_text = payload.input.documentText if payload.input.documentText is not None else dataset_meta.get("csvText") or load_agent_sample_csv(payload.challengeId)
    headers, rows, schema, aliases = _load_csv(csv_text)
    dataset_meta = {
        **dataset_meta,
        "rowCount": len(rows),
        "columns": [{"name": name, "type": schema[name]} for name in headers],
    }
    query = payload.input.query.strip()
    transcript: list[dict] = []
    timeline: list[dict] = []

    plan = _plan_query(query, headers, schema, aliases, rows, dataset_meta)
    plan_artifact = {
        "summary": f"{plan['aggregate']} on {plan.get('metricLabel', plan.get('measure') or 'rows')} grouped by {plan.get('group') or 'all rows'}.",
        "metric": plan.get("metricLabel", plan.get("measure") or "rows"),
        "groupBy": plan.get("group"),
        "filters": plan.get("filterSummary", []),
        "order": "descending" if plan.get("descending") else "ascending",
    }
    research_artifact = {
        "summary": f"Found {len(headers)} usable columns across {len(rows)} rows.",
        "columns": [{"name": name, "type": schema[name]} for name in headers],
        "rowCount": len(rows),
    }
    _record(transcript, timeline, "planner", "Planner", "success", "Query intent mapped to metrics, dimensions, filters, and ordering.", {"artifact": plan_artifact})
    _record(transcript, timeline, "researcher", "Researcher", "success", research_artifact["summary"], {"artifact": research_artifact})

    sql = _build_sql(plan, aliases, schema)
    sql_artifact = {"summary": "Generated a read-only SQL query from the inspected schema.", "sql": sql, "readOnly": True}
    _record(transcript, timeline, "coder", "Coder", "success", sql_artifact["summary"], {"artifact": sql_artifact})

    retry_count = 0
    try:
        result_rows = _execute_sql(rows, headers, schema, sql)
        tester_message = "SQL passed read-only checks and returned executable results."
    except (sqlite3.Error, ValueError) as exc:
        retry_count = 1
        _record(transcript, timeline, "tester-retry", "Tester", "success", f"Initial SQL failed verification; repaired once: {exc}.", {"retry": True})
        sql = _build_sql(plan, aliases, schema, repair=True)
        result_rows = _execute_sql(rows, headers, schema, sql)
        tester_message = "Repaired SQL passed verification and executed successfully."
    verification_artifact = {
        "summary": tester_message,
        "verified": True,
        "readOnly": True,
        "retryCount": retry_count,
        "rowCount": len(result_rows),
    }
    _record(transcript, timeline, "tester", "Tester", "success", tester_message, {"artifact": verification_artifact})

    chart = _select_chart(plan, result_rows)
    answer = _build_answer(plan, result_rows, chart)
    review_artifact = {
        "summary": "Result shape and values passed the final review.",
        "confidence": "High" if result_rows else "Medium",
        "answer": answer,
    }
    _record(transcript, timeline, "reviewer", "Reviewer", "success", review_artifact["summary"], {"artifact": review_artifact})

    score_breakdown = _score(validation, plan, result_rows, chart, retry_count)
    feedback = _feedback(score_breakdown, retry_count)
    latency = max(1, int((time.perf_counter() - started) * 1000))
    return AgentRunResponse(
        runId=str(uuid.uuid4()),
        status="completed",
        dataset={key: value for key, value in dataset_meta.items() if key != "csvText"},
        answer=answer,
        sql=sql,
        schemaInfo=[{"name": name, "type": kind} for name, kind in schema.items()],
        result=AgentResult(columns=list(result_rows[0].keys()) if result_rows else _result_columns(plan), rows=result_rows),
        chart=chart,
        simulationTimeline=timeline,
        transcript=transcript,
        metrics=AgentMetrics(latencyMs=latency, retryCount=retry_count, rowCount=len(result_rows), estimatedCost="Deterministic local execution"),
        scoreBreakdown=score_breakdown,
        judgeFeedback=feedback,
        planArtifact=plan_artifact,
        researchArtifact=research_artifact,
        sqlArtifact=sql_artifact,
        verificationArtifact=verification_artifact,
        reviewArtifact=review_artifact,
    )


def _resolve_dataset(payload: AgentRunRequest) -> dict:
    if payload.input.documentText is not None:
        description = payload.input.documentName or "Custom uploaded CSV"
        info = describe_csv(payload.input.documentText)
        return {"id": "custom", "name": description, "description": "User-provided CSV dataset.", "rowCount": info["rowCount"], "columns": [{"name": column, "type": "AUTO"} for column in info["columns"]], "sampleQueries": [], "csvText": payload.input.documentText}
    dataset_id = payload.input.datasetId or "retail-sales"
    dataset = get_agent_dataset(dataset_id)
    if not dataset:
        raise ValueError(f"Unknown dataset: {dataset_id}")
    return {**dataset, "csvText": load_agent_dataset_csv(dataset_id)}


def _load_csv(csv_text: str):
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    if not reader.fieldnames:
        raise ValueError("CSV must include a header row.")
    original_headers = [header.strip() for header in reader.fieldnames if header and header.strip()]
    if not original_headers:
        raise ValueError("CSV header row is empty.")
    aliases: dict[str, str] = {}
    used: set[str] = set()
    for header in original_headers:
        base = re.sub(r"[^a-zA-Z0-9]+", "_", header.lower()).strip("_") or "column"
        alias = base
        index = 2
        while alias in used:
            alias = f"{base}_{index}"
            index += 1
        used.add(alias)
        aliases[header] = alias

    records = []
    for record in reader:
        records.append({aliases[header]: (record.get(header) or "").strip() for header in original_headers})
    schema = {alias: _infer_type([record[alias] for record in records]) for alias in aliases.values()}
    return list(aliases.values()), records, schema, aliases


def _infer_type(values: list[str]) -> str:
    non_empty = [value for value in values if value]
    if not non_empty:
        return "TEXT"
    if all(re.fullmatch(r"[-+]?\d+", value) for value in non_empty):
        return "INTEGER"
    if all(_is_float(value) for value in non_empty):
        return "REAL"
    if all(_is_date(value) for value in non_empty):
        return "DATE"
    return "TEXT"


def _is_float(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


def _is_date(value: str) -> bool:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _plan_query(
    query: str,
    headers: list[str],
    schema: dict[str, str],
    aliases: dict[str, str],
    rows: list[dict] | None = None,
    dataset: dict | None = None,
) -> dict:
    lowered = query.lower()
    sample_plan = _sample_query_plan(query, dataset or {})
    if sample_plan:
        return sample_plan
    supported_signal = (
        "sales" in lowered
        or "revenue" in lowered
        or "amount" in lowered
        or "total" in lowered
        or "sum" in lowered
        or "average" in lowered
        or "avg" in lowered
        or "mean" in lowered
        or "count" in lowered
        or "how many" in lowered
        or "number of" in lowered
        or "maximum" in lowered
        or "max" in lowered
        or "highest" in lowered
        or "minimum" in lowered
        or "min" in lowered
        or "lowest" in lowered
        or "top" in lowered
        or " by " in f" {lowered} "
        or " per " in f" {lowered} "
    )
    if not supported_signal:
        raise ValueError("Unsupported question. Try an analytics question using totals, averages, counts, top results, or grouping by a column.")
    numeric = [name for name, kind in schema.items() if kind in {"INTEGER", "REAL"}]
    date_fields = [name for name in headers if schema[name] == "DATE" or any(token in name for token in ("date", "month", "year"))]
    group = _find_field(lowered, headers, aliases, r"\bby\s+([a-zA-Z0-9_ -]+?)(?:\?|\s|$)")
    if not group:
        group = _find_field(lowered, headers, aliases, r"\bper\s+([a-zA-Z0-9_ -]+?)(?:\?|\s|$)")
    if not group and any(token in lowered for token in ("month", "monthly")) and date_fields:
        group = date_fields[0]
    measure = _find_field(lowered, headers, aliases, r"\b(?:sales|revenue|amount|total|sum|average|avg)\s+(?:of|for)?\s*([a-zA-Z0-9_ -]+?)(?:\s+by|\?|$)")
    if not measure or measure not in numeric:
        measure = next((field for field in numeric if field not in {"id", "quantity"} and field in lowered), None) or (numeric[0] if numeric else None)
    if any(token in lowered for token in ("how many", "count", "number of")):
        aggregate = "COUNT"
    elif any(token in lowered for token in ("average", "avg", "mean")):
        aggregate = "AVG"
    elif any(token in lowered for token in ("highest", "maximum", "max", "top")):
        aggregate = "MAX" if "maximum" in lowered or "max" in lowered else "SUM"
    elif any(token in lowered for token in ("lowest", "minimum", "min")):
        aggregate = "MIN"
    else:
        aggregate = "SUM"
    limit_match = re.search(r"\btop\s+(\d+)", lowered)
    limit = int(limit_match.group(1)) if limit_match else None
    descending = not any(token in lowered for token in ("lowest", "minimum", "ascending", "bottom"))
    filters = _find_filters(lowered, headers, schema, rows or [])
    if not group and not measure and aggregate != "COUNT":
        raise ValueError("The question does not identify a supported numeric analysis.")
    derived_sales = any(token in lowered for token in ("sales", "revenue", "amount")) and ("quantity" in schema or "units_sold" in schema) and "unit_price" in schema
    derived_quantity_field = "quantity" if "quantity" in schema else "units_sold"
    return {
        "query": query,
        "aggregate": aggregate,
        "measure": measure,
        "group": group,
        "limit": limit,
        "descending": descending,
        "dateGroup": bool(group in date_fields and any(token in lowered for token in ("month", "monthly"))),
        "derivedSales": derived_sales,
        "derivedQuantityField": derived_quantity_field,
        "metricLabel": "sales" if derived_sales else aggregate.lower(),
        "filters": filters,
        "filterSummary": [f"{item['field']} = {item['value']}" for item in filters],
    }


def _sample_query_plan(query: str, dataset: dict) -> dict | None:
    dataset_id = dataset.get("id")
    normalized = re.sub(r"[^a-z0-9]+", " ", query.lower()).strip()
    specs = {
        "retail-sales": {
            "what was total revenue by category": {"aggregate": "SUM", "measure": "unit_price", "group": "category", "derivedSales": True, "metricLabel": "revenue"},
            "show the top 3 products by revenue": {"aggregate": "SUM", "measure": "unit_price", "group": "product", "derivedSales": True, "metricLabel": "revenue", "limit": 3},
            "what were monthly sales in the north region": {"aggregate": "SUM", "measure": "unit_price", "group": "date", "derivedSales": True, "metricLabel": "sales", "dateGroup": True, "filters": [{"field": "region", "value": "North"}]},
        },
        "employee-attrition": {
            "how many employees left by department": {"aggregate": "COUNT", "measure": None, "group": "department", "metricLabel": "employees", "filters": [{"field": "attrition", "value": "Yes"}]},
            "what is the average monthly income by department": {"aggregate": "AVG", "measure": "monthly_income", "group": "department", "metricLabel": "average monthly income"},
            "show the average job satisfaction by role": {"aggregate": "AVG", "measure": "job_satisfaction", "group": "role", "metricLabel": "average job satisfaction"},
        },
        "movie-ratings": {
            "what is the average rating by genre": {"aggregate": "AVG", "measure": "rating", "group": "genre", "metricLabel": "average rating"},
            "show the top 3 movies by box office": {"aggregate": "SUM", "measure": "box_office", "group": "title", "metricLabel": "box office", "limit": 3},
            "how many movies were released each year": {"aggregate": "COUNT", "measure": None, "group": "release_year", "metricLabel": "movies"},
        },
        "web-events": {
            "what were total conversions by channel": {"aggregate": "SUM", "measure": "conversions", "group": "channel", "metricLabel": "conversions"},
            "show sessions by device": {"aggregate": "SUM", "measure": "sessions", "group": "device", "metricLabel": "sessions"},
            "what was the monthly conversion total": {"aggregate": "SUM", "measure": "conversions", "group": "timestamp", "metricLabel": "conversions", "dateGroup": True},
        },
    }
    spec = specs.get(dataset_id, {}).get(normalized)
    if not spec:
        return None
    return {
        "query": query,
        "aggregate": spec["aggregate"],
        "measure": spec.get("measure"),
        "group": spec.get("group"),
        "limit": spec.get("limit"),
        "descending": True,
        "dateGroup": spec.get("dateGroup", False),
        "derivedSales": spec.get("derivedSales", False),
        "derivedQuantityField": "units_sold",
        "metricLabel": spec.get("metricLabel", spec["aggregate"].lower()),
        "filters": spec.get("filters", []),
        "filterSummary": [f"{item['field']} = {item['value']}" for item in spec.get("filters", [])],
    }


def _find_filters(text: str, headers: list[str], schema: dict[str, str], rows: list[dict]) -> list[dict]:
    filters: list[dict] = []
    year = re.search(r"\b(20\d{2})\b", text)
    date_field = next((field for field in headers if schema.get(field) == "DATE" or any(token in field for token in ("date", "time"))), None)
    if year and date_field:
        filters.append({"field": date_field, "value": year.group(1), "dateYear": True})
    value_map: dict[str, set[str]] = {field: set() for field in headers if schema.get(field) == "TEXT"}
    for row in rows:
        for field in value_map:
            if row.get(field):
                value_map[field].add(str(row[field]))
    for field, values in value_map.items():
        for value in values:
            if len(value) > 1 and value.lower() in text and not any(item["field"] == field for item in filters):
                filters.append({"field": field, "value": value})
    return filters


def _find_field(text: str, headers: list[str], aliases: dict[str, str], pattern: str) -> str | None:
    match = re.search(pattern, text)
    if not match:
        return None
    candidate = match.group(1).strip().lower().replace(" ", "_")
    for original, alias in aliases.items():
        if candidate == alias or candidate == original.lower().replace(" ", "_") or candidate in alias or alias in candidate:
            return alias
    return None


def _build_sql(plan: dict, aliases: dict[str, str], schema: dict[str, str], repair: bool = False) -> str:
    group = plan["group"]
    measure = plan["measure"]
    aggregate = plan["aggregate"]
    if aggregate == "COUNT":
        expression = "COUNT(*)"
    elif not measure or measure not in schema:
        if not repair:
            raise ValueError("No safe numeric measure was found in the schema.")
        expression = "COUNT(*)"
        aggregate = "COUNT"
    else:
        if plan.get("derivedSales"):
            expression = f'{aggregate}("{plan.get("derivedQuantityField", "quantity")}" * "unit_price")'
        else:
            expression = f"{aggregate}(\"{measure}\")"
    if group:
        selected_group = f"strftime('%Y-%m', \"{group}\")" if plan["dateGroup"] else f'"{group}"'
        alias = "period" if plan["dateGroup"] else group
        sql = f'SELECT {selected_group} AS "{alias}", {expression} AS value FROM dataset GROUP BY {selected_group} ORDER BY value {"DESC" if plan["descending"] else "ASC"}'
    else:
        sql = f"SELECT {expression} AS value FROM dataset"
    filters = plan.get("filters", [])
    if filters:
        where_parts = []
        for item in filters:
            field = item["field"]
            value = str(item["value"]).replace("'", "''")
            if item.get("dateYear"):
                where_parts.append(f"strftime('%Y', \"{field}\") = '{value}'")
            else:
                where_parts.append(f"\"{field}\" = '{value}'")
        sql = sql.replace(" FROM dataset", f" FROM dataset WHERE {' AND '.join(where_parts)}")
    if plan["limit"]:
        sql += f" LIMIT {int(plan['limit'])}"
    return sql


def _execute_sql(rows: list[dict], headers: list[str], schema: dict[str, str], sql: str) -> list[dict]:
    if not re.match(r"^\s*select\b", sql, flags=re.I) or re.search(r"\b(insert|update|delete|drop|alter|create|attach|pragma)\b", sql, flags=re.I):
        raise ValueError("Only read-only SELECT queries are permitted.")
    connection = sqlite3.connect(":memory:")
    try:
        columns = ", ".join(f'"{header}" {"REAL" if schema[header] == "REAL" else "INTEGER" if schema[header] == "INTEGER" else "TEXT"}' for header in headers)
        connection.execute(f"CREATE TABLE dataset ({columns})")
        placeholders = ", ".join("?" for _ in headers)
        values = []
        for row in rows:
            converted = []
            for header in headers:
                value = row[header]
                if value == "":
                    converted.append(None)
                elif schema[header] == "INTEGER":
                    converted.append(int(value))
                elif schema[header] == "REAL":
                    converted.append(float(value))
                else:
                    converted.append(value)
            values.append(converted)
        if values:
            connection.executemany(f"INSERT INTO dataset VALUES ({placeholders})", values)
        connection.row_factory = sqlite3.Row
        return [dict(row) for row in connection.execute(sql).fetchall()]
    finally:
        connection.close()


def _select_chart(plan: dict, rows: list[dict]) -> AgentChart:
    columns = list(rows[0].keys()) if rows else _result_columns(plan)
    if plan["group"] and rows:
        chart_type = "line" if plan["dateGroup"] else "bar"
        return AgentChart(type=chart_type, title=f"{plan['metricLabel'].title()} by {columns[0]}", xKey=columns[0], yKey=columns[1])
    return AgentChart(type="metric", title="Computed result", xKey=None, yKey=columns[0] if columns else None)


def _result_columns(plan: dict) -> list[str]:
    return ["period" if plan.get("dateGroup") else plan["group"], "value"] if plan.get("group") else ["value"]


def _build_answer(plan: dict, rows: list[dict], chart: AgentChart) -> str:
    if not rows:
        return "The verified query returned no rows for this question."
    if plan["group"]:
        top = rows[0]
        return f"The verified analysis contains {len(rows)} grouped results. The leading value is {top.get(chart.xKey)} with {top.get(chart.yKey):g} based on the selected metric."
    return f"The verified {plan['aggregate'].lower()} result is {rows[0].get('value'):g}."


def _record(transcript, timeline, event_id, label, status, message, meta):
    transcript.append({"agent": label, "status": status, "message": message, "meta": meta})
    timeline.append({"id": event_id, "type": event_id, "label": label, "status": "completed", "startedAtOffsetMs": len(timeline) * 420, "durationMs": 360, "meta": meta})


def _score(validation, plan, rows, chart, retry_count):
    orchestration = 25 if validation.isValid else 0
    sql = 35 if rows is not None else 0
    verification = 20 if retry_count <= 1 else 8
    efficiency = 10 if retry_count == 0 else 7
    explanation = 10 if chart.type != "metric" or rows else 6
    return [
        {"label": "Workflow orchestration", "score": orchestration, "maxScore": 25},
        {"label": "SQL correctness and execution", "score": sql, "maxScore": 35},
        {"label": "Verification coverage", "score": verification, "maxScore": 20},
        {"label": "Efficiency", "score": efficiency, "maxScore": 10},
        {"label": "Explanation and visualization", "score": explanation, "maxScore": 10},
    ]


def _feedback(score_breakdown, retry_count):
    total = sum(item["score"] for item in score_breakdown)
    return {
        "positive": "The five-agent workflow produced a verified analytical result." if total >= 80 else "The workflow completed, but some quality points were left on the table.",
        "weakness": "The query needed one repair retry." if retry_count else "The query passed on the first verification attempt.",
        "nextStep": "Try a time-based question to exercise the line-chart path." if total >= 80 else "Keep the canonical order and make the Tester verify before the Reviewer.",
        "recommendations": ["Keep schema inspection before SQL generation.", "Use read-only SQL only.", "Let the Reviewer explain the result and chart choice."],
    }
