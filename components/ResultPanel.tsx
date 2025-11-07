"use client";

import { useState } from "react";

import type { SkillMatrix } from "@/lib/schema";

type ResultPanelProps = {
  data: SkillMatrix;
};

export function ResultPanel({ data }: ResultPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy JSON", error);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-100">Skill Matrix</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
        >
          {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy JSON"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-black/60 p-4 text-sm text-emerald-200 shadow-inner">
        <code>{json}</code>
      </pre>
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-sm text-slate-200">{data.summary}</p>
      </div>
    </section>
  );
}

