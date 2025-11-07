import { skillMatrixSchema, type SkillMatrix } from "@/lib/schema";

const SENIORITY_KEYWORDS: Record<SkillMatrix["seniority"], RegExp> = {
  junior: /\bjunior\b/i,
  mid: /\bmid(?:-level)?\b/i,
  senior: /\bsenior\b/i,
  lead: /\blead(?:ing)?\b/i,
  unknown: /$^/, // never matches
};

const CATEGORY_KEYWORDS: Record<keyof SkillMatrix["skills"], string[]> = {
  frontend: ["react", "vue", "angular", "next"],
  backend: ["node", "express", "django", "nest"],
  devops: ["docker", "aws", "ci", "kubernetes"],
  web3: ["solidity", "wagmi", "viem", "merkle", "staking"],
  other: [],
};

const EXTRA_TECH_KEYWORDS = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "graphql",
  "rest",
  "sql",
  "redis",
  "postgres",
  "mysql",
  "tailwind",
  "sass",
  "terraform",
  "gcp",
  "azure",
];

type SalaryTuple = {
  currency: "USD" | "EUR" | "PLN" | "GBP";
  min?: number;
  max?: number;
};

const BULLET_REGEX = /^\s*(?:[-*•]|\d+\.)\s*(.+)$/;

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

const uniq = (values: Iterable<string>) => Array.from(new Set(values));

const findTitle = (jd: string) => {
  const namedMatch = jd.match(/(?:title|role|position)\s*[:\-]\s*(.+)/i);
  if (namedMatch?.[1]) {
    return normalize(namedMatch[1]);
  }

  const firstLine = jd
    .split(/\r?\n/)
    .map((line) => normalize(line))
    .find((line) => line.length > 0);

  if (firstLine && firstLine.length <= 80) {
    return firstLine;
  }

  return "Job Opportunity";
};

const inferSeniority = (jd: string): SkillMatrix["seniority"] => {
  for (const [level, regex] of Object.entries(SENIORITY_KEYWORDS)) {
    if (regex.test(jd)) {
      return level as SkillMatrix["seniority"];
    }
  }
  return "unknown";
};

const tokenise = (jd: string) =>
  jd
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#+/\.\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

const categorizeSkills = (tokens: string[]) => {
  const skillBuckets: SkillMatrix["skills"] = {
    frontend: [],
    backend: [],
    devops: [],
    web3: [],
    other: [],
  };

  const categorized = new Set<string>();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    keyof SkillMatrix["skills"],
    string[],
  ][]) {
    for (const keyword of keywords) {
      if (tokens.includes(keyword)) {
        skillBuckets[category].push(keyword);
        categorized.add(keyword);
      }
    }
  }

  const otherCandidates = new Set(
    [...tokens].filter((token) => {
      if (token.length < 3) return false;
      if (/^\d+$/.test(token)) return false;
      if (categorized.has(token)) return false;
      return EXTRA_TECH_KEYWORDS.includes(token);
    }),
  );

  skillBuckets.other.push(...otherCandidates);

  for (const key of Object.keys(skillBuckets) as (keyof SkillMatrix["skills"])[]) {
    skillBuckets[key] = uniq(skillBuckets[key]);
  }

  return skillBuckets;
};

