"use client";

import { useEffect, useState } from "react";
import ResearchForm from "../components/ResearchForm";
import ResearchResults from "../components/ResearchResults";

const statusConfig = {
  supported: {
    label: "Supported",
    marker: "✓",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  contradicted: {
    label: "Contradicted",
    marker: "!",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    marker: "?",
    classes: "bg-amber-50 text-amber-800 ring-amber-200",
  },
};

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function isValidHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sources, setSources] = useState([]);
  const [claimChecks, setClaimChecks] = useState([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [mode, setMode] = useState("web");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [documentSources, setDocumentSources] = useState([]);

  useEffect(() => {
    if (!pdfUrl) return;

    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  function handleModeChange(nextMode) {
    if (loading || uploadLoading) return;

    if (mode !== nextMode) {
      setAnswer("");
      setProvider("");
      setSources([]);
      setClaimChecks([]);
      setDocumentSources([]);
      setCopyMessage("");
    }

    setMode(nextMode);
    setError("");
  }

  async function handleResearch(event) {
    event.preventDefault();

    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setProvider("");
    setSources([]);
    setClaimChecks([]);
    setError("");
    setCopyMessage("");

    try {
      const response = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Research request failed.",
        );
      }

      if (!data.success || typeof data.answer !== "string") {
        throw new Error("The server returned an invalid research response.");
      }

      setAnswer(data.answer);
      setProvider(data.provider || "AI");
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setClaimChecks(Array.isArray(data.claimChecks) ? data.claimChecks : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile || uploadLoading) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setUploadLoading(true);
    setError("");
    setDocumentId("");
    setDocumentSources([]);

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "PDF upload failed.");
      }

      setDocumentId(data.documentId);
      setMode("documents");
      console.log("Uploaded document ID:", data.documentId);
    } catch (err) {
      setError(err.message || "Unable to upload the PDF.");
    } finally {
      setUploadLoading(false);
    }
  }

  // async function handleAskDocument(event) {
  //   event.preventDefault();

  //   if (!question.trim() || loading) return;

  async function handleAskDocument(event) {
    event.preventDefault();

    if (!question.trim() || loading) return;

    if (!documentId) {
      setError("Please upload a PDF before asking a question.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setProvider("");
    setSources([]);
    setClaimChecks([]);
    setDocumentSources([]);
    setError("");
    setCopyMessage("");

    try {
      const response = await fetch(`${API_URL}/api/documents/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          documentId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Document question failed.");
      }

      setAnswer(data.answer);
      setProvider(data.provider || "AI");
      setDocumentSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      setError(err.message || "Unable to answer from your documents.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopyMessage("Answer copied!");
    } catch {
      setError("Could not copy the answer. Please copy it manually.");
      setCopyMessage("");
    }
  }

  const verificationSummary = claimChecks.reduce(
    (summary, item) => {
      const status = normalizeStatus(item.status);

      if (status === "supported") {
        summary.supported += 1;
      } else if (status === "contradicted") {
        summary.contradicted += 1;
      } else {
        summary.uncertain += 1;
      }

      return summary;
    },
    {
      supported: 0,
      contradicted: 0,
      uncertain: 0,
    },
  );

  const validSources = sources.filter(
    (source) =>
      source && typeof source.url === "string" && isValidHttpUrl(source.url),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7fc] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_68%)]"
      />
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 shadow-[0_2px_12px_-10px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2.5 sm:px-8">
          <a href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-indigo-200/70 transition group-hover:rotate-[-4deg]">
              <span aria-hidden="true">✳</span>
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-[15px]">
                ResearchPilot
              </h1>
              <p className="text-[10px] leading-4 text-slate-500">
                AI-powered research workspace
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            Research assistant
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-7 sm:px-8 sm:pt-9">
        {/* Hero and question form */}
        <ResearchForm
          question={question}
          setQuestion={setQuestion}
          mode={mode}
          handleResearch={handleResearch}
          handleAskDocument={handleAskDocument}
          handleModeChange={handleModeChange}
          loading={loading}
          uploadLoading={uploadLoading}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          setPdfUrl={setPdfUrl}
          setPdfPage={setPdfPage}
          setPdfViewerOpen={setPdfViewerOpen}
          setError={setError}
          documentId={documentId}
          handleUpload={handleUpload}
        />

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
          >
            <p className="font-semibold">Research could not be completed</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <section
            aria-live="polite"
            className="mx-auto mt-8 max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                ✳
              </div>

              <div>
                <h3 className="font-semibold">Working on your research</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your answer will appear here when it is ready.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
            </div>
          </section>
        )}

        <ResearchResults
          answer={answer}
          provider={provider}
          claimChecks={claimChecks}
          validSources={validSources}
          pdfUrl={pdfUrl}
          mode={mode}
          documentSources={documentSources}
          pdfViewerOpen={pdfViewerOpen}
          pdfPage={pdfPage}
          setPdfPage={setPdfPage}
          setPdfViewerOpen={setPdfViewerOpen}
          handleCopy={handleCopy}
          copyMessage={copyMessage}
          verificationSummary={verificationSummary}
          sources={sources}
          normalizeStatus={normalizeStatus}
          statusConfig={statusConfig}
          isValidHttpUrl={isValidHttpUrl}
        />

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200/80 pt-5 text-center text-[11px] text-slate-400">
          ResearchPilot · Built for curious minds
        </footer>
      </div>
    </main>
  );
}
