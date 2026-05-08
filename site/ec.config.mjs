import { defineEcConfig, pluginFramesTexts } from "@astrojs/starlight/expressive-code";
import tdslGrammar from "./src/lib/tdsl.tmLanguage.json" with { type: "json" };

pluginFramesTexts.overrideTexts(undefined, {
  copyButtonTooltip: "コードをコピー",
  copyButtonCopied: "コピーしました",
});

export default defineEcConfig({
  shiki: {
    langs: [tdslGrammar],
  },
});
