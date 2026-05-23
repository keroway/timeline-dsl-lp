import { getT, type Locale } from "../i18n/index";

export type PlaygroundSample = {
  id: string;
  label: string;
  source: string;
};

// Playground のサンプル DSL 定義。source は言語非依存、label のみ i18n。
export function getPlaygroundSamples(locale: Locale): PlaygroundSample[] {
  const t = getT(locale);
  return [
    {
      id: "minimal",
      label: t("playground.sample.minimal"),
      source: `timeline "読書メモ" {
    title "読書メモ";
    unit year;
    range 2018..2030;
    calendar proleptic_gregorian;
}

lane "本" as books { kind custom; order 10; }

event books 2025 "Timeline DSLを試す" { id "event:first"; };
`,
    },
    {
      id: "range",
      label: t("playground.sample.range"),
      source: `timeline "小さなプロジェクト" {
    title "小さなプロジェクト";
    unit year;
    range 2020..2032;
    calendar proleptic_gregorian;
}

lane "工程" as phases { kind custom; order 10; }
lane "節目" as milestones { kind custom; order 20; }

span phases 2025..2026 "設計" { tags ["phase"]; id "span:design"; };
span phases 2026..2028 "実装" { tags ["phase"]; id "span:build"; };
event_range milestones 2025..2026 "移行期間" { tags ["migration"]; };
event milestones 2027 "新体制で運用開始" {};
`,
    },
    {
      id: "lanes",
      label: t("playground.sample.lanes"),
      source: `timeline "架空世界年表" {
    title "架空世界年表";
    unit year;
    range 980..1260;
    calendar proleptic_gregorian;
}

lane "王国" as realm { kind custom; order 10; }
lane "事件" as incident { kind custom; order 20; }
lane "人物" as people { kind custom; order 30; }

span realm 990..1184 "灰都王朝" { tags ["dynasty"]; };
event incident 1042 "北方遠征" {};
event_range incident 1130..1137 "継承戦争" { tags ["war"]; };
span people 1088..1162 "巡礼王" { tags ["person"]; };
event people 1184 "王朝終焉" {};
`,
    },
    {
      id: "import",
      label: t("playground.sample.import"),
      source: `// ⚠️ import wikidata は CLI 専用機能です。
// ブラウザ WASM では Wikidata クエリは解決されません（手動追加のイベントのみ描画）。

timeline "中国王朝" {
    title "中国王朝";
    unit year;
    range -300..300;
    calendar proleptic_gregorian;
}

lane "王朝" as dynasties { kind dynasty; order 10; }

event dynasties -221 "秦の天下統一" { tags ["manual"]; };

import wikidata as wd {
    entity Q7209 as han_dynasty;
    policy merge_by_source;
}

map wd.han_dynasty to span {
    lane dynasties;
    start claim(P571).year;
    end claim(P576).year;
    label label@ja ?? label@en;
    tags ["dynasty", "imported"];
}
`,
    },
  ];
}
