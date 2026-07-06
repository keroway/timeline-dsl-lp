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

const parsed = repoStatsPayloadSchema.safeParse(rawRepoStatsData);

if (!parsed.success) {
  console.warn(
    "[repo-stats] repo-stats.generated.json failed schema validation:",
    parsed.error.issues,
  );
}

const payload: RepoStatsPayload = parsed.success
  ? parsed.data
  : {
      repository: "",
      source: "",
      fetchedAt: null,
      stargazersCount: null,
      licenseSpdxId: null,
      contributorsCount: null,
    };

export const repoStatsPayload = payload;
export const stargazersCount: number | null = payload.stargazersCount;
export const licenseSpdxId: string | null = payload.licenseSpdxId;
export const contributorsCount: number | null = payload.contributorsCount;
