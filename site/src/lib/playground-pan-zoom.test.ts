import { afterEach, describe, expect, it, vi } from "vitest";
import { createPanZoom } from "./playground-pan-zoom";

// pan/zoom コントローラは surface/stage の DOM を直接操作するため、
// jsdom 上で clientWidth/clientHeight/getBoundingClientRect/pointer capture を
// 明示的にスタブする。RAF は jsdom がタイマーベースで実装しており、
// vi.useFakeTimers() で決定的に進行できることを確認済み。

interface EnvOptions {
  surfaceW?: number;
  surfaceH?: number;
  svgW?: number;
  svgH?: number;
  withSvg?: boolean;
  top?: number;
  innerHeight?: number;
}

function makeEnv({
  surfaceW = 800,
  surfaceH = 600,
  svgW = 400,
  svgH = 200,
  withSvg = true,
  top = 0,
  innerHeight = 2000,
}: EnvOptions = {}) {
  const surface = document.createElement("div");
  const stage = document.createElement("div");
  surface.appendChild(stage);
  document.body.appendChild(surface);

  Object.defineProperty(surface, "clientWidth", {
    value: surfaceW,
    configurable: true,
  });
  Object.defineProperty(surface, "clientHeight", {
    value: surfaceH,
    configurable: true,
  });
  surface.getBoundingClientRect = () =>
    ({
      top,
      left: 0,
      right: surfaceW,
      bottom: surfaceH + top,
      width: surfaceW,
      height: surfaceH,
      x: 0,
      y: top,
      toJSON() {
        return {};
      },
    }) as DOMRect;
  surface.setPointerCapture = vi.fn();
  surface.releasePointerCapture = vi.fn();

  Object.defineProperty(window, "innerHeight", {
    value: innerHeight,
    configurable: true,
    writable: true,
  });

  let svg: SVGSVGElement | null = null;
  if (withSvg) {
    svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    ) as unknown as SVGSVGElement;
    svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
    stage.appendChild(svg);
  }
  return { surface, stage, svg };
}

function parseMatrix(el: HTMLElement) {
  const t = el.style.transform;
  const m = /matrix\(([^,]+),0,0,([^,]+),([^,]+),([^)]+)\)/.exec(t);
  if (!m) return null;
  return {
    scale: parseFloat(m[1]),
    scaleY: parseFloat(m[2]),
    tx: parseFloat(m[3]),
    ty: parseFloat(m[4]),
  };
}

