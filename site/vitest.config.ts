import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

// コンポーネントテストは Astro の Vite プラグインチェーンが必要なため
// getViteConfig で Astro 統合ずみ設定を使う
const componentTestConfig = getViteConfig({
  test: {
    name: "components",
    environment: "node",
    include: ["src/components/**/*.test.ts"],
  },
});

// src/lib/ は framework 非依存の TS なので、Astro/Starlight の統合グラフを読み込まない
// 軽量な standalone 設定にする。DOM API（localStorage / matchMedia / DOMParser 等）を
// 使うラッパーをテストするため environment は jsdom。
const libTestConfig = defineConfig({
  test: {
    name: "lib",
    environment: "jsdom",
    include: ["src/lib/**/*.test.ts"],
    globals: false,
  },
});

export default defineConfig({
  test: {
    projects: [componentTestConfig, libTestConfig],
  },
});
