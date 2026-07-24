// `pnpm check:full` — the local mirror of the site-build CI workflow's
// `RUN_FULL == 'true'` path. Not called from CI itself: CI keeps its own
// named steps (see .github/workflows/site-build.yml) so failures stay
// individually diagnosable and artifacts stay per-step. This script exists
// so a contributor can run the same gates locally with one command and a
// guaranteed-clean preview server lifecycle (started, health-polled, and
// always torn down — success, failure, or Ctrl-C).
//
// Requires Chromium for Playwright: `pnpm exec playwright install chromium`.

import { spawn } from "node:child_process";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = 30_000;
const READY_POLL_INTERVAL_MS = 500;

const STEPS = [
  {
    name: "pnpm check (lint / format / unit / build / bundle-size)",
    cmd: ["pnpm", ["check"]],
  },
  {
    name: "smoke:seo",
    cmd: ["pnpm", ["smoke:seo"]],
    env: { SEO_BASE_URL: BASE_URL },
  },
  {
    name: "smoke:i18n",
    cmd: ["pnpm", ["smoke:i18n"]],
    env: { I18N_BASE_URL: BASE_URL },
  },
  {
    name: "smoke:i18n:browser",
    cmd: ["pnpm", ["smoke:i18n:browser"]],
    env: { I18N_BASE_URL: BASE_URL },
  },
  {
    name: "smoke:playground",
    cmd: ["pnpm", ["smoke:playground"]],
    env: { PLAYGROUND_BASE_URL: BASE_URL },
  },
  {
    name: "smoke:playground:browser",
    cmd: ["pnpm", ["smoke:playground:browser"]],
    env: { PLAYGROUND_BASE_URL: BASE_URL },
  },
  {
    name: "smoke:a11y",
    cmd: ["pnpm", ["smoke:a11y"]],
    env: { A11Y_BASE_URL: BASE_URL },
  },
  {
    name: "test:visual (LP screenshot regression)",
    cmd: ["pnpm", ["test:visual"]],
  },
  {
    name: "lhci (Lighthouse CI)",
    cmd: ["pnpm", ["lhci"]],
    env: { LHCI_BASE_URL: BASE_URL },
  },
];

async function main() {
  // `pnpm check` doesn't need the preview server, so run it before starting one.
  const [checkStep, ...browserSteps] = STEPS;
  await runStep(checkStep);

  const preview = await startPreview();
  try {
    for (const step of browserSteps) {
      await runStep(step);
    }
  } finally {
    await stopPreview(preview);
  }

  console.log("\ncheck:full passed — all local CI-equivalent gates are green.");
}

function runStep({ name, cmd: [command, args], env }) {
  console.log(`\n▶ ${name}`);
  return new Promise((resolve, reject) => {
    const child = spawn(resolveCommand(command), args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} failed (exit code ${code})`));
      }
    });
  });
}

function startPreview() {
  console.log(`\n▶ Starting preview server on ${BASE_URL}`);
  const child = spawn(
    resolveCommand("pnpm"),
    ["preview", "--port", String(PORT)],
    {
      stdio: "inherit",
      env: { ...process.env, PORT: String(PORT) },
    }
  );

  return waitForReady(child).then(() => child);
}

async function waitForReady(previewProcess) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (previewProcess.exitCode !== null) {
      throw new Error(
        `Preview server exited early (code ${previewProcess.exitCode})`
      );
    }
    try {
      const response = await fetch(BASE_URL, { redirect: "manual" });
      if (response.status < 500) {
        console.log("Preview server ready.");
        return;
      }
    } catch {
      // not up yet — keep polling
    }
    await sleep(READY_POLL_INTERVAL_MS);
  }
  throw new Error(
    `Preview server failed to become ready within ${READY_TIMEOUT_MS}ms`
  );
}

function stopPreview(child) {
  console.log("\n▶ Stopping preview server");
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    // Force-kill if it doesn't exit cleanly within a few seconds.
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }, 5000).unref();
  });
}

// Windows installs pnpm as a `.cmd` shim; spawn() without a shell needs the
// exact executable name (no PATHEXT-style resolution), so resolve it
// explicitly instead of passing `shell: true` (a command-injection smell —
// unnecessary here since every argument is a static literal, but avoiding
// it entirely is one less thing to reason about).
function resolveCommand(command) {
  if (command === "pnpm" && process.platform === "win32") {
    return "pnpm.cmd";
  }
  return command;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  console.error(`\n✖ check:full failed: ${error.message}`);
  exitCode = 1;
}
process.exit(exitCode);
