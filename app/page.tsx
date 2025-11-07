"use client";

import { useState, type FormEvent } from "react";

import { ErrorToast } from "@/components/ErrorToast";
import { ResultPanel } from "@/components/ResultPanel";
import type { SkillMatrix } from "@/lib/schema";

type ExtractResponse = {
  data: SkillMatrix | null;
  error?: string | null;
};

export default function Home() {
  const [jd, setJd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SkillMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jd.trim()) {
      setError("Please paste a job description before analyzing.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiNotice(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });

      const payload = (await response.json()) as ExtractResponse;

      if (!response.ok && !payload.data) {
        setError(payload.error ?? "Unexpected error while analyzing JD.");
        setResult(null);
        return;
      }

      if (payload.data) {
        setResult(payload.data);
      }

      if (payload.error) {
        setAiNotice(payload.error);
      }

      if (!payload.data) {
        setError(payload.error ?? "Could not extract skill matrix.");
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError("Network error while contacting the extractor service.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">AI Skill Extractor</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Paste any job description and get a validated JSON skill matrix plus a concise summary. Works with or without
            an OpenAI API key.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Job description</span>
              <textarea
                className="h-56 w-full resize-y rounded-xl border border-slate-800 bg-black/30 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/60"
                value={jd}
                onChange={(event) => setJd(event.target.value)}
                placeholder="Paste the full job description here..."
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" aria-hidden />
                    Analyzing…
                  </span>
                ) : (
                  "Analyze JD"
                )}
              </button>

              {aiNotice ? (
                <p className="text-xs text-amber-300/90">
                  AI notice: {aiNotice}
                </p>
              ) : null}
            </div>
          </form>

          {error ? (
            <div className="mt-6">
              <ErrorToast message={error} onDismiss={() => setError(null)} />
            </div>
          ) : null}
        </section>

        {result ? (
          <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-inner shadow-black/50">
            <ResultPanel data={result} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

