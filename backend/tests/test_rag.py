import os
import unittest
from unittest.mock import patch

import requests

from app.core.config import get_settings
from app.schemas.build import BuildEdge, BuildNode
from app.services import rag_engine
from app.services.challenge_loader import load_challenge, load_challenge_source
from app.services.rag_engine import run_rag_pipeline
from app.services.validation_engine import validate_pipeline


class RagTests(unittest.TestCase):
    def setUp(self):
        os.environ["RAG_EXECUTION_MODE"] = "local"
        os.environ["HUGGINGFACE_API_TOKEN"] = ""
        get_settings.cache_clear()
        rag_engine._load_or_build_index.cache_clear()
        self.challenge = load_challenge("university-rag-001")
        self.nodes = self._nodes()

    def _nodes(self, values=None):
        spec = [
            ("pdf-loader", "PDF Loader"),
            ("chunker", "Recursive Text Splitting"),
            ("embedder", "Embeddings"),
            ("vector-db", "FAISS Vector Store"),
            ("retriever", "Dense Retriever"),
            ("reranker", "Reranker"),
            ("prompt-template", "Prompt Template"),
            ("llm", "LLM"),
        ]
        values = values or {}
        return [BuildNode(id=f"n{index}", type=node_type, label=label, values=values.get(label, {})) for index, (node_type, label) in enumerate(spec)]

    def _edges(self):
        pairs = [
            ("n0", "n1", "documents", "documents"),
            ("n1", "n2", "chunks", "chunks"),
            ("n2", "n3", "vectors", "vectors"),
            ("n3", "n4", "index", "index"),
            ("n4", "n5", "context", "context"),
            ("n5", "n6", "reranked-context", "context"),
            ("n6", "n7", "prompt", "prompt"),
        ]
        return [BuildEdge(source=source, target=target, sourceHandle=source_handle, targetHandle=target_handle) for source, target, source_handle, target_handle in pairs]

    def _validation(self, nodes=None, edges=None):
        return validate_pipeline(self.challenge, nodes or self.nodes, edges or self._edges())

    def test_source_exists_and_local_run_is_fast_and_structured(self):
        self.assertTrue(os.path.exists(load_challenge_source("university-rag-001")))
        validation = self._validation()
        self.assertTrue(validation.isValid)
        run = run_rag_pipeline(
            self.challenge,
            self.nodes,
            self._edges(),
            "What is the meaning of business?",
            validation.normalizedPipeline,
            validation,
        )
        self.assertEqual(run.metrics.executionMode, "local")
        self.assertEqual(run.metrics.embeddingModel, "local-hash")
        self.assertEqual(run.metrics.generationModel, "local-extractive")
        self.assertEqual(len(run.simulationTimeline), 8)
        self.assertFalse(run.executionDiagnostics.degradedNodeIds)
        self.assertIn("According to the business basics document", run.answer)

    def test_invalid_handles_are_reported_as_feedback(self):
        edges = self._edges()
        edges[0] = BuildEdge(source="n0", target="n1", sourceHandle="wrong", targetHandle="documents")
        validation = self._validation(edges=edges)
        self.assertFalse(validation.isValid)
        self.assertTrue(any("Invalid edge" in item and "incompatible" in item for item in validation.feedback))

    def test_missing_handles_are_rejected(self):
        edges = self._edges()
        edges[0] = BuildEdge(source="n0", target="n1")
        validation = self._validation(edges=edges)
        self.assertFalse(validation.isValid)
        self.assertTrue(any("handles are required" in item for item in validation.feedback))

    def test_duplicate_edges_are_rejected(self):
        edges = self._edges()
        edges.append(edges[0])
        validation = self._validation(edges=edges)
        self.assertFalse(validation.isValid)
        self.assertTrue(any("Duplicate edge" in item for item in validation.feedback))

    def test_broken_graph_produces_degraded_or_skipped_trace(self):
        edges = self._edges()[:-1]
        validation = self._validation(edges=edges)
        self.assertFalse(validation.isValid)
        run = run_rag_pipeline(self.challenge, self.nodes, edges, "What is the meaning of business?", validation.normalizedPipeline, validation)
        statuses = {event.status for event in run.simulationTimeline}
        self.assertTrue({"degraded", "skipped"} & statuses)
        self.assertTrue(run.executionDiagnostics.degradedNodeIds or run.executionDiagnostics.skippedNodeIds)

    def test_custom_question_quality_is_not_fixed(self):
        validation = self._validation()
        relevant = run_rag_pipeline(self.challenge, self.nodes, self._edges(), "How does business create profit from goods and services?", validation.normalizedPipeline, validation)
        irrelevant = run_rag_pipeline(self.challenge, self.nodes, self._edges(), "What is quantum computing?", validation.normalizedPipeline, validation)
        relevant_score = next(item.score for item in relevant.scoreBreakdown if item.label == "Answer quality")
        irrelevant_score = next(item.score for item in irrelevant.scoreBreakdown if item.label == "Answer quality")
        self.assertNotEqual(relevant_score, irrelevant_score)

    def test_node_settings_are_reflected_in_metrics(self):
        nodes = self._nodes({
            "Recursive Text Splitting": {"chunkSize": 400, "overlap": 50},
            "Dense Retriever": {"topK": 2},
        })
        validation = self._validation(nodes=nodes)
        run = run_rag_pipeline(self.challenge, nodes, self._edges(), "What is the meaning of business?", validation.normalizedPipeline, validation)
        self.assertEqual(run.metrics.chunkSize, 400)
        self.assertEqual(run.metrics.chunkOverlap, 50)
        self.assertEqual(run.metrics.topK, 2)

    def test_external_failure_falls_back_to_local(self):
        os.environ["RAG_EXECUTION_MODE"] = "external"
        os.environ["HUGGINGFACE_API_TOKEN"] = "test-token"
        get_settings.cache_clear()
        rag_engine._load_or_build_index.cache_clear()
        nodes = self._nodes({
            "Embeddings": {"model": "Configured Hugging Face"},
            "LLM": {"model": "Configured Hugging Face"},
        })
        validation = self._validation(nodes=nodes)
        with patch("app.services.rag_engine.requests.post", side_effect=requests.Timeout()):
            run = run_rag_pipeline(self.challenge, nodes, self._edges(), "What is the meaning of business?", validation.normalizedPipeline, validation)
        self.assertEqual(run.metrics.executionMode, "local")
        self.assertTrue(run.executionDiagnostics.warnings)


if __name__ == "__main__":
    unittest.main()
