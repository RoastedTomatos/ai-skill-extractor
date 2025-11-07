import { skillMatrixSchema, type SkillMatrix } from "@/lib/schema";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are an assistant that extracts structured hiring insights from job descriptions.
You MUST return ONLY valid JSON that matches the exact schema provided.
Do NOT include markdown code fences, comments, or any text outside the JSON object.`;

const JSON_SCHEMA_EXAMPLE = `{
  "title": "string (job title, e.g. 'Senior Frontend Developer')",
  "seniority": "one of: 'junior' | 'mid' | 'senior' | 'lead' | 'unknown'",
  "skills": {
    "frontend": ["array of strings, e.g. ['react', 'vue', 'next']"],
    "backend": ["array of strings, e.g. ['node', 'express', 'django']"],
    "devops": ["array of strings, e.g. ['docker', 'aws', 'kubernetes']"],
    "web3": ["array of strings, e.g. ['solidity', 'wagmi', 'viem']"],
    "other": ["array of strings for other technologies"]
  },
  "mustHave": ["array of strings for required skills/qualifications"],
  "niceToHave": ["array of strings for preferred skills/qualifications"],
  "salary": {
    "currency": "one of: 'USD' | 'EUR' | 'PLN' | 'GBP'",
    "min": "optional number (minimum salary)",
    "max": "optional number (maximum salary)"
  },
  "summary": "string (max 300 characters, concise summary of the role)"
}`;

const baseUserPrompt = `Analyze the job description below and extract structured information.

REQUIRED JSON SCHEMA:
${JSON_SCHEMA_EXAMPLE}

IMPORTANT RULES:
- ALL fields except "salary" are REQUIRED
- "title" must be a non-empty string
- "seniority" must be exactly one of: "junior", "mid", "senior", "lead", or "unknown"
- "skills" must be an object with all 5 keys: frontend, backend, devops, web3, other (each an array of strings)
- "mustHave" and "niceToHave" must be arrays of strings (can be empty arrays)
- "summary" must be a string with max 300 characters
- "salary" is optional, but if present must include "currency" and optionally "min"/"max" numbers

Return ONLY the JSON object, no markdown, no code fences, no explanation.

Job Description:
`;

const stripJson = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return trimmed;
};

const parseResponse = (content: string) => {
  const jsonText = stripJson(content);
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    // If JSON parsing fails, try to extract JSON from the response
    // Sometimes AI includes extra text before/after JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to throw original error
      }
    }
    throw new Error(`Failed to parse JSON from AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

const invokeOpenAI = async (jd: string, promptSuffix = "") => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${baseUserPrompt}${jd}\n${promptSuffix}`.trim() },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI response missing content");
  }

  return parseResponse(content);
};

const formatZodErrors = (error: unknown): string => {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
    const errors = zodError.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `- ${path}: ${issue.message}`;
    });
    return `Validation errors:\n${errors.join("\n")}`;
  }
  return "Schema validation failed";
};

export const fetchSkillMatrixWithAI = async (jd: string): Promise<SkillMatrix> => {
  let lastError: unknown;
  let lastValidationErrors: string | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let promptSuffix = "";
      if (attempt === 1 && lastValidationErrors) {
        promptSuffix = `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastValidationErrors}\n\nPlease fix all the errors above and return valid JSON.`;
      }

      const result = await invokeOpenAI(jd, promptSuffix);
      const parsed = skillMatrixSchema.safeParse(result);

      if (parsed.success) {
        return parsed.data;
      }

      lastValidationErrors = formatZodErrors(parsed.error);
      lastError = parsed.error;
    } catch (error) {
      if (error instanceof SyntaxError) {
        lastError = new Error(`Invalid JSON response from AI: ${error.message}`);
      } else {
        lastError = error;
      }
    }
  }

  // Format a user-friendly error message
  if (lastError && typeof lastError === "object" && "issues" in lastError) {
    const friendlyMessage = formatZodErrors(lastError);
    throw new Error(`AI response validation failed:\n${friendlyMessage}`);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to parse AI response into skill matrix");
};

