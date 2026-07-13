import { FileUp, Play, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { useGraphStore } from "../hooks/useGraphStore";
import { useSimulationTrace } from "../hooks/useSimulationTrace";
import { serializeGraph } from "../services/serializeGraph";
import { submitPipeline } from "../services/submitPipeline";

export function SubmitPanel() {
  const [documentName, setDocumentName] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [query, setQuery] = useState("What are the most relevant policy details?");
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const runState = useGraphStore((state) => state.runState);
  const errorMessage = useGraphStore((state) => state.errorMessage);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const setRunState = useGraphStore((state) => state.setRunState);
  const setLastResponse = useGraphStore((state) => state.setLastResponse);
  const setErrorMessage = useGraphStore((state) => state.setErrorMessage);
  const clearEventLog = useGraphStore((state) => state.clearEventLog);
  const runSimulationTrace = useSimulationTrace();
  const isRag = config.id === "rag-builder";

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setDocumentName(file.name);
    if (file.type.includes("text") || file.name.endsWith(".md") || file.name.endsWith(".csv")) {
      setDocumentText(await file.text());
      return;
    }
    setDocumentText(`Uploaded file: ${file.name}. Binary/PDF parsing will be handled by backend integration.`);
  }

  async function handleSubmit() {
    try {
      if (isRag && !documentName && !documentText.trim()) {
        setErrorMessage("Upload or describe a document before running the RAG simulation.");
        return;
      }
      if (isRag && !query.trim()) {
        setErrorMessage("Enter a query before running the RAG simulation.");
        return;
      }
      setRunState("submitting");
      setErrorMessage(null);
      clearEventLog();
      const payload = serializeGraph(nodes, edges, config, "demo-user", isRag ? {
        documentName,
        documentText,
        query,
      } : undefined);
      const response = await submitPipeline(payload);
      setLastResponse(response);
      await runSimulationTrace(response.trace);
    } catch (error) {
      setRunState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown submit error");
    }
  }

  const busy = runState === "submitting" || runState === "running";

  return (
    <section className="rounded-lg border border-white/8 bg-[#101820] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Submit Graph</p>
          <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">POST shape is ready for `/api/submit`; local fake mode runs by default.</p>
        </div>
        <Play className="h-5 w-5 text-[#66FCF1]" />
      </div>

      {isRag && (
        <div className="mt-4 space-y-3 rounded-lg border border-[#66FCF1]/10 bg-[#0B0C10] p-3">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#45A29E]">
              <FileUp className="h-3.5 w-3.5" />
              Document
            </span>
            <input
              type="file"
              className="block w-full text-xs text-[#C5C6C7]/70 file:mr-3 file:rounded-md file:border-0 file:bg-[#66FCF1] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0B0C10]"
              onChange={(event) => void handleFileChange(event.target.files?.[0])}
            />
          </label>
          <textarea
            value={documentText}
            onChange={(event) => setDocumentText(event.target.value)}
            placeholder="Paste document text here, or upload a text/markdown file."
            className="min-h-24 w-full resize-y rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-xs leading-5 text-[#C5C6C7] outline-none transition placeholder:text-[#C5C6C7]/35 focus:border-[#66FCF1]/50"
          />
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Query</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-xs text-[#C5C6C7] outline-none transition focus:border-[#66FCF1]/50"
            />
          </label>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-400/20 bg-red-950/30 px-3 py-2 text-xs text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#66FCF1] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition hover:bg-[#8ffdf6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {busy ? "Running" : "Submit"}
        </button>
        <button
          type="button"
          onClick={resetGraph}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2.5 text-[#C5C6C7] transition hover:border-[#66FCF1]/40 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Reset graph"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
