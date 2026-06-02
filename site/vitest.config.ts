import { defineConfig } from "vitest/config";

// src/lib/ は framework 非依存の TS なので、Astro/Starlight の統合グラフを読み込まない
// 軽量な standalone 設定にする。DOM API（localStorage / matchMedia / DOMParser 等）を
// 使うラッパーをテストするため environment は jsdom。
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});
