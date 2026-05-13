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
}

export function createPanZoom({
  surface,
  stage,
  resetButton,
  tooltipEl,
  minScale = 0.25,
  maxScale = 8,
  panThreshold = 5,
}: PanZoomOptions): PanZoomController {
  let scale = 1;
  let tx = 0;
  let ty = 0;

  let pendingPan: { startX: number; startY: number; startTx: number; startTy: number; pointerId: number } | null = null;
  let panActive = false;
  let rafId: number | null = null;
  let pendingTx = 0;
  let pendingTy = 0;

  const applyTransform = (s: number, x: number, y: number, animated: boolean) => {
    stage.style.transition = animated ? "transform 0.18s ease" : "none";
    stage.style.transform = `matrix(${s},0,0,${s},${x},${y})`;
  };

  const fitToSurface = () => {
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

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    pendingPan = { startX: e.clientX, startY: e.clientY, startTx: tx, startTy: ty, pointerId: e.pointerId };
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
    if (panActive) {
      tx = pendingTx;
      ty = pendingTy;
      applyTransform(scale, tx, ty, false);
    }
    pendingPan = null;
    panActive = false;
    stage.classList.remove("is-panning");
    surface.classList.remove("is-panning");
    surface.releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();

    const rect = surface.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = -e.deltaY * 0.0015;
    const newScale = clamp(scale * (1 + delta), minScale, maxScale);
    const ratio = newScale / scale;

    tx = mx - ratio * (mx - tx);
    ty = my - ratio * (my - ty);
    scale = newScale;

    applyTransform(scale, tx, ty, false);
  };

  const onDblClick = () => fitToSurface();

  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("pointermove", onPointerMove);
  surface.addEventListener("pointerup", endPan);
  surface.addEventListener("pointercancel", endPan);
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
      if (rafId !== null) cancelAnimationFrame(rafId);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", endPan);
      surface.removeEventListener("pointercancel", endPan);
      surface.removeEventListener("wheel", onWheel);
      surface.removeEventListener("dblclick", onDblClick);
      resetButton?.removeEventListener("click", fitToSurface);
    },
  };
}
