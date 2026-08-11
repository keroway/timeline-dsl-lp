import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

// コンポーネントテストは Astro の Vite プラグインチェーンが必要なため
// getViteConfig で Astro 統合ずみ設定を使う
const componentTestConfig = getViteConfig({
  test: {
    name: "components",
    environment: "node",
    include: ["src/components/**/*.test.ts", "src/layouts/**/*.test.ts"],
  },
});

// src/lib/ は framework 非依存の TS なので、Astro/Starlight の統合グラフを読み込まない
// 軽量な standalone 設定にする。DOM API（localStorage / matchMedia / DOMParser 等）を
// 使うラッパーをテストするため environment は jsdom。
const libTestConfig = defineConfig({
  test: {
    name: "lib",
    environment: "jsdom",
    // Node 26's experimental global localStorage shadows jsdom's implementation.
    // Keep jsdom as the browser-storage source used by library tests.
    execArgv: ["--no-experimental-webstorage"],
    include: [
      "src/lib/**/*.test.ts",
      "src/data/**/*.test.ts",
      "src/i18n/**/*.test.ts",
    ],
    globals: false,
  },
});

// scripts/ は node 組み込みモジュールのみで動く生成スクリプト群。実プロセスを
// spawn して終了コードを検証するため、Astro の統合も DOM も要らない (#577)。
const scriptsTestConfig = defineConfig({
  test: {
    name: "scripts",
    environment: "node",
    include: ["scripts/**/*.test.mjs"],
    globals: false,
  },
});

export default defineConfig({
  test: {
    projects: [componentTestConfig, libTestConfig, scriptsTestConfig],
  },
});
