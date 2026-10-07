import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isDiagnostic,
  parseDiagnostics,
  type setTdslWasmMessages,
  type TdslDiagnostic,
  toDiagnostic,
} from "./tdsl-wasm";

const sampleError: TdslDiagnostic = {
  severity: "error",
  message: "boom",
  line: 3,
  col: 5,
};

const MOCK_FALLBACK = "MOCK fallback";

describe("isDiagnostic", () => {
  it("error / warning / info の妥当なオブジェクトを受理する", () => {
    expect(isDiagnostic(sampleError)).toBe(true);
    expect(
      isDiagnostic({ severity: "warning", message: "m", line: 0, col: 0 })
    ).toBe(true);
    expect(
      isDiagnostic({ severity: "info", message: "m", line: 1, col: 1 })
    ).toBe(true);
  });

  it("severity 不正・フィールド欠落・非オブジェクトを拒否する", () => {
    expect(
      isDiagnostic({ severity: "bogus", message: "m", line: 1, col: 1 })
    ).toBe(false);
    expect(isDiagnostic({ severity: "error", message: "m", line: 1 })).toBe(
      false
    );
    expect(
      isDiagnostic({ severity: "error", message: 1, line: 1, col: 1 })
    ).toBe(false);
    expect(isDiagnostic(null)).toBe(false);
    expect(isDiagnostic("nope")).toBe(false);
  });
});

describe("parseDiagnostics", () => {
  it("妥当な diagnostic 配列をそのまま返す", () => {
    expect(parseDiagnostics(JSON.stringify([sampleError]))).toEqual([
      sampleError,
    ]);
  });

  it("info diagnostic を通過させる", () => {
    const info: TdslDiagnostic = {
      severity: "info",
      message: "import block",
      line: 1,
      col: 1,
    };
    expect(parseDiagnostics(JSON.stringify([sampleError, info]))).toEqual([
      sampleError,
      info,
    ]);
  });

  it("不正なエントリがあれば有効分を残しつつ形式異常の error を追加する", () => {
    const raw = JSON.stringify([sampleError, { severity: "bogus" }, 123]);
    const result = parseDiagnostics(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(sampleError);
    expect(result[1].severity).toBe("error");
    expect(result[1].message).toMatch(/malformed entries/);
  });

  it("不正なエントリだけの配列でも error を返す（正常な空配列と区別する）", () => {
    const raw = JSON.stringify([
      { severity: "error", message: "blocked", line: "1", col: 1 },
    ]);
    const result = parseDiagnostics(raw);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("error");
    expect(parseDiagnostics("[]")).toEqual([]);
  });

  it("warning と不正エントリの混在で error が消えない", () => {
    const warning: TdslDiagnostic = {
      severity: "warning",
      message: "valid",
      line: 1,
      col: 1,
    };
    const raw = JSON.stringify([
      warning,
      { severity: "error", message: "blocked", line: 1 },
    ]);
    const result = parseDiagnostics(raw);
    expect(result.some((d) => d.severity === "error")).toBe(true);
    expect(result).toContainEqual(warning);
  });

  it("配列でない JSON はエラー diagnostic にする", () => {
    const result = parseDiagnostics("{}");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("error");
    expect(result[0].message).toMatch(/not an array/);
  });

  it("壊れた JSON はエラー diagnostic にする", () => {
    const result = parseDiagnostics("not json at all");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("error");
    expect(result[0].message).toMatch(/could not be parsed/);
  });
});

describe("toDiagnostic", () => {
  it("既定では error、'warning' 指定で warning にする", () => {
    expect(toDiagnostic("m").severity).toBe("error");
    expect(toDiagnostic("m", "warning").severity).toBe("warning");
  });

  it("severity 以外（cause）を渡しても error に矯正する", () => {
    expect(toDiagnostic("m", new Error("cause")).severity).toBe("error");
  });
});

describe("WASM が利用できない環境でのラッパー分岐", () => {
  beforeEach(() => {
    vi.resetModules();
    // WebAssembly を未定義にすると loadTdslWasmModule は動的 import 前に
    // unavailable を返す（早期 return 分岐）。
    vi.stubGlobal("WebAssembly", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("checkTdslSource は注入された fallback メッセージのエラー diagnostic を返す", async () => {
    const wasm = await import("./tdsl-wasm");
    wasm.setTdslWasmMessages({
      fallback: MOCK_FALLBACK,
    });
    const result = await wasm.checkTdslSource("event x");
    expect(result).toEqual([
      { severity: "error", message: MOCK_FALLBACK, line: 0, col: 0 },
    ]);
  });

  it("loadTdslWasm は unavailable 結果を固定せず、次の呼び出しで初期化をやり直す", async () => {
    const wasm = await import("./tdsl-wasm");
    const first = await wasm.loadTdslWasm();
    const second = await wasm.loadTdslWasm();
    expect(first.status).toBe("unavailable");
    expect(second.status).toBe("unavailable");
    expect(second).not.toBe(first);
  });

  it("renderTdslSvg は注入された fallback メッセージで reject する", async () => {
    const wasm = await import("./tdsl-wasm");
    wasm.setTdslWasmMessages({
      fallback: MOCK_FALLBACK,
    });
    await expect(wasm.renderTdslSvg("event x")).rejects.toThrow(MOCK_FALLBACK);
  });
});

// setTdslWasmMessages は fallback のみ受け付けることを型レベルで確認
const _typeCheck: Parameters<typeof setTdslWasmMessages>[0] = { fallback: "x" };
void _typeCheck;
