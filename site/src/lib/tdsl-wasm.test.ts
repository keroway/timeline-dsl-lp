import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isDiagnostic,
  parseDiagnostics,
  TDSL_WASM_FALLBACK_MESSAGE,
  toDiagnostic,
  withWikidataImportWarning,
  type TdslDiagnostic,
} from "./tdsl-wasm";

const sampleError: TdslDiagnostic = { severity: "error", message: "boom", line: 3, col: 5 };

describe("isDiagnostic", () => {
  it("error / warning の妥当なオブジェクトを受理する", () => {
    expect(isDiagnostic(sampleError)).toBe(true);
    expect(isDiagnostic({ severity: "warning", message: "m", line: 0, col: 0 })).toBe(true);
  });

  it("severity 不正・フィールド欠落・非オブジェクトを拒否する", () => {
    expect(isDiagnostic({ severity: "info", message: "m", line: 1, col: 1 })).toBe(false);
    expect(isDiagnostic({ severity: "error", message: "m", line: 1 })).toBe(false);
    expect(isDiagnostic({ severity: "error", message: 1, line: 1, col: 1 })).toBe(false);
    expect(isDiagnostic(null)).toBe(false);
    expect(isDiagnostic("nope")).toBe(false);
  });
});

describe("parseDiagnostics", () => {
  it("妥当な diagnostic 配列をそのまま返す", () => {
    expect(parseDiagnostics(JSON.stringify([sampleError]))).toEqual([sampleError]);
  });

  it("不正なエントリを除外する", () => {
    const raw = JSON.stringify([sampleError, { severity: "bogus" }, 123]);
    expect(parseDiagnostics(raw)).toEqual([sampleError]);
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

describe("withWikidataImportWarning", () => {
  it("import を含むソースには警告 diagnostic を追記する", () => {
    const result = withWikidataImportWarning("import wikidata\nevent x", []);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
    expect(result[0].message).toMatch(/Wikidata import/);
  });

  it("import を含まないソースは配列をそのまま返す", () => {
    const diagnostics = [sampleError];
    expect(withWikidataImportWarning("event x", diagnostics)).toBe(diagnostics);
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

  it("checkTdslSource は fallback メッセージのエラー diagnostic を返す", async () => {
    const { checkTdslSource } = await import("./tdsl-wasm");
    const result = await checkTdslSource("event x");
    expect(result).toEqual([
      { severity: "error", message: TDSL_WASM_FALLBACK_MESSAGE, line: 0, col: 0 },
    ]);
  });

  it("renderTdslSvg / renderTdslHtml / compileTdslToIr は fallback メッセージで reject する", async () => {
    const { renderTdslSvg, renderTdslHtml, compileTdslToIr } = await import("./tdsl-wasm");
    await expect(renderTdslSvg("event x")).rejects.toThrow(TDSL_WASM_FALLBACK_MESSAGE);
    await expect(renderTdslHtml("event x")).rejects.toThrow(TDSL_WASM_FALLBACK_MESSAGE);
    await expect(compileTdslToIr("event x")).rejects.toThrow(TDSL_WASM_FALLBACK_MESSAGE);
  });
});
