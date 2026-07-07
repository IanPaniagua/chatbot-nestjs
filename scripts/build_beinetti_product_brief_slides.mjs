import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "/private/tmp/beinetti-brief-slides-work/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const OUT = "/Users/ianmanuelpaniaguaporroa/Documents/chatbot-AI/outputs/product-brief-postres-beinetti-slides.pptx";
const PREVIEW_DIR = "/private/tmp/beinetti-brief-slides-work/preview";
const QA_DIR = "/private/tmp/beinetti-brief-slides-work/qa";

const W = 1280;
const H = 720;
const M = 68;
const C = {
  bg: "#F6F1EC",
  paper: "#FFFFFF",
  ink: "#151515",
  muted: "#5F5A55",
  soft: "#ECE3DA",
  line: "#D8CCC0",
  orange: "#D96D36",
  orangeDark: "#A34A24",
  green: "#2F7D57",
  blue: "#2D5B7C",
  red: "#A4423A",
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function shape(slide, geometry, x, y, w, h, opts = {}) {
  const radiusAllowed = ["rect", "textbox", "roundRect"].includes(geometry);
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill: opts.fill ?? "none",
    line: { style: "solid", fill: opts.line ?? "none", width: opts.lineWidth ?? 0 },
    ...(radiusAllowed ? { borderRadius: opts.radius ?? 0 } : {}),
    shadow: opts.shadow ?? "shadow-none",
    name: opts.name,
  });
}

function text(slide, value, x, y, w, h, opts = {}) {
  const box = shape(slide, "textbox", x, y, w, h, { fill: "none" });
  box.text = value;
  box.text.style = {
    fontSize: opts.size ?? 22,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
  };
  return box;
}

function line(slide, x, y, w, color = C.line) {
  shape(slide, "rect", x, y, w, 2, { fill: color });
}

function footer(slide, n) {
  text(slide, "Postres Beinetti · Product brief WhatsApp", M, 676, 470, 18, { size: 11, color: C.muted });
  text(slide, String(n).padStart(2, "0"), 1160, 676, 54, 18, { size: 11, color: C.muted, align: "right" });
}

function title(slide, value, subtitle = "") {
  text(slide, value, M, 44, 1060, 58, { size: 40, bold: true });
  if (subtitle) text(slide, subtitle, M, 112, 980, 34, { size: 18, color: C.muted });
  line(slide, M, 164, 1144);
}

function eyebrow(slide, value, x, y, w = 260) {
  text(slide, value.toUpperCase(), x, y, w, 18, { size: 12, bold: true, color: C.orangeDark });
}

function card(slide, x, y, w, h, head, body, opts = {}) {
  shape(slide, "roundRect", x, y, w, h, {
    fill: opts.fill ?? C.paper,
    line: opts.line ?? C.line,
    lineWidth: 1,
    radius: 14,
    shadow: opts.shadow ?? "shadow-sm",
  });
  if (opts.accent) shape(slide, "rect", x, y, 8, h, { fill: opts.accent, radius: 4 });
  text(slide, head, x + 24, y + 20, w - 44, 32, { size: opts.headSize ?? 23, bold: true, color: opts.headColor ?? C.ink });
  text(slide, body, x + 24, y + 64, w - 44, h - 80, { size: opts.bodySize ?? 17, color: opts.bodyColor ?? C.muted });
}

function bigMetric(slide, x, y, w, h, metric, label, fill = C.paper, color = C.ink) {
  shape(slide, "roundRect", x, y, w, h, { fill, line: C.line, lineWidth: 1, radius: 16, shadow: "shadow-sm" });
  text(slide, metric, x + 18, y + 34, w - 36, 58, { size: 44, bold: true, color, align: "center" });
  text(slide, label, x + 26, y + 106, w - 52, 42, { size: 18, color: C.muted, align: "center" });
}

function bullet(slide, value, x, y, w, color = C.orange) {
  shape(slide, "ellipse", x, y + 7, 12, 12, { fill: color });
  text(slide, value, x + 28, y, w - 28, 28, { size: 20, color: C.ink });
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });

