import { describe, expect, it } from "vitest";
import { findWasmFailureProblems } from "./smoke-helpers.mjs";

const EXPECTED = { statusText: "WASM 処理に失敗しました", retryText: "再試行" };

const failed = {
  state: "error",
  statusText: "WASM 処理に失敗しました",
  diagnosticsText: "エラー 1 件 / 警告 0 件 / 情報 0 件 failed to fetch",
  retryButtonText: "再試行",
};

describe("findWasmFailureProblems (#847)", () => {
  it("失敗状態・通知・再試行がそろっていれば問題なし", () => {
    expect(findWasmFailureProblems(failed, EXPECTED)).toEqual([]);
  });

  it("正常な説明文だけの状態では失敗する", () => {
    const problems = findWasmFailureProblems(
      {
        state: "loading",
        statusText: "",
        diagnosticsText: "",
        retryButtonText: "",
      },
      EXPECTED
    );
    expect(problems.length).toBe(4);
  });

  it("loading 表示（WASM を初期化中...）では失敗する", () => {
    const problems = findWasmFailureProblems(
      { ...failed, state: "loading", statusText: "WASM を初期化中..." },
      EXPECTED
    );
    expect(problems.length).toBeGreaterThan(0);
  });

  it("エラー 0 件の診断表示だけでは失敗する", () => {
    const problems = findWasmFailureProblems(
      {
        state: "ready",
        statusText: "診断結果なし",
        diagnosticsText: "エラー 0 件 / 警告 0 件 / 情報 0 件",
        retryButtonText: "",
      },
      EXPECTED
    );
    expect(problems.length).toBeGreaterThan(0);
  });

  it("DSL 診断エラー（WASM 失敗ではない）では失敗する", () => {
    const problems = findWasmFailureProblems(
      { ...failed, statusText: "構文または参照エラーを検出しました" },
      EXPECTED
    );
    expect(problems).toHaveLength(1);
  });

  it("再試行ボタンが無ければ失敗する", () => {
    expect(
      findWasmFailureProblems({ ...failed, retryButtonText: "" }, EXPECTED)
    ).toHaveLength(1);
  });
});
