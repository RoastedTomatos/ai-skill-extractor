import { skillMatrixSchema } from "./schema";
import type { SkillMatrix } from "./schema";

export async function fetchSkillMatrixWithAI(jd: string): Promise<SkillMatrix> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OpenAI API key.");

  try {
    const prompt = `
You are a strict JSON parser.
Analyze the following Job Description and return a JSON object that matches this schema:

{
  title: string
  seniority: "junior" | "mid" | "senior" | "lead" | "unknown"
  skills: {
    frontend: string[]
    backend: string[]
    devops: string[]
    web3: string[]
    other: string[]
  }
  mustHave: string[]
  niceToHave: string[]
  salary?: { currency: "USD"|"EUR"|"PLN"|"GBP", min?: number, max?: number }
  summary: string
}

Job Description:
"""
${jd}
"""
Return only valid JSON.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

    const data = await res.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error("Empty AI response.");

    try {
      const json = JSON.parse(message);
      return skillMatrixSchema.parse(json);
    } catch {
      const retryPrompt = `
Fix this JSON to strictly match the schema above, no extra text:
${message}
`;
      const retryRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: retryPrompt }],
          temperature: 0,
        }),
      });

      const retryData = await retryRes.json();
      const retryMsg = retryData.choices?.[0]?.message?.content?.trim();
      if (!retryMsg) throw new Error("No valid JSON after retry.");

      const fixed = JSON.parse(retryMsg);
      return skillMatrixSchema.parse(fixed);
    }
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Unexpected error in AI extraction.");
  }
}
