"use client";

const suggestions = [
  "Compare LangGraph vs CrewAI",
  "How does RAG work?",
  "Latest AI agent architectures",
];

export default function ResearchForm({
  question,
  setQuestion,
  mode,
  handleResearch,
  handleAskDocument,
  handleModeChange,
  loading,
  uploadLoading,
  selectedFile,
  setSelectedFile,
  setPdfUrl,
  setPdfPage,
  setPdfViewerOpen,
  setError,
  documentId,
  handleUpload,
}) {
  return (
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
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  setPdfUrl(file ? URL.createObjectURL(file) : null);
                  setPdfPage(1);
                  setPdfViewerOpen(false);
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
  );
}
