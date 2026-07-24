import type { APIRoute, GetStaticPaths } from "astro";
import { OG_CARDS, type OgCardKey, renderOgPng } from "../../lib/og-image";

/**
 * ページ種別ごとの OG 画像を `/og/<type>.png` として静的生成する。
 * 種別定義は og-image.ts の OG_CARDS が単一の出典。
 */
export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(OG_CARDS).map((type) => ({ params: { type } }));

export const GET: APIRoute = ({ params }) => {
  const type = params.type as OgCardKey;
  const spec = OG_CARDS[type];
  if (!spec) {
    return new Response("Not found", { status: 404 });
  }
  const png = renderOgPng(spec);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