// 1. Cover
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  eyebrow(slide, "Product brief", M, 64);
  text(slide, "Ordenar WhatsApp para crecer sin duplicar trabajo", M, 118, 760, 154, { size: 56, bold: true });
  text(slide, "MVP para automatizar conversaciones, reducir errores y preparar la integración futura con Agora POS.", M, 300, 720, 68, { size: 24, color: C.muted });
  shape(slide, "ellipse", 875, 108, 270, 270, { fill: C.orange });
  text(slide, "WA", 920, 180, 180, 56, { size: 58, bold: true, color: C.paper, align: "center" });
  text(slide, "Bot + equipo\n+ pedidos claros", 900, 254, 220, 70, { size: 24, bold: true, color: C.paper, align: "center" });
  bigMetric(slide, M, 484, 238, 112, "R1", "MVP operativo", C.paper);
  bigMetric(slide, 340, 484, 238, 112, "R2", "Optimización", C.paper);
  bigMetric(slide, 612, 484, 290, 112, "3.500 EUR", "Desarrollo inicial", C.orange, C.paper);
  footer(slide, 1);
}

// 2. Context
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "WhatsApp ya es el canal principal", "La oportunidad está en ordenar un canal que el cliente ya usa.");
  card(slide, 88, 238, 330, 230, "Hoy", "Pedidos particulares, restaurantes, tartas especiales y dudas entran mezclados por WhatsApp.", { accent: C.orange });
  card(slide, 474, 238, 330, 230, "Crecimiento", "Más tiendas y más volumen hacen que el proceso manual sea cada vez más caro y frágil.", { accent: C.blue });
  card(slide, 860, 238, 330, 230, "Direccion correcta", "No se cambia WhatsApp. Se crea una capa que clasifica, pregunta y registra antes de pasar al equipo.", { accent: C.green });
  text(slide, "La meta del MVP es convertir conversaciones sueltas en pedidos y casos revisables.", 174, 544, 932, 34, { size: 28, bold: true, align: "center" });
  footer(slide, 2);
}

// 3. Problems
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  title(slide, "El problema no es el volumen, es la falta de estructura", "Cada mensaje manualmente interpretado aumenta tiempo y riesgo.");
  const items = [
    ["Tiempo repetitivo", "El equipo responde una y otra vez a dudas frecuentes."],
    ["Datos incompletos", "Fecha, tienda, cantidad y sabor llegan repartidos."],
    ["Flujos mezclados", "Particulares, restaurantes y tartas especiales entran juntos."],
    ["Errores humanos", "Copiar pedidos manualmente aumenta olvidos y datos mal pasados."],
    ["Escala limitada", "Mas tiendas multiplican la carga si el proceso sigue igual."],
  ];
  let y = 210;
  for (const [head, body] of items) {
    shape(slide, "roundRect", 110, y, 1060, 78, { fill: C.paper, line: C.line, lineWidth: 1, radius: 12 });
    shape(slide, "rect", 110, y, 8, 78, { fill: C.red, radius: 4 });
    text(slide, head, 142, y + 15, 260, 26, { size: 21, bold: true });
    text(slide, body, 430, y + 17, 660, 24, { size: 19, color: C.muted });
    y += 88;
  }
  footer(slide, 3);
}

// 4. Solution
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "La solución es una capa operativa sobre WhatsApp", "Twilio conecta el WhatsApp de Beinetti con el sistema de automatización.");
  const a = cardNode(slide, 76, 292, "Cliente", "Escribe por WhatsApp");
  const b = cardNode(slide, 342, 292, "Twilio", "Puente tecnico");
  const c = cardNode(slide, 608, 292, "Sistema", "Clasifica y recoge datos");
  const d = cardNode(slide, 874, 292, "Equipo", "Recibe resumen claro");
  slide.shapes.connect(a, b, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.orange, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  slide.shapes.connect(b, c, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.orange, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  slide.shapes.connect(c, d, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.orange, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  text(slide, "Para el cliente final no cambia nada: sigue usando WhatsApp.", 212, 514, 856, 40, { size: 30, bold: true, align: "center" });
  footer(slide, 4);
}

function cardNode(slide, x, y, head, body) {
  const node = shape(slide, "roundRect", x, y, 210, 122, { fill: C.bg, line: C.line, lineWidth: 1, radius: 16, shadow: "shadow-sm" });
  text(slide, head, x + 20, y + 24, 170, 28, { size: 23, bold: true, align: "center" });
  text(slide, body, x + 22, y + 62, 166, 38, { size: 16, color: C.muted, align: "center" });
  return node;
}

// 5. MVP
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  title(slide, "El MVP ahorra tiempo sin esperar a Agora POS", "Primero se ordena WhatsApp. Después se integra más profundo.");
  card(slide, 92, 242, 330, 250, "Incluye", "Twilio, bot de clasificación, flujos principales, FAQs, derivación a humano, base de datos y bandeja básica.", { accent: C.green });
  card(slide, 476, 242, 330, 250, "No incluye todavía", "Integración completa con Agora, voz, CRM avanzado, campañas de marketing o presupuestos complejos automáticos.", { accent: C.red });
  card(slide, 860, 242, 330, 250, "Resultado", "WhatsApp pasa de bandeja desordenada a canal filtrado, medible y preparado para crecer.", { accent: C.orange });
  text(slide, "El MVP controla el riesgo: resuelve lo urgente y deja lista la base técnica.", 156, 548, 968, 38, { size: 28, bold: true, align: "center" });
  footer(slide, 5);
}

// 6. R1
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "R1 convierte mensajes en casos ordenados", "Release 1 es el MVP operativo para reducir carga manual.");
  const items = [
    "Clasificación inicial: normal, especial, restaurante, FAQ o humano.",
    "Pedido normal: envio a tienda online/Agora.",
    "Tarta especial: fecha, tienda, personas, sabor, temática e imagen.",
    "Restaurante: pedido estructurado por email o panel básico.",
    "FAQ: horarios, ubicaciones, recogidas y alérgenos.",
    "Bandeja básica: nuevo, pendiente y revisado.",
  ];
  let y = 226;
  items.forEach((item) => {
    bullet(slide, item, 154, y, 960);
    y += 58;
  });
  footer(slide, 6);
}

