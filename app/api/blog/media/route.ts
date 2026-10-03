import { randomBytes } from "node:crypto";
import { currentAdmin } from "@/lib/auth";
import { BlogError, MEDIA_TYPES, saveMedia, type MediaExt } from "@/lib/blog-store";

// Vercel caps request bodies at 4.5 MB; stay under it so the error message is ours.
const MAX_BYTES = 4 * 1024 * 1024;

// Trust the file's leading bytes, not its declared type: SVG and anything else is refused.
function sniff(b: Buffer): MediaExt | null {
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.length > 8 && b.readUInt32BE(0) === 0x89504e47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 6 && b.toString("ascii", 0, 4) === "GIF8") return "gif";
  return null;
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No image received." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Images must be under 4 MB." }, { status: 413 });
  const data = Buffer.from(await file.arrayBuffer());
  const ext = sniff(data);
  if (!ext) return Response.json({ error: "Use a PNG, JPEG, WebP or GIF image." }, { status: 415 });
  const name = `${randomBytes(10).toString("hex")}.${ext}`;
  try {
    await saveMedia(name, data);
  } catch (e) {
    if (e instanceof BlogError) return Response.json({ error: e.message }, { status: 503 });
    console.error("blog media upload failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "The image couldn't be saved. Try again." }, { status: 500 });
  }
  return Response.json({ url: `/blog/media/${name}`, type: MEDIA_TYPES[ext] });
}
