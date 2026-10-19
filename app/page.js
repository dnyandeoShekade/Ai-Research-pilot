"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const suggestions = [
  "Compare LangGraph vs CrewAI",
  "How does RAG work?",
  "Latest AI agent architectures",
];

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
  const [documentId, setDocumentId] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [documentSources, setDocumentSources] = useState([]);

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
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold text-violet-700 shadow-sm shadow-violet-100/70">
            <span>✳</span>A clearer way to explore complex ideas
          </div>

          <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.045em] text-slate-950 sm:text-5xl">
            Find the signal.
            <span className="mt-1 block bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Understand the story.
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">
            Ask a question and get a thoughtful, source-backed research brief
            with key claims checked along the way.
          </p>

          <form
            onSubmit={mode === "web" ? handleResearch : handleAskDocument}
            className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-3 text-left shadow-[0_20px_60px_-32px_rgba(49,46,129,0.3)] transition duration-200 focus-within:border-violet-300 focus-within:shadow-[0_20px_60px_-32px_rgba(99,102,241,0.4)] sm:p-4"
          >
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("web")}
                disabled={loading || uploadLoading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "web"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Web Research
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("documents")}
                disabled={loading || uploadLoading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "documents"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Ask My Documents
              </button>
            </div>

            {mode === "documents" && (
              <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <label
                  htmlFor="pdf-upload"
                  className="mb-2 block text-sm font-semibold"
                >
                  Upload a PDF document
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] || null);
                      setError("");
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadLoading || loading}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {uploadLoading ? "Uploading..." : "Upload PDF"}
                  </button>
                </div>

                {documentId && (
                  <p className="mt-3 break-all text-xs text-emerald-700">
                    PDF ready. Document ID: {documentId}
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Upload a PDF, wait for processing to finish, then ask
                  questions about its contents.
                </p>
              </div>
            )}

            <label
              htmlFor="question"
              className="mb-2 block px-1 text-xs font-semibold text-slate-800"
            >
              {mode === "web"
                ? "What are you researching today?"
                : "What would you like to know about your documents?"}
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask a question, compare approaches, or explore an idea..."
              maxLength={2000}
              required
              rows={3}
              className="w-full resize-y rounded-2xl border border-transparent bg-slate-50/90 p-3.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-100 focus:bg-white"
            />

            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-slate-400">
                {question.length}/2000 characters · Shift + Enter for a new line
              </p>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Researching...
                  </>
                ) : (
                  <>
                    {mode === "web" ? "Start Research" : "Ask Documents"}{" "}
                    <span aria-hidden="true">↗</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggested questions */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-400">
              Try asking
            </span>

            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

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

        {(answer ||
          claimChecks.length > 0 ||
          validSources.length > 0 ||
          (mode === "documents" && documentSources.length > 0)) && (
          <div className="mx-auto mt-8 grid w-full max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.85fr)] lg:items-start">
            {/* Research report */}
            {answer && (
              <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_55px_-38px_rgba(30,41,59,0.45)]">
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-br from-white via-white to-violet-50/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        ✳
                      </span>
                      Your research brief
                    </div>

                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                      Research Results
                    </h3>

                    {provider && (
                      <p className="mt-2 text-sm text-slate-500">
                        Generated by {provider}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    >
                      Copy answer
                    </button>

                    {copyMessage && (
                      <span role="status" className="text-xs text-emerald-700">
                        {copyMessage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 py-6 sm:px-8 sm:py-7">
                  <div className="prose prose-slate max-w-none break-words text-[15px] leading-8 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:mt-8 prose-h2:text-2xl prose-h3:text-xl prose-a:text-violet-700 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-violet-300 prose-blockquote:text-slate-600 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium prose-code:text-violet-700 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-table:block prose-table:overflow-x-auto prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3 prose-hr:border-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children, ...props }) => {
                          const safeHref = isValidHttpUrl(href || "")
                            ? href
                            : undefined;

                          return (
                            <a
                              {...props}
                              href={safeHref}
                              target={safeHref ? "_blank" : undefined}
                              rel={safeHref ? "noopener noreferrer" : undefined}
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-xs text-slate-500 sm:px-8">
                  Review important claims and verify sources before relying on
                  them.
                </div>
              </section>
            )}

            {mode === "documents" && documentSources.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Document Sources
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Retrieved passages used to answer your question.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {documentSources.map((source, index) => (
                    <article
                      key={`${source.filename}-${source.chunkIndex}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="break-words text-sm font-semibold text-violet-700">
                        {source.filename}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Chunk {source.chunkIndex}
                        {typeof source.similarity === "number"
                          ? ` · Similarity: ${(source.similarity * 100).toFixed(1)}%`
                          : ""}
                      </p>

                      {source.text && (
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {source.text}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <aside className="space-y-5">
              {/* Claim verification */}
              {claimChecks.length > 0 && (
                <section
                  aria-labelledby="verification-heading"
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_18px_55px_-38px_rgba(30,41,59,0.45)] sm:p-6"
                >
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                      Evidence review
                    </p>

                    <h3
                      id="verification-heading"
                      className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
                    >
                      Claim Verification
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      AI-assisted checks against retrieved source content. These
                      results may be incomplete and are not definitive proof.
                    </p>
                  </div>

                  {/* Summary counts */}
                  <div className="mb-6 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                      <p className="text-[11px] leading-4 text-emerald-700">
                        Supported
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-emerald-800">
                        {verificationSummary.supported}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3">
                      <p className="text-[11px] leading-4 text-red-700">
                        Contradicted
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-red-800">
                        {verificationSummary.contradicted}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                      <p className="text-[11px] leading-4 text-amber-800">
                        Uncertain / insufficient
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-amber-900">
                        {verificationSummary.uncertain}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {claimChecks.map((item, index) => {
                      const status = normalizeStatus(item.status);

                      const badge = statusConfig[status] || {
                        label: "Unverified",
                        marker: "?",
                        classes: "bg-slate-100 text-slate-700 ring-slate-200",
                      };

                      const evidenceUrls = Array.isArray(item.sourceUrls)
                        ? [...new Set(item.sourceUrls.filter(isValidHttpUrl))]
                        : [];

                      return (
                        <article
                          key={`${item.claim || "claim"}-${index}`}
                          className="rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Claim {index + 1}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${badge.classes}`}
                            >
                              <span aria-hidden="true">{badge.marker}</span>
                              {badge.label}
                            </span>
                          </div>

                          <p className="mt-4 break-words text-sm font-medium leading-7 text-slate-800">
                            {item.claim || "No claim text provided."}
                          </p>

                          {item.explanation && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Explanation
                              </p>

                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                {item.explanation}
                              </p>
                            </div>
                          )}

                          {evidenceUrls.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold text-slate-500">
                                Evidence sources
                              </p>

                              <ul className="space-y-2">
                                {evidenceUrls.map((url, sourceIndex) => {
                                  const matchingSource = sources.find(
                                    (source) => source.url === url,
                                  );

                                  return (
                                    <li key={`${url}-${sourceIndex}`}>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all text-sm text-violet-700 hover:underline"
                                      >
                                        {matchingSource?.title ||
                                          `Evidence source ${sourceIndex + 1}`}{" "}
                                        ↗
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Sources */}
              {validSources.length > 0 && (
                <section
                  aria-labelledby="sources-heading"
                  className="rounded-3xl border border-slate-200/90 bg-white px-5 py-5 shadow-[0_18px_55px_-38px_rgba(30,41,59,0.45)] sm:px-6"
                >
                  <h3
                    id="sources-heading"
                    className="text-lg font-semibold text-slate-950"
                  >
                    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-700">
                      ↗
                    </span>
                    Research Sources
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({validSources.length})
                    </span>
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sources retrieved for this research. A source being listed
                    does not automatically mean it supports every claim.
                  </p>

                  <ul className="mt-4 space-y-3">
                    {validSources.map((source, index) => (
                      <li
                        key={`${source.url}-${index}`}
                        className="rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
                      >
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words font-medium text-violet-700 hover:underline"
                        >
                          {index + 1}. {source.title || source.url}
                        </a>

                        {source.content && (
                          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                            {source.content
                              .replace(/\\#/g, "#")
                              .replace(/\\([*_[\]()])/g, "$1")
                              .slice(0, 220)}
                            {source.content.length > 220 ? "..." : ""}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200/80 pt-5 text-center text-[11px] text-slate-400">
          ResearchPilot · Built for curious minds
        </footer>
      </div>
    </main>
  );
}