// 7. R2
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  title(slide, "R2 conecta mejor WhatsApp con operación interna", "La segunda fase depende de aprendizaje real y disponibilidad de API.");
  const cols = [
    ["Panel", "Catálogo editable, estados completos y exportación diaria para obrador."],
    ["Integración", "Conexión con Agora POS cuando exista documentación/API utilizable."],
    ["Inteligencia", "Mejor extracción de datos, resumen automático, multiidioma y preparación para voz."],
  ];
  let x = 94;
  for (const [head, body] of cols) {
    card(slide, x, 264, 336, 220, head, body, { accent: C.blue });
    x += 382;
  }
  text(slide, "R2 no se promete a ciegas: se presupuesta mejor cuando R1 genere datos y Agora confirme su API.", 164, 548, 950, 38, { size: 26, bold: true, align: "center" });
  footer(slide, 7);
}

// 8. Stack
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "El stack elegido es profesional y escalable", "Suficiente para el MVP, preparado para integraciones y crecimiento.");
  const rows = [
    ["WhatsApp", "Twilio API", "Conexión rápida y estable"],
    ["Backend", "NestJS + TypeScript", "Arquitectura modular para crecer"],
    ["Datos", "PostgreSQL + Prisma", "Pedidos, clientes, estados y trazabilidad"],
    ["Panel", "Next.js", "Bandeja interna y futura operación"],
    ["IA opcional", "OpenAI API", "Clasificar, resumir y extraer datos"],
  ];
  let y = 228;
  for (const [a, b, c] of rows) {
    shape(slide, "roundRect", 100, y, 1080, 58, { fill: C.bg, line: C.line, lineWidth: 1, radius: 8 });
    text(slide, a, 130, y + 16, 180, 22, { size: 18, bold: true, color: C.orangeDark });
    text(slide, b, 358, y + 15, 300, 24, { size: 20, bold: true });
    text(slide, c, 720, y + 15, 410, 24, { size: 18, color: C.muted });
    y += 72;
  }
  footer(slide, 8);
}

// 9. OKR
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  title(slide, "El MVP debe medirse por ahorro y calidad", "OKR propuesto para validar si la automatización funciona.");
  card(slide, 96, 242, 420, 260, "Objetivo", "Reducir el tiempo manual dedicado a WhatsApp y mejorar la calidad de los pedidos recibidos.", { accent: C.orange, headSize: 30, bodySize: 22 });
  bigMetric(slide, 586, 242, 250, 118, "30-50%", "menos conversaciones repetitivas manuales", C.paper);
  bigMetric(slide, 884, 242, 250, 118, "70%", "pedidos especiales con datos mínimos", C.paper);
  bigMetric(slide, 586, 398, 250, 118, "80%", "clasificacion correcta de conversaciones", C.paper);
  bigMetric(slide, 884, 398, 250, 118, "100%", "trazabilidad de pedidos entrantes", C.paper);
  footer(slide, 9);
}

