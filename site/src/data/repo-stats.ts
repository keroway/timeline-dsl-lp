import { z } from "zod";
import rawRepoStatsData from "./repo-stats.generated.json";

const repoStatsPayloadSchema = z.object({
  repository: z.string(),
  source: z.string(),
  fetchedAt: z.string().nullable(),
  stargazersCount: z.number().nullable(),
  licenseSpdxId: z.string().nullable(),
  contributorsCount: z.number().nullable(),
});

export type RepoStatsPayload = z.infer<typeof repoStatsPayloadSchema>;

export function parseRepoStatsPayload(raw: unknown): RepoStatsPayload {
  const parsed = repoStatsPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[repo-stats] repo-stats.generated.json failed schema validation: ${JSON.stringify(parsed.error.issues)}`,
    );
  }
  return parsed.data;
}

const payload: RepoStatsPayload = parseRepoStatsPayload(rawRepoStatsData);

export const repoStatsPayload = payload;
export const stargazersCount: number | null = payload.stargazersCount;
export const licenseSpdxId: string | null = payload.licenseSpdxId;
export const contributorsCount: number | null = payload.contributorsCount;
