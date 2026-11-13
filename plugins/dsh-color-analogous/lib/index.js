/**
 * 颜色工具：analogous — 颜色工具
 */

export const name = "dsh-color-analogous";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

function hex(t) {
  let s = String(t).trim().replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) throw new Error("需要 #RRGGBB 或 #RGB");
  return s.toUpperCase();
}
function rgb(t) { const h = hex(t); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function toHex(a) { return "#" + a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("").toUpperCase(); }
function hsl(t) {
  const [r, g, b] = rgb(t).map((x) => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}
function lum(t) { const [r, g, b] = rgb(t).map((x) => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function adjust(t, a, kind) { const [h, s, l] = hsl(t); const n = Number(a) || 0; if (kind === "light") return fromHsl(h, s, Math.min(100, l + n)); if (kind === "dark") return fromHsl(h, s, Math.max(0, l - n)); if (kind === "sat") return fromHsl(h, Math.min(100, s + n), l); return fromHsl(h, Math.max(0, s - n), l); }

const OPS = {
  hex_to_rgb: (t) => { const [r, g, b] = rgb(t); return "rgb(" + r + ", " + g + ", " + b + ")"; },
  rgb_to_hex: (t) => { const m = String(t).match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/); if (!m) throw new Error("格式如 255,0,0"); return toHex([Number(m[1]), Number(m[2]), Number(m[3])]); },
  hex_to_hsl: (t) => { const [h, s, l] = hsl(t); return "hsl(" + Math.round(h) + ", " + Math.round(s) + "%, " + Math.round(l) + "%)"; },
  hsl_to_hex: (t) => { const m = String(t).match(/([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/); if (!m) throw new Error("格式如 0,100%,50%"); return fromHsl(Number(m[1]), Number(m[2]), Number(m[3])); },
  rgb_to_hsl: (t) => { const m = String(t).match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/); if (!m) throw new Error("格式如 255,0,0"); return OPS.hex_to_hsl(toHex([Number(m[1]), Number(m[2]), Number(m[3])])); },
  hsl_to_rgb: (t) => { const m = String(t).match(/([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/); if (!m) throw new Error("格式如 0,100%,50%"); const [r, g, b] = rgb(fromHsl(Number(m[1]), Number(m[2]), Number(m[3]))); return "rgb(" + r + ", " + g + ", " + b + ")"; },
  hex_to_cmyk: (t) => { const [r, g, b] = rgb(t).map((x) => x / 255); const k = 1 - Math.max(r, g, b); const c = k === 1 ? 0 : (1 - r - k) / (1 - k); const m = k === 1 ? 0 : (1 - g - k) / (1 - k); const y = k === 1 ? 0 : (1 - b - k) / (1 - k); return "cmyk(" + Math.round(c * 100) + "%, " + Math.round(m * 100) + "%, " + Math.round(y * 100) + "%, " + Math.round(k * 100) + "%)"; },
  cmyk_to_hex: (t) => { const m = String(t).match(/([\d.]+)%?[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/); if (!m) throw new Error("格式如 0,100,100,0"); const [c, y2, y, k] = [Number(m[1]) / 100, Number(m[2]) / 100, Number(m[3]) / 100, Number(m[4]) / 100]; return toHex([255 * (1 - c) * (1 - k), 255 * (1 - y2) * (1 - k), 255 * (1 - y) * (1 - k)]); },
  lighten: (t, a) => adjust(t, a || "10", "light"),
  darken: (t, a) => adjust(t, a || "10", "dark"),
  saturate: (t, a) => adjust(t, a || "10", "sat"),
  desaturate: (t, a) => adjust(t, a || "10", "desat"),
  mix: (t, a) => { const [r1, g1, b1] = rgb(t); const m = String(a).match(/(#[0-9a-fA-F]{3,6})[,\s]+([\d.]+)/); if (!m) throw new Error("格式如 #FFFFFF,50"); const [r2, g2, b2] = rgb(m[1]); const w = Number(m[2]) / 100; return toHex([r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w]); },
  contrast: (t, a) => { const l1 = lum(t), l2 = lum(a); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); return "对比度: " + (Math.round(ratio * 100) / 100) + ":1 " + (ratio >= 4.5 ? "（AA 正文通过）" : ratio >= 3 ? "（大字号通过）" : "（不达标）"); },
  luminance: (t) => "相对亮度: " + (Math.round(lum(t) * 1000) / 1000),
  readable_text: (t) => (lum(t) > 0.35 ? "#000000（深色字）" : "#FFFFFF（浅色字）"),
  invert: (t) => toHex(rgb(t).map((x) => 255 - x)),
  grayscale: (t) => { const [r, g, b] = rgb(t); const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b); return toHex([y, y, y]); },
  sepia: (t) => { const [r, g, b] = rgb(t); return toHex([0.393 * r + 0.769 * g + 0.189 * b, 0.349 * r + 0.686 * g + 0.168 * b, 0.272 * r + 0.534 * g + 0.131 * b]); },
  complement: (t) => { const [h, s, l] = hsl(t); return fromHsl(h + 180, s, l); },
  analogous: (t) => { const [h, s, l] = hsl(t); return [fromHsl(h - 30, s, l), String(t).toUpperCase(), fromHsl(h + 30, s, l)].join(NL); },
  triadic: (t) => { const [h, s, l] = hsl(t); return [String(t).toUpperCase(), fromHsl(h + 120, s, l), fromHsl(h + 240, s, l)].join(NL); },
  tetradic: (t) => { const [h, s, l] = hsl(t); return [String(t).toUpperCase(), fromHsl(h + 90, s, l), fromHsl(h + 180, s, l), fromHsl(h + 270, s, l)].join(NL); },
  split_complement: (t) => { const [h, s, l] = hsl(t); return [String(t).toUpperCase(), fromHsl(h + 150, s, l), fromHsl(h + 210, s, l)].join(NL); },
  alpha_blend: (t, a) => { const m = String(a).match(/(#[0-9a-fA-F]{3,6}),\s*([0-9.]+)/); if (!m) throw new Error("格式如 #FFFFFF,0.5"); const [r1, g1, b1] = rgb(t); const [r2, g2, b2] = rgb(m[1]); const al = Number(m[2]); return toHex([r1 * al + r2 * (1 - al), g1 * al + g2 * (1 - al), b1 * al + b2 * (1 - al)]); },
  hex_shorthand: (t) => { const h = hex(t); return h[0] === h[1] && h[2] === h[3] && h[4] === h[5] ? "#" + h[0] + h[2] + h[4] : "无法缩写"; },
  hex_normalize: (t) => toHex(rgb(t)),
  css_gradient: (t, a) => { const sec = String(a || "").trim() || OPS.complement(t); return "linear-gradient(135deg, " + String(t).toUpperCase() + " 0%, " + sec + " 100%)"; },
  tailwind_shades: (t) => { const [h, s, l] = hsl(t); return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => k + ": " + fromHsl(h, s, Math.max(5, Math.min(97, 100 - k / 10)))).join(NL); },
  palette_complement: (t) => { const [h, s, l] = hsl(t); return [fromHsl(h, s, Math.max(10, l - 20)), String(t).toUpperCase(), fromHsl(h, s, Math.min(90, l + 20)), fromHsl(h + 180, s, l)].join(NL); },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "color_analogous",
    description: "analogous",
    parameters: {
      text: { "type": "string", required: true, "description": "#RRGGBB 或 rgb()" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      try {
        const fn = OPS["analogous"];
        if (!fn) throw new Error("未知操作");
        return { text: ["颜色工具：analogous", "=".repeat(52), String(fn(t, a)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}
