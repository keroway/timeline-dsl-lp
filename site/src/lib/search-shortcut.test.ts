import { describe, expect, it } from "vitest";
import { getSearchShortcutHint, isSearchShortcut } from "./search-shortcut";

function keyEvent(
  overrides: Partial<{
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    isComposing: boolean;
    repeat: boolean;
  }>
) {
  return {
    key: "k",
    ctrlKey: false,
    metaKey: false,
    isComposing: false,
    repeat: false,
    ...overrides,
  };
}

describe("isSearchShortcut", () => {
  it("Ctrl+k で true", () => {
    expect(isSearchShortcut(keyEvent({ ctrlKey: true, key: "k" }))).toBe(true);
  });

  it("Cmd (metaKey) +k で true", () => {
    expect(isSearchShortcut(keyEvent({ metaKey: true, key: "k" }))).toBe(true);
  });

  it("CapsLock / Shift で key が 'K' になっても true (大文字小文字を無視)", () => {
    expect(isSearchShortcut(keyEvent({ ctrlKey: true, key: "K" }))).toBe(true);
  });

  it("修飾キーなしなら false", () => {
    expect(isSearchShortcut(keyEvent({ key: "k" }))).toBe(false);
  });

  it("IME 変換中 (isComposing) なら false", () => {
    expect(
      isSearchShortcut(keyEvent({ ctrlKey: true, key: "k", isComposing: true }))
    ).toBe(false);
  });

  it("キーリピート中 (repeat) なら false", () => {
    expect(
      isSearchShortcut(keyEvent({ ctrlKey: true, key: "k", repeat: true }))
    ).toBe(false);
  });

  it("k 以外のキーなら false", () => {
    expect(isSearchShortcut(keyEvent({ ctrlKey: true, key: "j" }))).toBe(false);
  });
});

describe("getSearchShortcutHint", () => {
  it("Mac の userAgent なら ⌘K", () => {
    expect(
      getSearchShortcutHint("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
    ).toBe("⌘K");
  });

  it("iPhone/iPad の userAgent なら ⌘K", () => {
    expect(
      getSearchShortcutHint(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
      )
    ).toBe("⌘K");
  });

  it("Windows の userAgent なら Ctrl+K", () => {
    expect(
      getSearchShortcutHint("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    ).toBe("Ctrl+K");
  });

  it("Linux の userAgent なら Ctrl+K", () => {
    expect(getSearchShortcutHint("Mozilla/5.0 (X11; Linux x86_64)")).toBe(
      "Ctrl+K"
    );
  });
});
