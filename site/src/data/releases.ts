import { z } from "zod";
import rawReleasesData from "./releases.generated.json";

const releaseSchema = z.object({
  tagName: z.string().min(1),
  name: z.string(),
  publishedAt: z.string(),
  url: z.string(),
  body: z.string(),
});

const releasesPayloadSchema = z.object({
  repository: z.string(),
  source: z.string(),
  fetchedAt: z.string().nullable(),
  latest: releaseSchema.nullable(),
  releases: z.array(releaseSchema),
});

export type Release = z.infer<typeof releaseSchema>;
export type ReleasesPayload = z.infer<typeof releasesPayloadSchema>;

export function parseReleasesPayload(raw: unknown): ReleasesPayload {
  const parsed = releasesPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[releases] releases.generated.json failed schema validation: ${JSON.stringify(parsed.error.issues)}`,
    );
  }
  return parsed.data;
}

const payload: ReleasesPayload = parseReleasesPayload(rawReleasesData);

export const releasesPayload = payload;
export const releases: Release[] = payload.releases;
export const latest: Release | null = payload.latest;
export const fetchedAt: string | null = payload.fetchedAt;
export const repository: string = payload.repository;
