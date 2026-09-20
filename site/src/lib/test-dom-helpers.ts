/** テストのDOMセットアップ直後に要素の存在を保証するためのヘルパー。
 * `!` の代わりに使うことで、要素が見つからない場合は原因の分かるメッセージで即座に落とす。 */
export function mustQuery<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`test setup: selector not found: ${selector}`);
  return el;
}

export function mustGetById<T extends HTMLElement = HTMLElement>(
  id: string
): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`test setup: element not found: #${id}`);
  return el;
}
