export interface PanZoomController {
  /** SVG 差し替え後にフィット表示へリセットする */
  applySvg(): void;
  /** フィット表示へリセットする */
  reset(): void;
  /** イベントリスナーを解除する */
  destroy(): void;
}

export interface PanZoomOptions {
  surface: HTMLElement;
  stage: HTMLElement;
  resetButton?: HTMLButtonElement | null;
  tooltipEl?: HTMLElement | null;
  minScale?: number;
  maxScale?: number;
  panThreshold?: number;
  /** 矢印キー 1 回あたりの移動量（px） */
  keyPanStep?: number;
}

/** DOM_DELTA_LINE の 1 行をピクセルへ換算する係数 */
const WHEEL_LINE_PX = 16;

export function createPanZoom({
  surface,
  stage,
  resetButton,
  tooltipEl,
  minScale = 0.25,
  maxScale = 8,
  panThreshold = 5,
  keyPanStep = 48,
}: PanZoomOptions): PanZoomController {
  let scale = 1;
  let tx = 0;
  let ty = 0;

  let pendingPan: {
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
    pointerId: number;
  } | null = null;
  let panActive = false;
  let rafId: number | null = null;
  let pendingTx = 0;
  let pendingTy = 0;

  const cancelPendingFrame = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  const applyTransform = (
    s: number,
    x: number,
    y: number,
    animated: boolean
  ) => {
    // animated 時はインライン指定を外し、playground.css の transition
    // （reduced motion の無効化ルール込み）に委ねる。
    stage.style.transition = animated ? "" : "none";
    stage.style.transform = `matrix(${s},0,0,${s},${x},${y})`;
  };

  const fitToSurface = () => {
    cancelPendingFrame();
    // 進行中のパンを終了する。残すと後続の pointermove/pointerup が古い座標を再適用する。
    if (pendingPan) {
      surface.releasePointerCapture(pendingPan.pointerId);
      pendingPan = null;
      panActive = false;
      stage.classList.remove("is-panning");
      surface.classList.remove("is-panning");
    }
    const svg = stage.querySelector<SVGSVGElement>("svg");
    if (!svg) {
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform(scale, tx, ty, true);
      return;
    }

    const sw = surface.clientWidth;
    const rect = surface.getBoundingClientRect();
    const sh = Math.max(
      120,
      Math.min(surface.clientHeight, window.innerHeight - Math.max(0, rect.top))
    );
    const svgW = svg.viewBox.baseVal.width || svg.clientWidth || sw;
    const svgH = svg.viewBox.baseVal.height || svg.clientHeight || sh;

    const fitPad = 32;

    if (svgW <= 0 || svgH <= 0) {
      scale = 1;
      tx = 0;
      ty = 0;
    } else {
      scale = Math.min((sw - 2 * fitPad) / svgW, (sh - 2 * fitPad) / svgH, 1);
      scale = Math.max(scale, minScale);
      tx = (sw - svgW * scale) / 2;
      ty = (sh - svgH * scale) / 2;
    }

    applyTransform(scale, tx, ty, true);
  };

  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    // パンは単一ポインターで扱う。進行中の別 ID の pointerdown で状態を上書きしない。
    if (pendingPan) return;
    // reset ボタンなど surface 内の操作対象上での press はパン開始扱いにしない。
    // ここで pointer capture を取ってしまうと、ブラウザによっては pointerup のターゲットが
    // ボタンではなく surface にリダイレクトされ、応答するネイティブ click イベントが
    // 一切発火しなくなる（reset ボタンがクリックできなくなる）。
    if (
      resetButton &&
      e.target instanceof Node &&
      resetButton.contains(e.target)
    )
      return;
    pendingPan = {
      startX: e.clientX,
      startY: e.clientY,
      startTx: tx,
      startTy: ty,
      pointerId: e.pointerId,
    };
    panActive = false;
    surface.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pendingPan || pendingPan.pointerId !== e.pointerId) return;

    const dx = e.clientX - pendingPan.startX;
    const dy = e.clientY - pendingPan.startY;

    if (!panActive) {
      if (Math.hypot(dx, dy) < panThreshold) return;
      panActive = true;
      stage.classList.add("is-panning");
      surface.classList.add("is-panning");
      if (tooltipEl) {
        tooltipEl.removeAttribute("data-visible");
        tooltipEl.setAttribute("aria-hidden", "true");
      }
    }

    pendingTx = pendingPan.startTx + dx;
    pendingTy = pendingPan.startTy + dy;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        tx = pendingTx;
        ty = pendingTy;
        applyTransform(scale, tx, ty, false);
        rafId = null;
      });
    }
  };

  const endPan = (e: PointerEvent) => {
    if (!pendingPan || pendingPan.pointerId !== e.pointerId) return;
    cancelPendingFrame();
    if (panActive) {
      tx = pendingTx;
      ty = pendingTy;
      applyTransform(scale, tx, ty, false);
    }
    pendingPan = null;
    panActive = false;
    stage.classList.remove("is-panning");
    surface.classList.remove("is-panning");
    // lostpointercapture は capture が既に解放された後に届くため再解放しない。
    if (e.type !== "lostpointercapture") {
      surface.releasePointerCapture(e.pointerId);
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();

    // 保留中のパン描画を先に確定する。残すと次フレームでズーム前の座標が上書きされる。
    cancelPendingFrame();
    if (pendingPan && panActive) {
      // 最新のポインタ座標を、基準を付け替える前に復元しておく。
      pendingPan.startX += pendingTx - pendingPan.startTx;
      pendingPan.startY += pendingTy - pendingPan.startTy;
      tx = pendingTx;
      ty = pendingTy;
    }

    const rect = surface.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // deltaMode に応じて行・ページ単位の値をピクセルへ正規化する。
    const deltaPx =
      e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? e.deltaY * WHEEL_LINE_PX
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? e.deltaY * rect.height
          : e.deltaY;
    const delta = -deltaPx * 0.0015;
    const newScale = clamp(scale * (1 + delta), minScale, maxScale);
    const ratio = newScale / scale;

    tx = mx - ratio * (mx - tx);
    ty = my - ratio * (my - ty);
    scale = newScale;

    applyTransform(scale, tx, ty, false);

    if (pendingPan) {
      // 進行中のパンの基準をズーム後の位置へ付け替え、
      // 後続の pointermove/pointerup が古い基準で位置を巻き戻さないようにする。
      pendingPan.startTx = tx;
      pendingPan.startTy = ty;
      pendingTx = tx;
      pendingTy = ty;
    }
  };

  const onDblClick = () => fitToSurface();

  // スクロールと同じ向き: ArrowRight は表示領域を右へ動かす（コンテンツは左へ）。
  const keyPanDeltas: Record<string, [number, number]> = {
    ArrowLeft: [keyPanStep, 0],
    ArrowRight: [-keyPanStep, 0],
    ArrowUp: [0, keyPanStep],
    ArrowDown: [0, -keyPanStep],
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    // ボタン等に埋め込まれた操作対象のキー入力は奪わない。
    if (e.target !== surface) return;
    const delta = keyPanDeltas[e.key];
    if (!delta) return;
    e.preventDefault();
    // 保留中のパン描画を先に確定する。残すと後続の pointermove/pointerup が古い座標へ巻き戻す。
    cancelPendingFrame();
    if (pendingPan && panActive) {
      pendingPan.startX += pendingTx - pendingPan.startTx;
      pendingPan.startY += pendingTy - pendingPan.startTy;
      tx = pendingTx;
      ty = pendingTy;
    }
    tx += delta[0];
    ty += delta[1];
    applyTransform(scale, tx, ty, false);
    if (pendingPan) {
      // 進行中のパンの基準をキー移動後の位置へ付け替える。
      pendingPan.startTx = tx;
      pendingPan.startTy = ty;
      pendingTx = tx;
      pendingTy = ty;
    }
  };

  surface.addEventListener("keydown", onKeyDown);
  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("pointermove", onPointerMove);
  surface.addEventListener("pointerup", endPan);
  surface.addEventListener("pointercancel", endPan);
  surface.addEventListener("lostpointercapture", endPan);
  surface.addEventListener("wheel", onWheel, { passive: false });
  surface.addEventListener("dblclick", onDblClick);
  resetButton?.addEventListener("click", fitToSurface);

  return {
    applySvg() {
      // viewBox が読める状態になるまで 1 フレーム待つ
      requestAnimationFrame(() => fitToSurface());
    },
    reset: fitToSurface,
    destroy() {
      cancelPendingFrame();
      surface.removeEventListener("keydown", onKeyDown);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", endPan);
      surface.removeEventListener("pointercancel", endPan);
      surface.removeEventListener("lostpointercapture", endPan);
      surface.removeEventListener("wheel", onWheel);
      surface.removeEventListener("dblclick", onDblClick);
      resetButton?.removeEventListener("click", fitToSurface);
    },
  };
}
