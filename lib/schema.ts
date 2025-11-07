import { z } from "zod";

export const skillMatrixSchema = z.object({
  title: z.string(),
  seniority: z.enum(["junior", "mid", "senior", "lead", "unknown"]),
  skills: z.object({
    frontend: z.string().array(),
    backend: z.string().array(),
    devops: z.string().array(),
    web3: z.string().array(),
    other: z.string().array(),
  }),
  mustHave: z.string().array(),
  niceToHave: z.string().array(),
  salary: z
    .object({
      currency: z.enum(["USD", "EUR", "PLN", "GBP"]),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  summary: z.string().max(300),
});

export type SkillMatrix = z.infer<typeof skillMatrixSchema>;

