import { NextResponse } from "next/server";

import { fetchSkillMatrixWithAI } from "@/lib/ai";
import { extractSkillMatrix } from "@/lib/extractor";
import { skillMatrixSchema } from "@/lib/schema";

export const runtime = "nodejs";

type ExtractRequest = {
  jd?: string;
};

export async function POST(request: Request) {
  let jd: string | undefined;
  let aiError: string | undefined;

  try {
    const payload = (await request.json()) as ExtractRequest;
    jd = payload.jd?.trim();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (!jd) {
    return NextResponse.json(
      { data: null, error: "Job description is required." },
      { status: 400 },
    );
  }

  let result;

  if (process.env.OPENAI_API_KEY) {
    try {
      result = await fetchSkillMatrixWithAI(jd);
    } catch (error) {
      if (error instanceof Error) {
        aiError = error.message;
      } else {
        aiError = "AI extraction failed. Falling back to deterministic parser.";
      }
    }
  }

  if (!result) {
    try {
      result = extractSkillMatrix(jd);
    } catch (error) {
      const fallbackError = error instanceof Error ? error.message : "Fallback extractor failed.";
      return NextResponse.json(
        { data: null, error: aiError ?? fallbackError },
        { status: 500 },
      );
    }
  }

  const validation = skillMatrixSchema.safeParse(result);
  if (!validation.success) {
    return NextResponse.json(
      { data: null, error: "Extraction did not match the expected schema." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { data: validation.data, error: aiError ?? null },
    { status: aiError ? 207 : 200 },
  );
}

