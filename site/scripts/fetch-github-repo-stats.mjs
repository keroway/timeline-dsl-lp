import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY = "keroway/timeline-dsl";
const OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/repo-stats.generated.json",
);
const REPO_API_URL = `https://api.github.com/repos/${REPOSITORY}`;
const CONTRIBUTORS_API_URL = `https://api.github.com/repos/${REPOSITORY}/contributors?per_page=1&anon=true`;

function createPayload({
  fetchedAt = null,
  stargazersCount = null,
  licenseSpdxId = null,
  contributorsCount = null,
} = {}) {
  return {
    repository: REPOSITORY,
    source: "github-repo-stats",
    fetchedAt,
    stargazersCount,
    licenseSpdxId,
    contributorsCount,
  };
}

function buildHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "timeline-dsl-lp-repo-stats-fetcher",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function getLastPageNumber(response) {
  const link = response.headers.get("link");
  const lastLink = link?.split(",").find((value) => value.includes('rel="last"'));
  const match = lastLink?.match(/[?&]page=(\d+)/);

  return match ? Number(match[1]) : null;
}

async function fetchRepo(headers) {
  const response = await fetch(REPO_API_URL, { headers });

  if (!response.ok) {
    throw new Error(`GitHub Repo API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    stargazersCount: Number.isFinite(data.stargazers_count) ? data.stargazers_count : null,
    licenseSpdxId: typeof data.license?.spdx_id === "string" ? data.license.spdx_id : null,
  };
}

async function fetchContributorsCount(headers) {
  const response = await fetch(CONTRIBUTORS_API_URL, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub Contributors API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const lastPage = getLastPageNumber(response);

  if (lastPage) {
    return lastPage;
  }

  const data = await response.json();

  return Array.isArray(data) ? data.length : null;
}

async function writePayload(payload) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

try {
  const headers = buildHeaders();
  const [repo, contributorsCount] = await Promise.all([
    fetchRepo(headers),
    fetchContributorsCount(headers),
  ]);

  await writePayload(
    createPayload({
      fetchedAt: new Date().toISOString(),
      stargazersCount: repo.stargazersCount,
      licenseSpdxId: repo.licenseSpdxId,
      contributorsCount,
    }),
  );
  console.log(`Wrote repo stats to ${OUTPUT_PATH}`);
} catch (error) {
  await writePayload(createPayload());
  console.warn(error instanceof Error ? error.message : error);
  console.warn(`Wrote fallback repo stats data to ${OUTPUT_PATH}`);
}