function firePointer(
  target: HTMLElement,
  type: string,
  init: {
    clientX?: number;
    clientY?: number;
    pointerId?: number;
    button?: number;
  }
) {
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX: init.clientX ?? 0,
      clientY: init.clientY ?? 0,
      pointerId: init.pointerId ?? 1,
      button: init.button ?? 0,
      bubbles: true,
      cancelable: true,
    })
  );
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createPanZoom — fit / scaling", () => {
  it("SVG が無いときは identity 変換になる", () => {
    const { surface, stage } = makeEnv({ withSvg: false });
    const pz = createPanZoom({ surface, stage });
    pz.reset();
    expect(parseMatrix(stage)).toEqual({ scale: 1, scaleY: 1, tx: 0, ty: 0 });
  });

  it("通常時は SVG を中央にフィットさせ、拡大はしない（scale <= 1）", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 400,
      svgH: 200,
    });
    const pz = createPanZoom({ surface, stage });
    pz.reset();

    const m = parseMatrix(stage)!;
    // fitPad=32: avail = 736x536. min(736/400, 536/200, 1) = 1 (never upsizes)
    expect(m.scale).toBe(1);
    expect(m.tx).toBeCloseTo((800 - 400 * 1) / 2);
    expect(m.ty).toBeCloseTo((600 - 200 * 1) / 2);
  });

  it("SVG が surface より大きいときは 1 未満に縮小してフィットさせる", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 2000,
      svgH: 1000,
    });
    const pz = createPanZoom({ surface, stage });
    pz.reset();

    const m = parseMatrix(stage)!;
    // avail = 736x536. min(736/2000=0.368, 536/1000=0.536, 1) = 0.368
    expect(m.scale).toBeCloseTo(736 / 2000, 3);
  });

  it("フィット後の scale は設定した minScale を下回らない", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 100,
      surfaceH: 100,
      svgW: 5000,
      svgH: 5000,
    });
    const pz = createPanZoom({ surface, stage, minScale: 0.25 });
    pz.reset();

    const m = parseMatrix(stage)!;
    // raw fit scale would be (100-64)/5000 = 0.0072, clamped up to minScale
    expect(m.scale).toBe(0.25);
  });

  it("SVG の viewBox/clientWidth/Height が両方 0 のときは identity にフォールバックする", () => {
    // surface 幅も 0 にすることで viewBox||clientWidth||sw のフォールバック連鎖を
    // すべて 0 にし、svgW<=0 の無効値分岐を踏む。
    const { surface, stage } = makeEnv({
      surfaceW: 0,
      surfaceH: 0,
      svgW: 0,
      svgH: 0,
    });
    const pz = createPanZoom({ surface, stage });
    pz.reset();

    expect(parseMatrix(stage)).toEqual({ scale: 1, scaleY: 1, tx: 0, ty: 0 });
  });

  it("ホイールでカーソル位置を中心にズームし、変換が予測どおりになる", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage });

    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        bubbles: true,
        cancelable: true,
      })
    );

    const m = parseMatrix(stage)!;
    const expectedScale = 1 * (1 + 100 * 0.0015);
    expect(m.scale).toBeCloseTo(expectedScale, 6);
    expect(m.tx).toBeCloseTo(400 * (1 - expectedScale), 6);
    expect(m.ty).toBeCloseTo(300 * (1 - expectedScale), 6);
  });

  it("ホイールズームは maxScale を超えない", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, maxScale: 8 });

    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100000,
        clientX: 0,
        clientY: 0,
        bubbles: true,
        cancelable: true,
      })
    );

    expect(parseMatrix(stage)!.scale).toBe(8);
  });

  it("ホイールズームは minScale を下回らない", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, minScale: 0.25 });

    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: 100000,
        clientX: 0,
        clientY: 0,
        bubbles: true,
        cancelable: true,
      })
    );

    expect(parseMatrix(stage)!.scale).toBe(0.25);
  });

  it("ダブルクリックでフィット表示に戻る", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 400,
      svgH: 200,
    });
    createPanZoom({ surface, stage });

    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(parseMatrix(stage)!.scale).not.toBe(1);

    surface.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

    const m = parseMatrix(stage)!;
    expect(m.scale).toBe(1);
    expect(m.tx).toBeCloseTo((800 - 400) / 2);
    expect(m.ty).toBeCloseTo((600 - 200) / 2);
  });

  it("reset ボタンをクリックするとフィット表示に戻る", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 400,
      svgH: 200,
    });
    const resetButton = document.createElement("button");
    createPanZoom({ surface, stage, resetButton });

    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(parseMatrix(stage)!.scale).not.toBe(1);

    resetButton.click();

    expect(parseMatrix(stage)!.scale).toBe(1);
  });
});

