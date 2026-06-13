import type { LanguageRegistration } from "shiki";
import tdslGrammarJson from "./tdsl.tmLanguage.json" with { type: "json" };

// JSON import type doesn't structurally satisfy LanguageRegistration; cast once here.
export const tdslLang = tdslGrammarJson as unknown as LanguageRegistration;
export const tdslCodeThemes = { light: "github-light", dark: "github-dark" } as const;
