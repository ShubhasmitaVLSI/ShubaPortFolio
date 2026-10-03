import { MEDIA_TYPES, getMedia, isMediaName, type MediaExt } from "@/lib/blog-store";

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = isMediaName(file) ? await getMedia(file) : null;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MEDIA_TYPES[file.split(".")[1] as MediaExt],
      // Names are random and never reused, so the bytes behind a URL never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