describe("createPanZoom — pointer state / RAF / teardown", () => {
  it("しきい値未満の移動はパンを開始しない（クラス付与なし）", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 102,
      clientY: 101,
      pointerId: 1,
    });

    expect(surface.setPointerCapture).toHaveBeenCalledWith(1);
    expect(stage.classList.contains("is-panning")).toBe(false);
    expect(surface.classList.contains("is-panning")).toBe(false);
  });

  it("しきい値を超えるとパンが有効になりクラスが付与され、ツールチップが隠れる", () => {
    vi.useFakeTimers();
    const { surface, stage } = makeEnv();
    const tooltipEl = document.createElement("div");
    tooltipEl.setAttribute("data-visible", "true");
    tooltipEl.setAttribute("aria-hidden", "false");
    createPanZoom({ surface, stage, tooltipEl });

    firePointer(surface, "pointerdown", {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 120,
      clientY: 100,
      pointerId: 1,
    });

    expect(stage.classList.contains("is-panning")).toBe(true);
    expect(surface.classList.contains("is-panning")).toBe(true);
    expect(tooltipEl.hasAttribute("data-visible")).toBe(false);
    expect(tooltipEl.getAttribute("aria-hidden")).toBe("true");

    vi.advanceTimersByTime(20);
    expect(parseMatrix(stage)!.tx).toBeCloseTo(20);
  });

  it("フラッシュ前の連続 pointermove は RAF を 1 回だけ予約する（座標は最新値を反映）", () => {
    vi.useFakeTimers();
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 10,
      clientY: 0,
      pointerId: 1,
    }); // activates + schedules RAF
    firePointer(surface, "pointermove", {
      clientX: 30,
      clientY: 0,
      pointerId: 1,
    }); // coalesced, no new RAF

    expect(rafSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(20);
    expect(parseMatrix(stage)!.tx).toBeCloseTo(30);

    // 次の move は RAF がクリアされているので再スケジュールする
    firePointer(surface, "pointermove", {
      clientX: 40,
      clientY: 0,
      pointerId: 1,
    });
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it("pointerup でパンを確定し、is-panning を解除して pointer capture を解放する", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 7,
    });
    firePointer(surface, "pointermove", {
      clientX: 15,
      clientY: 0,
      pointerId: 7,
    });
    firePointer(surface, "pointerup", {
      clientX: 15,
      clientY: 0,
      pointerId: 7,
    });

    expect(stage.classList.contains("is-panning")).toBe(false);
    expect(surface.classList.contains("is-panning")).toBe(false);
    expect(surface.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(parseMatrix(stage)!.tx).toBeCloseTo(15);
  });

  it("pointercancel も pointerup と同様に後始末する", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 9,
    });
    firePointer(surface, "pointermove", {
      clientX: 15,
      clientY: 0,
      pointerId: 9,
    });
    firePointer(surface, "pointercancel", {
      clientX: 15,
      clientY: 0,
      pointerId: 9,
    });

    expect(stage.classList.contains("is-panning")).toBe(false);
    expect(surface.releasePointerCapture).toHaveBeenCalledWith(9);
  });

  it("reset ボタン上の pointerdown はパン開始として扱わず、ボタンの click を妨げない（回帰: reset クリックが効かないバグ）", () => {
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 400,
      svgH: 200,
    });
    const resetButton = document.createElement("button");
    surface.appendChild(resetButton);
    createPanZoom({ surface, stage, resetButton, panThreshold: 5 });

    let clicks = 0;
    resetButton.addEventListener("click", () => clicks++);

    const rect = { left: 10, top: 10 } as DOMRect;
    resetButton.getBoundingClientRect = () => rect;

    firePointer(resetButton, "pointerdown", {
      clientX: 30,
      clientY: 30,
      pointerId: 5,
    });
    firePointer(resetButton, "pointerup", {
      clientX: 30,
      clientY: 30,
      pointerId: 5,
    });
    resetButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(clicks).toBe(1);
    // surface 側のパン状態にも影響を与えない
    expect(surface.setPointerCapture).not.toHaveBeenCalledWith(5);
    expect(stage.classList.contains("is-panning")).toBe(false);
  });

  it("別の pointerId のイベントは無視する", () => {
    const { surface, stage } = makeEnv();
    createPanZoom({ surface, stage, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 50,
      clientY: 0,
      pointerId: 2,
    });

    expect(stage.classList.contains("is-panning")).toBe(false);
  });

  it("destroy() は保留中の RAF をキャンセルし、以降のイベントに反応しなくなる", () => {
    vi.useFakeTimers();
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { surface, stage } = makeEnv({
      surfaceW: 800,
      surfaceH: 600,
      svgW: 400,
      svgH: 200,
    });
    const resetButton = document.createElement("button");
    const pz = createPanZoom({ surface, stage, resetButton, panThreshold: 5 });

    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 15,
      clientY: 0,
      pointerId: 1,
    }); // schedules RAF, never flushed

    pz.destroy();
    expect(cancelSpy).toHaveBeenCalled();

    const before = stage.style.transform;

    // 破棄後はリスナーが外れているため、以下は何の効果も持たない
    firePointer(surface, "pointerdown", {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    firePointer(surface, "pointermove", {
      clientX: 200,
      clientY: 0,
      pointerId: 1,
    });
    surface.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        clientX: 0,
        clientY: 0,
        bubbles: true,
        cancelable: true,
      })
    );
    surface.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    resetButton.click();
    vi.advanceTimersByTime(50);

    expect(stage.style.transform).toBe(before);
  });
});
