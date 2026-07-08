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

const parsed = releasesPayloadSchema.safeParse(rawReleasesData);

if (!parsed.success) {
  console.warn("[releases] releases.generated.json failed schema validation:", parsed.error.issues);
}

const payload: ReleasesPayload = parsed.success
  ? parsed.data
  : {
      repository: "",
      source: "",
      fetchedAt: null,
      latest: null,
      releases: [],
    };

export const releasesPayload = payload;
export const releases: Release[] = payload.releases;
export const latest: Release | null = payload.latest;
export const fetchedAt: string | null = payload.fetchedAt;
export const repository: string = payload.repository;
