
import fetch from "node-fetch";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

const WIDTH = 1280;
const HEIGHT = 720;
const ZOOM_DEFAULT = 17;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end("POST only");
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyRaw = Buffer.concat(chunks).toString("utf8") || "{}";
    let body;
    try { body = JSON.parse(bodyRaw); } catch { body = {}; }

    const lat = Number(body.lat);
    const lon = Number(body.lon);
    const zoom = Number(body.zoom || ZOOM_DEFAULT);
    const labels = Array.isArray(body.labels) ? body.labels.slice(0,3) : [];
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      res.statusCode = 400;
      return res.end("lat/lon required");
    }

    // Reverse geocoding (best-effort) via Nominatim
    let title = "", subtitle = "";
    try {
      const nomi = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`, {
        headers: { "User-Agent": "satmap-action" }
      });
      const j = await nomi.json();
      const a = j.address || {};
      title = a.city || a.town || a.village || a.municipality || a.county || "" ;
      const street = [a.road, a.house_number].filter(Boolean).join(" ");
      subtitle = street;
    } catch (e) {
      // ignore reverse errors; we can still render
    }

    // Base satellite image via Google Static Maps
    const gkey = process.env.GOOGLE_STATIC_KEY;
    if (!gkey) {
      res.statusCode = 500;
      return res.end("Missing GOOGLE_STATIC_KEY env var");
    }
    const baseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${WIDTH}x${HEIGHT}&maptype=satellite&markers=color:red%7C${lat},${lon}&key=${gkey}`;
    const imgResp = await fetch(baseUrl);
    if (!imgResp.ok) {
      res.statusCode = 502;
      return res.end("Static Maps fetch failed");
    }
    const arrayBuf = await imgResp.arrayBuffer();
    const baseImg = await loadImage(Buffer.from(arrayBuf));

    // Prepare canvas & fonts
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    // Try to register a default font (DejaVuSans)
    try {
      GlobalFonts.registerFromPath("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVuSans");
    } catch {}
    ctx.drawImage(baseImg, 0, 0, WIDTH, HEIGHT);

    // Top overlay
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(20, 20, WIDTH - 40, 120);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px DejaVuSans, Arial, sans-serif";
    ctx.fillText(title || "Localidad", 40, 70);
    if (subtitle) {
      ctx.font = "28px DejaVuSans, Arial, sans-serif";
      ctx.fillText(subtitle, 40, 110);
    }

    // Labels box (bottom-left)
    const tags = labels.filter(x => x && String(x).trim()).map(String);
    if (tags.length) {
      ctx.font = "26px DejaVuSans, Arial, sans-serif";
      const maxW = Math.max(...tags.map(t => ctx.measureText(t).width));
      const boxW = Math.min(WIDTH - 40, maxW + 40);
      const boxH = tags.length * 36 + 24;
      const x = 20, y = HEIGHT - boxH - 20;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x, y, boxW, boxH);
      ctx.fillStyle = "#FFFFFF";
      tags.forEach((t, i) => ctx.fillText(t, x + 20, y + 28 + i * 36));
    }

    const png = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.statusCode = 200;
    return res.end(png);
  } catch (err) {
    res.statusCode = 500;
    return res.end("error: " + (err?.message || String(err)));
  }
}
