import type { GameModeConfig } from "../types/config.types";

export const ragBuilderConfig: GameModeConfig = {
  id: "rag-builder",
  label: "RAG Pipeline Builder",
  theme: {
    background: "#0B0C10",
    gridColor: "#1F2833",
    nodeColors: {
      ingestion: "#66FCF1",
      indexing: "#45A29E",
      retrieval: "#C5C6C7",
      generation: "#66FCF1",
    },
    accent: "#66FCF1",
    textPrimary: "#FFFFFF",
    textSecondary: "#C5C6C7",
    borderRadius: "8px",
    edgeColor: "#45A29E",
    edgeAnimatedColor: "#66FCF1",
  },
  nodeRegistry: [
    {
      id: "pdf-loader",
      label: "PDF Loader",
      category: "ingestion",
      description: "Loads source handbook documents into the pipeline.",
      icon: "FileText",
      inputs: [],
      outputs: [{ id: "documents", label: "Documents", dataType: "documents" }],
      configFields: [
        { name: "source", label: "Source", type: "text", default: "handbook.pdf" },
      ],
    },
    {
      id: "chunker",
      label: "Recursive Text Splitting",
      category: "ingestion",
      description: "Splits documents into retrievable chunks.",
      icon: "Scissors",
      inputs: [{ id: "documents", label: "Documents", dataType: "documents" }],
      outputs: [{ id: "chunks", label: "Chunks", dataType: "chunks" }],
      configFields: [
        { name: "chunkSize", label: "Chunk Size", type: "slider", min: 100, max: 1000, step: 50, default: 300 },
        { name: "overlap", label: "Overlap", type: "number", min: 0, max: 200, step: 10, default: 40 },
      ],
    },
    {
      id: "embedder",
      label: "Embeddings",
      category: "indexing",
      description: "Converts chunks into semantic vectors.",
      icon: "Binary",
      inputs: [{ id: "chunks", label: "Chunks", dataType: "chunks" }],
      outputs: [{ id: "vectors", label: "Vectors", dataType: "vectors" }],
      configFields: [
        { name: "model", label: "Embedding Model", type: "select", options: ["MiniLM-L6", "OpenAI text-embedding-3-small"], default: "MiniLM-L6" },
      ],
    },
    {
      id: "vector-db",
      label: "FAISS Vector Store",
      category: "indexing",
      description: "Stores vectors for approximate nearest-neighbor search.",
      icon: "Database",
      inputs: [{ id: "vectors", label: "Vectors", dataType: "vectors" }],
      outputs: [{ id: "index", label: "Index", dataType: "index" }],
      configFields: [
        { name: "provider", label: "Provider", type: "select", options: ["FAISS", "Pinecone", "Qdrant"], default: "FAISS" },
      ],
    },
    {
      id: "retriever",
      label: "Dense Retriever",
      category: "retrieval",
      description: "Finds relevant chunks for a user query.",
      icon: "Search",
      inputs: [{ id: "index", label: "Index", dataType: "index" }],
      outputs: [{ id: "context", label: "Context", dataType: "context" }],
      configFields: [
        { name: "topK", label: "Top K", type: "number", min: 1, max: 20, step: 1, default: 5 },
        { name: "rerank", label: "Rerank", type: "toggle", default: true },
      ],
    },
    {
      id: "reranker",
      label: "Reranker",
      category: "retrieval",
      description: "Reorders retrieved chunks to improve answer precision before prompting.",
      icon: "ListChecks",
      inputs: [{ id: "context", label: "Context", dataType: "context" }],
      outputs: [{ id: "reranked-context", label: "Reranked Context", dataType: "context" }],
      configFields: [
        { name: "strategy", label: "Strategy", type: "select", options: ["Cross Encoder", "Lexical Hybrid"], default: "Cross Encoder" },
      ],
    },
    {
      id: "prompt-template",
      label: "Prompt Template",
      category: "generation",
      description: "Formats the retrieved context and user question into a structured prompt.",
      icon: "FileText",
      inputs: [{ id: "context", label: "Context", dataType: "context" }],
      outputs: [{ id: "prompt", label: "Prompt", dataType: "prompt" }],
      configFields: [
        { name: "style", label: "Template Style", type: "select", options: ["Structured QA", "Policy Answer"], default: "Structured QA" },
      ],
    },
    {
      id: "llm",
      label: "LLM",
      category: "generation",
      description: "Generates the final grounded answer.",
      icon: "Sparkles",
      inputs: [
        { id: "context", label: "Context", dataType: "context" },
        { id: "prompt", label: "Prompt", dataType: "prompt" },
      ],
      outputs: [{ id: "answer", label: "Answer", dataType: "answer" }],
      configFields: [
        { name: "model", label: "Model", type: "select", options: ["gpt-4.1-mini", "gpt-4.1"], default: "gpt-4.1-mini" },
        { name: "temperature", label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, default: 0.2 },
      ],
    },
  ],
  connectionRules: {
    ingestion: ["ingestion", "indexing"],
    indexing: ["indexing", "retrieval"],
    retrieval: ["retrieval", "generation"],
    // Prompt Template and LLM are both generation nodes. Handle data types
    // still restrict this to valid links such as prompt -> LLM.prompt and
    // context -> LLM.context.
    generation: ["generation"],
  },
  canvasSettings: {
    gridSize: 20,
    snapToGrid: true,
    minZoom: 0.45,
    maxZoom: 1.5,
    edgeAnimationSpeed: 1200,
    defaultNodeSpacing: 190,
  },
  challengeMeta: {
    challengeId: "university-rag-001",
    title: "Build a RAG assistant for Business Basics",
    description: "Assemble a PDF-based RAG pipeline that answers business basics questions from the provided document.",
    allowedNodeTypeIds: ["pdf-loader", "chunker", "embedder", "vector-db", "retriever", "reranker", "prompt-template", "llm"],
    maxNodes: 8,
    timeLimitSeconds: 360,
  },
};
