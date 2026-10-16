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
      const response = await fetch("http://localhost:5000/api/research", {
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
        throw new Error(data.error || "Research request failed.");
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
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              R
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                ResearchPilot
              </h1>
              <p className="text-xs text-slate-500">
                Your AI research workspace
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AI research assistant
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
        {/* Hero and question form */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-medium text-indigo-700 shadow-sm">
            <span>✳</span>
            Turn questions into insights
          </div>

          <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Research smarter.
            <span className="mt-1 block bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Understand deeper.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            Explore complex topics, discover insights, and get AI-generated
            research answers in one focused workspace.
          </p>

          <form
            onSubmit={handleResearch}
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-[0_18px_60px_-25px_rgba(79,70,229,0.22)] transition focus-within:border-indigo-300 sm:p-5"
          >
            <label
              htmlFor="question"
              className="mb-3 block px-1 text-sm font-semibold text-slate-700"
            >
              What would you like to discover?
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
              placeholder="Ask a question, compare technologies, or explore an idea..."
              maxLength={2000}
              required
              rows={4}
              className="w-full resize-y rounded-2xl border border-transparent bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-100 focus:bg-white sm:text-base"
            />

            <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                {question.length}/2000 characters · Shift + Enter for a new line
              </p>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Researching...
                  </>
                ) : (
                  <>
                    Start Research <span aria-hidden="true">↗</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggested questions */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs text-slate-400">Try asking</span>

            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">Research could not be completed</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <section
            aria-live="polite"
            className="mx-auto mt-12 max-w-3xl rounded-3xl border border-slate-200 bg-white p-8"
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

        {/* Research report */}
        {answer && (
          <section className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  <span>✳</span>
                  Research report
                </div>

                <h3 className="text-2xl font-semibold tracking-tight">
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
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
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

            <div className="px-6 py-7 sm:px-10 sm:py-9">
              <div className="prose prose-slate max-w-none break-words text-[15px] leading-8 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:mt-8 prose-h2:text-2xl prose-h3:text-xl prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-indigo-300 prose-blockquote:text-slate-600 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium prose-code:text-indigo-700 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-table:block prose-table:overflow-x-auto prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3 prose-hr:border-slate-200">
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
              Review important claims and verify sources before relying on them.
            </div>
          </section>
        )}

        {/* Claim verification */}
        {claimChecks.length > 0 && (
          <section
            aria-labelledby="verification-heading"
            className="mx-auto mt-8 max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Evidence review
              </p>

              <h3
                id="verification-heading"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                Claim Verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                AI-assisted checks against retrieved source content. These
                results may be incomplete and are not definitive proof.
              </p>
            </div>

            {/* Summary counts */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm text-emerald-700">Supported</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-800">
                  {verificationSummary.supported}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                <p className="text-sm text-red-700">Contradicted</p>
                <p className="mt-1 text-2xl font-semibold text-red-800">
                  {verificationSummary.contradicted}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-sm text-amber-800">
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
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200"
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
                                  className="break-all text-sm text-indigo-600 hover:underline"
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
            className="mx-auto mt-8 max-w-4xl rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8"
          >
            <h3
              id="sources-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Research Sources
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({validSources.length})
              </span>
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sources retrieved for this research. A source being listed does
              not automatically mean it supports every claim.
            </p>

            <ul className="mt-4 space-y-3">
              {validSources.map((source, index) => (
                <li
                  key={`${source.url}-${index}`}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200"
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words font-medium text-indigo-600 hover:underline"
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

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          ResearchPilot · Built for curious minds
        </footer>
      </div>
    </main>
  );
}
