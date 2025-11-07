'use client'

import { useState } from "react"

export default function Home() {
  const [jd, setJd] = useState("")

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            AI Skill Extractor
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Paste any job description and get a validated JSON skill matrix plus a concise summary.
            Works with or without an OpenAI API key.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <form className="space-y-6">
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
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Analyze JD
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
