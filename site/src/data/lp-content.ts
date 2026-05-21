import { getT, type Locale } from "../i18n/index";

export type FeatureVisual =
  | {
      type: "author";
      filename: string;
      lines: string[];
    }
  | {
      type: "validate";
      command: string;
      diagnostics: {
        tone: "ok" | "warn" | "error";
        label: string;
        text: string;
      }[];
    }
  | {
      type: "render";
      range: string;
      ticks: string[];
      lanes: {
        label: string;
        text: string;
        start: string;
        width: string;
        tone: "accent" | "gold" | "plum" | "sky" | "warm";
      }[];
    };

export type Feature = {
  kicker: string;
  title: string;
  body: string;
  visual: FeatureVisual;
};

export type UseCaseBar = {
  year: string;
  label: string;
  start: string;
  width: string;
  tone: "accent" | "gold" | "plum" | "sky" | "warm";
};

export type UseCase = {
  title: string;
  body: string;
  sample: string;
  tone: string;
  range: string;
  map: UseCaseBar[];
};

export function getFeatures(locale: Locale): Feature[] {
  const t = getT(locale);
  return [
    {
      kicker: "Author",
      title: t("lp.feature.author.title"),
      body: t("lp.feature.author.body"),
      visual: {
        type: "author",
        filename: "source.tdsl",
        lines: t("lp.feature.author.code_sample").split("\n"),
      },
    },
    {
      kicker: "Validate",
      title: t("lp.feature.validate.title"),
      body: t("lp.feature.validate.body"),
      visual: {
        type: "validate",
        command: "tdsl check source.tdsl",
        diagnostics: [
          { tone: "ok", label: "ok", text: "parsed 24 events / 4 lanes" },
          { tone: "warn", label: "warn", text: "duplicate label at 1905" },
          { tone: "error", label: "error", text: "unknown lane: source" },
        ],
      },
    },
    {
      kicker: "Render",
      title: t("lp.feature.render.title"),
      body: t("lp.feature.render.body"),
      visual: {
        type: "render",
        range: "1850 - 1912",
        ticks: ["1850", "1870", "1890", "1910"],
        lanes: [
          {
            label: t("lp.feature.render.lane1.label"),
            text: t("lp.feature.render.lane1.text"),
            start: "12%",
            width: "58%",
            tone: "accent",
          },
          {
            label: t("lp.feature.render.lane2.label"),
            text: t("lp.feature.render.lane2.text"),
            start: "38%",
            width: "45%",
            tone: "gold",
          },
        ],
      },
    },
  ];
}

export function getUseCases(locale: Locale): UseCase[] {
  const t = getT(locale);
  return [
    {
      title: t("lp.usecase.story.title"),
      body: t("lp.usecase.story.body"),
      sample: t("lp.usecase.story.sample"),
      tone: "story",
      range: "980-1260",
      map: [
        { year: "990", label: t("lp.usecase.story.bar1"), start: "8%", width: "62%", tone: "accent" },
        { year: "1042", label: t("lp.usecase.story.bar2"), start: "31%", width: "18%", tone: "gold" },
        { year: "1130", label: t("lp.usecase.story.bar3"), start: "58%", width: "30%", tone: "plum" },
      ],
    },
    {
      title: t("lp.usecase.classroom.title"),
      body: t("lp.usecase.classroom.body"),
      sample: t("lp.usecase.classroom.sample"),
      tone: "classroom",
      range: "1850-1912",
      map: [
        { year: "1853", label: t("lp.usecase.classroom.bar1"), start: "6%", width: "20%", tone: "sky" },
        { year: "1868", label: t("lp.usecase.classroom.bar2"), start: "27%", width: "36%", tone: "accent" },
        { year: "1905", label: t("lp.usecase.classroom.bar3"), start: "66%", width: "22%", tone: "gold" },
      ],
    },
    {
      title: t("lp.usecase.company.title"),
      body: t("lp.usecase.company.body"),
      sample: t("lp.usecase.company.sample"),
      tone: "company",
      range: "2016-2026",
      map: [
        { year: "2016", label: t("lp.usecase.company.bar1"), start: "6%", width: "23%", tone: "warm" },
        { year: "2020", label: t("lp.usecase.company.bar2"), start: "36%", width: "30%", tone: "accent" },
        { year: "2024", label: t("lp.usecase.company.bar3"), start: "68%", width: "22%", tone: "plum" },
      ],
    },
    {
      title: t("lp.usecase.research.title"),
      body: t("lp.usecase.research.body"),
      sample: t("lp.usecase.research.sample"),
      tone: "research",
      range: "QID draft",
      map: [
        { year: "Q42", label: t("lp.usecase.research.bar1"), start: "8%", width: "24%", tone: "accent" },
        { year: "ref", label: t("lp.usecase.research.bar2"), start: "40%", width: "28%", tone: "sky" },
        { year: "tdsl", label: t("lp.usecase.research.bar3"), start: "70%", width: "20%", tone: "gold" },
      ],
    },
  ];
}
