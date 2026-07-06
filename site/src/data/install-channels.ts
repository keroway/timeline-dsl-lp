/**
 * Timeline DSL CLI インストールコマンドの単一ソース（#430）。
 * LP の InstallSection（タブ UI）がこの配列を直接参照する。Docs（`homebrew.mdx`）は
 * Expressive Code の表示を保つため別実装のままだが、`install-channels.test.ts` が
 * ここの各 `lines` が homebrew.mdx（ja / en）本文に含まれることをテストで固定し、
 * どちらか一方だけを変更した場合にドリフトを検知する（installation.mdx は対象外）。
 */
export type InstallChannelId = "homebrew" | "shell" | "powershell" | "cargo";

export interface InstallChannel {
  id: InstallChannelId;
  /** タブ / 見出しラベルの i18n キー */
  labelKey: `lp.install.tab.${InstallChannelId}`;
  /** OS 対象の i18n キー（補助テキスト） */
  osKey: `lp.install.os.${InstallChannelId}`;
  /** 実行するコマンド行（複数行の場合は改行して連結表示する） */
  lines: string[];
}

export const INSTALL_CHANNELS: InstallChannel[] = [
  {
    id: "homebrew",
    labelKey: "lp.install.tab.homebrew",
    osKey: "lp.install.os.homebrew",
    lines: ["brew tap keroway/tap", "brew install tdsl"],
  },
  {
    id: "shell",
    labelKey: "lp.install.tab.shell",
    osKey: "lp.install.os.shell",
    lines: ["curl -sSfL https://raw.githubusercontent.com/keroway/timeline-dsl/main/install.sh | sh"],
  },
  {
    id: "powershell",
    labelKey: "lp.install.tab.powershell",
    osKey: "lp.install.os.powershell",
    lines: ["irm https://raw.githubusercontent.com/keroway/timeline-dsl/main/install.ps1 | iex"],
  },
  {
    id: "cargo",
    labelKey: "lp.install.tab.cargo",
    osKey: "lp.install.os.cargo",
    lines: ["cargo binstall tdsl-cli"],
  },
];
