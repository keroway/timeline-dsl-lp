import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * `*.generated.json` を書き出すデータ取得スクリプトの共通処理。
 *
 * ## なぜ分けたか（#577）
 *
 * 以前は取得に失敗すると **空のペイロードで既存ファイルを上書きし、exit 0** して
 * いた。その結果、GitHub API が一時的に落ちた週は「34 件のリリースが 0 件になった
 * 差分」を持つ緑の PR が立ち、タイトルだけ見てマージすると changelog が空になった。
 *
 * 失敗したときに正しいのは「更新しないこと」であって「空にすること」ではない。
 * 古いデータが残るだけなら、表示は前週のままで実害がほぼ無い。
 */

/** GitHub API のベース URL。テストからローカルサーバへ向けるために差し替え可能にする。 */
export const GITHUB_API_BASE =
  process.env.GITHUB_API_BASE ?? "https://api.github.com";

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

/** JSON を整形して書き出す（親ディレクトリが無ければ作る）。 */
export async function writeJsonPayload(outputPath, payload) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * 取得失敗時の後始末。**既存ファイルは決して上書きしない。**
 *
 * ファイルがまだ無い初回だけ、後続のビルドが import できるように空ペイロードを
 * 書く。その場合も呼び出し側は非ゼロ終了すること（成功として扱わない）。
 *
 * @returns {Promise<{ wroteEmpty: boolean }>}
 */
export async function handleFetchFailure({
  outputPath,
  error,
  createEmptyPayload,
  log = console.error,
}) {
  log(error instanceof Error ? error.message : String(error));

  if (await pathExists(outputPath)) {
    log(
      `既存の ${outputPath} は更新せずに保持する（空データで上書きしない）。失敗として終了する。`
    );
    return { wroteEmpty: false };
  }

  await writeJsonPayload(outputPath, createEmptyPayload());
  log(
    `${outputPath} が存在しないため空データを書いた。内容は取得できていないため失敗として終了する。`
  );
  return { wroteEmpty: true };
}
