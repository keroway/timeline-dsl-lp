import { defineEcConfig, pluginFramesTexts } from "@astrojs/starlight/expressive-code";

pluginFramesTexts.overrideTexts(undefined, {
  copyButtonTooltip: "コードをコピー",
  copyButtonCopied: "コピーしました",
});

export default defineEcConfig({});