// 10. KPIs
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "Los KPIs muestran si el sistema está quitando carga", "No basta con que el bot responda: debe mejorar la operación.");
  const items = [
    ["Conversaciones gestionadas", "volumen real que pasa por el sistema"],
    ["Derivación a humano", "casos que aún requieren atención"],
    ["Pedidos completos", "calidad de los datos recogidos"],
    ["Primera respuesta", "velocidad percibida por cliente"],
    ["Errores detectados", "datos faltantes o mal estructurados"],
    ["Ahorro semanal", "tiempo estimado liberado del equipo"],
  ];
  let x = 90;
  let y = 244;
  items.forEach(([head, body], idx) => {
    card(slide, x, y, 340, 122, head, body, { accent: idx % 2 ? C.blue : C.green, headSize: 20, bodySize: 16 });
    x += 386;
    if (x > 900) {
      x = 90;
      y += 158;
    }
  });
  footer(slide, 10);
}

// 11. Roadmap
{
  const slide = deck.slides.add();
  slide.background.fill = C.bg;
  title(slide, "La hoja de ruta evita prometer integraciones a ciegas", "Se avanza por capas, validando cada paso.");
  const steps = [
    ["R1", "Ordenar WhatsApp", "Twilio, bot, FAQs, pedidos y bandeja básica"],
    ["R2", "Optimizar operación", "Panel mejorado, estados, catálogo y reporting"],
    ["R3", "Integrar Agora", "Pedidos y producción cuando la API esté lista"],
    ["R4", "IA y voz", "Multiidioma, extracción avanzada y llamadas"],
  ];
  let x = 92;
  steps.forEach(([num, head, body]) => {
    shape(slide, "roundRect", x, 260, 250, 250, { fill: C.paper, line: C.line, lineWidth: 1, radius: 16, shadow: "shadow-sm" });
    shape(slide, "ellipse", x + 24, 288, 52, 52, { fill: C.orange });
    text(slide, num, x + 24, 301, 52, 26, { size: 22, bold: true, color: C.paper, align: "center" });
    text(slide, head, x + 24, 368, 200, 62, { size: 23, bold: true });
    text(slide, body, x + 24, 448, 196, 48, { size: 16, color: C.muted });
    x += 286;
  });
  footer(slide, 11);
}

// 12. Budget
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "Presupuesto para arrancar con R1", "Precio cerrado para el MVP, con mantenimiento y costes externos separados.");
  budgetBox(slide, 102, 248, "3.500 EUR", "", "Desarrollo R1 / MVP", C.orange, C.paper);
  budgetBox(slide, 486, 248, "250", "EUR/mes", "Mantenimiento", C.bg, C.ink);
  budgetBox(slide, 870, 248, "75-200", "EUR/mes", "Costes externos estimados", C.bg, C.ink);
  text(slide, "Incluye configuración, bot, flujos principales, base de datos, panel/bandeja básica, despliegue, pruebas, documentación y 2 semanas de ajustes.", 134, 500, 1012, 44, { size: 21, color: C.muted, align: "center" });
  text(slide, "Nota fiscal: si aplica Kleinunternehmerregelung en Alemania, se emitiría sin IVA, pendiente de confirmación fiscal.", 190, 592, 900, 24, { size: 14, color: C.muted, align: "center" });
  footer(slide, 12);
}

function budgetBox(slide, x, y, main, sub, label, fill, color) {
  shape(slide, "roundRect", x, y, 310, 184, { fill, line: C.line, lineWidth: 1, radius: 16, shadow: "shadow-sm" });
  if (sub) {
    text(slide, main, x + 26, y + 36, 258, 46, { size: 42, bold: true, color, align: "center" });
    text(slide, sub, x + 26, y + 88, 258, 38, { size: 30, bold: true, color, align: "center" });
    text(slide, label, x + 26, y + 136, 258, 28, { size: 18, color: fill === C.orange ? C.paper : C.muted, align: "center" });
  } else {
    text(slide, main, x + 26, y + 54, 258, 52, { size: 39, bold: true, color, align: "center" });
    text(slide, label, x + 26, y + 116, 258, 28, { size: 18, color: fill === C.orange ? C.paper : C.muted, align: "center" });
  }
}

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.rm(PREVIEW_DIR, { recursive: true, force: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });
await fs.mkdir(QA_DIR, { recursive: true });

for (const [index, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  await writeBlob(path.join(PREVIEW_DIR, `${stem}.png`), await deck.export({ slide, format: "png", scale: 1 }));
  await fs.writeFile(path.join(QA_DIR, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
}

await writeBlob(path.join(PREVIEW_DIR, "montage.webp"), await deck.export({ format: "webp", montage: true, scale: 1 }));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT);
console.log(OUT);
