import unittest

from app.schemas.agent_sql import AgentRunRequest
from app.schemas.build import BuildEdge, BuildNode
from app.services.agent_sql_engine import _execute_sql, _plan_query, run_agent_sql
from app.services.agent_dataset_loader import list_agent_datasets
from app.services.agent_validation_engine import validate_agent_pipeline


class AgentSqlTests(unittest.TestCase):
    def setUp(self):
        spec = [("planner", "Planner"), ("researcher", "Researcher"), ("coder", "Coder"), ("tester", "Tester"), ("reviewer", "Reviewer")]
        self.nodes = [BuildNode(id=f"n{i}", type=node_type, label=label) for i, (node_type, label) in enumerate(spec)]
        self.edges = [BuildEdge(source=f"n{i}", target=f"n{i + 1}") for i in range(4)]

    def test_canonical_workflow_and_sales_chart(self):
        validation = validate_agent_pipeline(self.nodes, self.edges)
        self.assertTrue(validation.isValid)
        run = run_agent_sql(AgentRunRequest(challengeId="agent-sql-001", nodes=self.nodes, edges=self.edges, input={"query": "What were total sales by category?"}))
        self.assertIn("units_sold", run.sql)
        self.assertIn("unit_price", run.sql)
        self.assertEqual(run.chart.type, "bar")
        self.assertEqual(run.result.rows[0]["category"], "Electronics")

    def test_missing_reviewer_is_rejected(self):
        validation = validate_agent_pipeline(self.nodes[:-1], self.edges[:-1])
        self.assertFalse(validation.isValid)
        self.assertIn("Reviewer", validation.requiredMissingNodes)

    def test_unsafe_sql_is_rejected(self):
        with self.assertRaises(ValueError):
            _execute_sql([], ["value"], {"value": "INTEGER"}, "DROP TABLE dataset")

    def test_month_query_selects_line_chart(self):
        run = run_agent_sql(AgentRunRequest(challengeId="agent-sql-001", nodes=self.nodes, edges=self.edges, input={"query": "How many orders were placed in each month?"}))
        self.assertEqual(run.chart.type, "line")
        self.assertEqual(run.chart.xKey, "period")

    def test_unsupported_question_is_rejected_safely(self):
        with self.assertRaisesRegex(ValueError, "Unsupported question"):
            _plan_query("Tell me a joke", ["category", "value"], {"category": "TEXT", "value": "INTEGER"}, {"category": "category", "value": "value"})

    def test_all_named_datasets_have_working_sample_queries(self):
        datasets = list_agent_datasets()
        self.assertEqual({item["id"] for item in datasets}, {"retail-sales", "employee-attrition", "movie-ratings", "web-events"})
        for dataset in datasets:
            run = run_agent_sql(AgentRunRequest(challengeId="agent-sql-001", nodes=self.nodes, edges=self.edges, input={"datasetId": dataset["id"], "query": dataset["sampleQueries"][0]}))
            self.assertTrue(run.sql.lower().startswith("select"))
            self.assertEqual(run.dataset["id"], dataset["id"])

    def test_custom_csv_is_used_as_active_dataset(self):
        csv_text = "category,amount\nA,10\nB,20\nA,5\n"
        run = run_agent_sql(AgentRunRequest(challengeId="agent-sql-001", nodes=self.nodes, edges=self.edges, input={"documentName": "custom.csv", "documentText": csv_text, "query": "What is the total amount by category?"}))
        self.assertEqual(run.dataset["id"], "custom")
        self.assertEqual(run.result.rows[0]["value"], 20)


if __name__ == "__main__":
    unittest.main()