const parseSalary = (jd: string): SalaryTuple | undefined => {
  const currencySymbolMap: Record<string, SalaryTuple["currency"]> = {
    "$": "USD",
    "usd": "USD",
    "€": "EUR",
    "eur": "EUR",
    "£": "GBP",
    "gbp": "GBP",
    "pln": "PLN",
    "zl": "PLN",
    "zł": "PLN",
  } as const;

  const salaryRegex = /(?:(USD|EUR|PLN|GBP)|([$€£]))?\s*\$?(\d{2,5})([kK])?(?:\s*(?:-|to)\s*\$?(\d{2,5})([kK])?)?(?:\s*\/?(?:year|month))?/i;
  const match = jd.match(salaryRegex);
  if (!match) return undefined;

  const [, currencyText, symbolText, minRaw, minSuffix, maxRaw, maxSuffix] = match;

  const currencyKey = currencyText?.toLowerCase() ?? symbolText ?? "";
  const currency = currencySymbolMap[currencyKey];

  if (!currency) return undefined;

  const toNumber = (raw?: string, suffix?: string) => {
    if (!raw) return undefined;
    const value = Number(raw);
    if (Number.isNaN(value)) return undefined;
    return suffix ? value * 1000 : value;
  };

  const min = toNumber(minRaw, minSuffix);
  const max = toNumber(maxRaw, maxSuffix);

  if (!min && !max) return undefined;

  if (min && max && max < min) {
    return { currency, min: max, max: min };
  }

  return { currency, min: min ?? undefined, max: max ?? undefined };
};

const extractBulletSections = (jd: string) => {
  const lines = jd.split(/\r?\n/);
  let activeSection: "must" | "nice" | "other" = "other";
  const sections = {
    must: [] as string[],
    nice: [] as string[],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lowered = line.toLowerCase();

    if (/^(requirements|must[-\s]?have|qualifications|required skills?)\b/.test(lowered)) {
      activeSection = "must";
      continue;
    }
    if (/^(nice[-\s]?to[-\s]?have|preferred|bonus|optional)\b/.test(lowered)) {
      activeSection = "nice";
      continue;
    }

    const bulletMatch = line.match(BULLET_REGEX);
    if (bulletMatch) {
      const item = normalize(bulletMatch[1]);
      if (activeSection === "must") {
        sections.must.push(item);
      } else if (activeSection === "nice") {
        sections.nice.push(item);
      }
    }
  }

  return {
    must: uniq(sections.must),
    nice: uniq(sections.nice),
  };
};


const buildSummary = (payload: SkillMatrix) => {
  const parts: string[] = [];

  const roleDescriptor =
    payload.seniority !== "unknown" ? `${payload.seniority} role` : "role";

  parts.push(`Detected ${roleDescriptor}: ${payload.title}.`);

  const skillHighlights = Object.entries(payload.skills)
    .filter(([, values]) => values.length)
    .map(([category, values]) => `${category} (${values.slice(0, 3).join(", ")})`);

  if (skillHighlights.length) {
    parts.push(`Key skills include ${skillHighlights.join(", ")}.`);
  }

  if (payload.mustHave.length) {
    parts.push(`Core requirements mention ${payload.mustHave.slice(0, 3).join(", ")}.`);
  }

  if (payload.salary) {
    const rangeParts = [] as string[];
    if (payload.salary.min) rangeParts.push(`${payload.salary.min}`);
    if (payload.salary.max) rangeParts.push(`${payload.salary.max}`);
    const range = rangeParts.join("-");
    parts.push(`Advertised salary in ${payload.salary.currency}${range ? `: ${range}` : ""}.`);
  }

  const summary = parts.join(" ").trim();
  const words = summary.split(/\s+/);

  const wordLimited = words.length <= 60 ? summary : words.slice(0, 60).join(" ") + "…";

  if (wordLimited.length <= 300) {
    return wordLimited;
  }

  return wordLimited.slice(0, 297).trimEnd() + "…";
};

export const extractSkillMatrix = (jd: string): SkillMatrix => {
  const cleanedJD = jd.trim();

  const title = findTitle(cleanedJD);
  const seniority = inferSeniority(cleanedJD);
  const tokens = tokenise(cleanedJD);
  const skills = categorizeSkills(tokens);
  const { must, nice } = extractBulletSections(cleanedJD);
  const salary = parseSalary(cleanedJD);

  const draft: SkillMatrix = {
    title,
    seniority,
    skills,
    mustHave: must,
    niceToHave: nice,
    salary,
    summary: "",
  };

  draft.summary = buildSummary(draft);

  const validated = skillMatrixSchema.safeParse(draft);
  if (!validated.success) {
    throw new Error("Fallback extractor produced invalid payload");
  }

  return validated.data;
};

