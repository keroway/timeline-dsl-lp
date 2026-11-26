import { describe, expect, it } from "vitest";
import {
  findJsonLdProblems,
  findLlmsBodyProblems,
  findOgImageProblems,
  findWasmFailureProblems,
} from "./smoke-helpers.mjs";

const REQ = ['"@type":"Organization"', '"@type":"WebPage"'];
const ld = (body) => `<script type="application/ld+json">${body}</script>`;

describe("findLlmsBodyProblems (#886)", () => {
  const REQUIRED = ["# Timeline DSL", "llms-full.txt"];

  it("必須文字列がそろえば問題なし", () => {
    expect(
      findLlmsBodyProblems("# Timeline DSL\n- llms-full.txt", REQUIRED)
    ).toEqual([]);
  });

  it("空本文・空白のみを拒否する", () => {
    expect(findLlmsBodyProblems("", REQUIRED)).toEqual(["body is empty"]);
    expect(findLlmsBodyProblems(" \n\t", REQUIRED)).toEqual(["body is empty"]);
  });

  it("エラーページ相当の本文を拒否する", () => {
    expect(
      findLlmsBodyProblems("<html><body>Not Found</body></html>", REQUIRED)
    ).toHaveLength(2);
  });
});

describe("findJsonLdProblems (#871)", () => {
  it("配列・@graph 内の @type を含め、required がそろえば問題なし", () => {
    const html =
      ld('{"@type":"Organization"}') +
      ld('{"@graph":[{"@type":["WebPage","Thing"]}]}');
    expect(findJsonLdProblems(html, REQ)).toEqual([]);
  });

  it("script 要素が無ければ拒否する", () => {
    expect(
      findJsonLdProblems('<p>"@type":"Organization" "@type":"WebPage"</p>', REQ)
    ).toHaveLength(1);
  });

  it("JSON 構文が不正なら拒否する", () => {
    const problems = findJsonLdProblems(
      ld('{"@type":"Organization",}') + ld('{"@type":"WebPage"}'),
      REQ
    );
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toContain("構文");
  });

  it("HTML コメント内だけの @type は拒否する", () => {
    const html =
      ld('{"@type":"Organization"}') +
      '<!-- <script type="application/ld+json">{"@type":"WebPage"}</script> -->';
    expect(findJsonLdProblems(html, REQ)).toEqual([
      "JSON-LD に @type WebPage がありません",
    ]);
  });

  it("textarea 内の script 文字列は拒否する (#888)", () => {
    const html = `<textarea>${ld('{"@type":"Organization"}')}</textarea>`;
    expect(findJsonLdProblems(html, REQ)).toHaveLength(1);
  });

  it("data-type 属性だけの script は拒否する (#888)", () => {
    const html =
      '<script data-type="application/ld+json">{"@type":"Organization"}</script>';
    expect(findJsonLdProblems(html, REQ)).toHaveLength(1);
  });
});

describe("findOgImageProblems (#877)", () => {
  const IMG = "/og/home.png";
  const og = (content) => `<meta property="og:image" content="${content}">`;

  it("og:image の content が期待パスなら絶対 URL でも相対でも通る", () => {
    expect(findOgImageProblems(og(`https://example.com${IMG}`), IMG)).toEqual({
      problems: [],
      path: IMG,
    });
    expect(findOgImageProblems(og(IMG), IMG).problems).toEqual([]);
  });

  it("属性順が逆でも content を取得する", () => {
    const html = `<meta content="${IMG}" property="og:image" />`;
    expect(findOgImageProblems(html, IMG).problems).toEqual([]);
  });

  it("og:image が誤りで twitter:image だけ正しい場合は拒否する", () => {
    const html = `${og("/wrong.png")}<meta name="twitter:image" content="${IMG}">`;
    expect(findOgImageProblems(html, IMG).problems).toHaveLength(1);
  });

  it("コメント内だけに og:image がある場合は拒否する", () => {
    expect(
      findOgImageProblems(`<!-- ${og(IMG)} -->`, IMG).problems
    ).toHaveLength(1);
  });

  it("script 内の文字列だけに og:image がある場合は拒否する", () => {
    const html = `<script>const example = '${og(IMG)}';</script>`;
    expect(findOgImageProblems(html, IMG).problems).toHaveLength(1);
  });

  it("引用符なしの property / content も取得する", () => {
    const html = `<meta property=og:image content=${IMG}>`;
    expect(findOgImageProblems(html, IMG).problems).toEqual([]);
  });

  it("og:image が無ければ拒否する", () => {
    expect(findOgImageProblems(`<p>${IMG}</p>`, IMG).problems).toHaveLength(1);
  });
});

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
