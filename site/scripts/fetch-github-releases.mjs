import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GITHUB_API_BASE,
  handleFetchFailure,
  writeJsonPayload,
} from "./lib/generated-data.mjs";

const REPOSITORY = "keroway/timeline-dsl";
const OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/releases.generated.json"
);
const API_URL = `${GITHUB_API_BASE}/repos/${REPOSITORY}/releases?per_page=100`;

function createPayload({ fetchedAt = null, releases = [] } = {}) {
  return {
    repository: REPOSITORY,
    source: "github-releases",
    fetchedAt,
    latest: releases[0] ?? null,
    releases,
  };
}

function normalizeRelease(release) {
  return {
    tagName: String(release.tag_name ?? ""),
    name: String(release.name || release.tag_name || ""),
    publishedAt: String(release.published_at ?? ""),
    url: String(release.html_url ?? ""),
    body: String(release.body ?? ""),
  };
}

function getNextPageUrl(response) {
  const link = response.headers.get("link");
  const nextLink = link
    ?.split(",")
    .find((value) => value.includes('rel="next"'));

  return nextLink?.match(/<([^>]+)>/)?.[1] ?? null;
}

async function fetchReleases() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "timeline-dsl-lp-release-fetcher",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const releases = [];
  let url = API_URL;

  while (url) {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub Releases API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("GitHub Releases API response was not an array");
    }

    releases.push(...data.map(normalizeRelease));
    url = getNextPageUrl(response);
  }

  return releases.filter((release) => release.tagName);
}

async function writePayload(payload) {
  await writeJsonPayload(OUTPUT_PATH, payload);
}

try {
  const releases = await fetchReleases();
  await writePayload(
    createPayload({ fetchedAt: new Date().toISOString(), releases })
  );
  console.log(`Wrote ${releases.length} releases to ${OUTPUT_PATH}`);
} catch (error) {
  // 空データで既存ファイルを上書きしない。失敗した週は「更新されない」で済ませる (#577)。
  await handleFetchFailure({
    outputPath: OUTPUT_PATH,
    error,
    createEmptyPayload: createPayload,
  });
  process.exitCode = 1;
}
