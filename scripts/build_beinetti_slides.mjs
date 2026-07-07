import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "/private/tmp/beinetti-slides-work/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const OUT = "/Users/ianmanuelpaniaguaporroa/Documents/chatbot-AI/outputs/propuesta-postres-beinetti-whatsapp-slides.pptx";
const PREVIEW_DIR = "/private/tmp/beinetti-slides-work/preview";
const QA_DIR = "/private/tmp/beinetti-slides-work/qa";

const W = 1280;
const H = 720;
const M = 64;

const C = {
  ink: "#111111",
  muted: "#5A5A5A",
  soft: "#F4F1ED",
  panel: "#EFECEA",
  line: "#CFC8C1",
  accent: "#D76F37",
  accentDark: "#A64D22",
  green: "#1F7A55",
  white: "#FFFFFF",
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
    name: opts.name,
  });
  shape.text = text;
  shape.text.style = {
    fontSize: opts.size ?? 22,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
  };
  return shape;
}

function addBox(slide, x, y, w, h, opts = {}) {
  const geometry = opts.geometry ?? "rect";
  const radiusAllowed = geometry === "rect" || geometry === "textbox" || geometry === "roundRect";
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill: opts.fill ?? C.panel,
    line: { style: "solid", fill: opts.line ?? "none", width: opts.lineWidth ?? 0 },
    ...(radiusAllowed ? { borderRadius: opts.radius ?? 0 } : {}),
    shadow: opts.shadow ?? "shadow-none",
    name: opts.name,
  });
}

function title(slide, text, subtitle = "") {
  addText(slide, text, M, 46, 1080, 90, { size: 43, bold: true });
  if (subtitle) addText(slide, subtitle, M, 136, 1040, 48, { size: 20, color: C.muted });
  addBox(slide, M, 202, 1152, 2, { fill: C.line });
}

function label(slide, text, x, y, w = 180) {
  addText(slide, text.toUpperCase(), x, y, w, 22, { size: 12, bold: true, color: C.accent });
}

function footer(slide, n) {
  addText(slide, "Postres Beinetti · Automatización WhatsApp", M, 674, 500, 20, { size: 11, color: C.muted });
  addText(slide, String(n).padStart(2, "0"), 1170, 674, 46, 20, { size: 11, color: C.muted, align: "right" });
}

function addMiniCard(slide, x, y, w, h, head, body, accent = C.accent) {
  addBox(slide, x, y, w, h, { fill: C.white, line: C.line, lineWidth: 1, radius: 12, shadow: "shadow-sm" });
  addBox(slide, x, y, 8, h, { fill: accent, radius: 4 });
  addText(slide, head, x + 24, y + 18, w - 42, 34, { size: 23, bold: true });
  addText(slide, body, x + 24, y + 64, w - 42, h - 78, { size: 17, color: C.muted });
}

function addFlowNode(slide, x, y, w, h, head, body, fill = C.white) {
  const node = addBox(slide, x, y, w, h, { fill, line: C.line, lineWidth: 1.2, radius: 16, shadow: "shadow-sm" });
  addText(slide, head, x + 18, y + 18, w - 36, 28, { size: 22, bold: true, align: "center" });
  addText(slide, body, x + 18, y + 54, w - 36, 58, { size: 15, color: C.muted, align: "center" });
  return node;
}

function addDotNumber(slide, n, x, y) {
  addBox(slide, x, y, 42, 42, { geometry: "ellipse", fill: C.accent });
  addText(slide, String(n), x, y + 6, 42, 22, { size: 21, bold: true, color: C.white, align: "center" });
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });

// 1
{
  const slide = deck.slides.add();
  slide.background.fill = C.soft;
  addText(slide, "Automatizar WhatsApp sin cambiar WhatsApp", M, 72, 860, 142, { size: 57, bold: true });
  addText(slide, "Propuesta para reducir trabajo manual, ordenar pedidos y preparar Postres Beinetti para crecer con Ágora POS.", M, 244, 690, 74, { size: 24, color: C.muted });
  addBox(slide, 840, 92, 300, 300, { geometry: "ellipse", fill: C.accent });
  addText(slide, "WA", 884, 181, 212, 70, { size: 62, bold: true, color: C.white, align: "center" });
  addText(slide, "Bot + equipo\n+ pedidos claros", 872, 266, 236, 68, { size: 24, bold: true, color: C.white, align: "center" });
  addMiniCard(slide, M, 454, 250, 132, "Fase 1", "MVP WhatsApp automatizado");
  addMiniCard(slide, 340, 454, 250, 132, "Inversión", "3.500 €");
  addMiniCard(slide, 616, 454, 280, 132, "Mantenimiento", "250 €/mes + costes externos");
  footer(slide, 1);
}

// 2
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "El canal funciona; el cuello de botella es manual", "WhatsApp trae pedidos, pero hoy también trae fricción operativa.");
  addMiniCard(slide, 80, 262, 250, 230, "Conversaciones mezcladas", "Pedidos, dudas, cambios, horarios y recogidas llegan al mismo canal.", C.accent);
  addMiniCard(slide, 370, 262, 250, 230, "Datos repartidos", "Fecha, tienda, cantidad, sabor y detalles pueden quedar en varios mensajes.", C.accentDark);
  addMiniCard(slide, 660, 262, 250, 230, "Copia manual", "El equipo tiene que interpretar, ordenar y pasar información a producción.", C.muted);
  addMiniCard(slide, 950, 262, 250, 230, "Errores evitables", "Más volumen y nuevas tiendas aumentan el riesgo si el proceso sigue igual.", C.green);
  addText(slide, "La oportunidad no es cambiar el canal. Es poner orden antes de que el mensaje llegue al equipo.", 146, 548, 992, 48, { size: 27, bold: true, align: "center" });
  footer(slide, 2);
}

// 3
{
  const slide = deck.slides.add();
  slide.background.fill = C.soft;
  title(slide, "El cliente sigue escribiendo por WhatsApp", "Twilio trabaja por detrás como puente técnico entre WhatsApp y el sistema.");
  const a = addFlowNode(slide, 70, 304, 210, 126, "Cliente", "Escribe al WhatsApp de Beinetti");
  const b = addFlowNode(slide, 350, 304, 210, 126, "Twilio", "Recibe y envía mensajes");
  const c = addFlowNode(slide, 630, 304, 210, 126, "Sistema", "Clasifica, pregunta y registra");
  const d = addFlowNode(slide, 910, 304, 250, 126, "Equipo", "Recibe casos claros para revisar");
  slide.shapes.connect(a, b, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.accent, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  slide.shapes.connect(b, c, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.accent, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  slide.shapes.connect(c, d, { kind: "straight", fromSide: "right", toSide: "left", line: { style: "solid", fill: C.accent, width: 3 }, head: { type: "arrow", width: "med", length: "med" } });
  addText(slide, "Para el cliente final no cambia nada: sigue usando WhatsApp normal.", 214, 508, 852, 42, { size: 30, bold: true, align: "center" });
  footer(slide, 3);
}

// 4
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "El MVP separa cada conversación por intención", "El bot no intenta resolverlo todo; filtra, pregunta y deriva bien.");
  addMiniCard(slide, 92, 260, 245, 210, "Pedido normal", "Dirige a la tienda online o Ágora para que el pedido entre por el canal correcto.", C.green);
  addMiniCard(slide, 372, 260, 245, 210, "Tarta especial", "Recoge fecha, tienda, personas, sabor, temática e imagen de referencia.", C.accent);
  addMiniCard(slide, 652, 260, 245, 210, "Restaurante", "Transforma el WhatsApp en un resumen de pedido más claro y revisable.", C.accentDark);
  addMiniCard(slide, 932, 260, 245, 210, "Atención cliente", "Responde horarios, recogidas, ubicaciones, alérgenos y dudas frecuentes.", C.muted);
  addText(slide, "Humano siempre disponible cuando el caso requiere criterio o presupuesto final.", 174, 540, 932, 38, { size: 28, bold: true, align: "center" });
  footer(slide, 4);
}

// 5
{
  const slide = deck.slides.add();
  slide.background.fill = C.soft;
  title(slide, "El stack está pensado para lanzar rápido y escalar", "La primera versión es sencilla, pero no improvisada.");
  const rows = [
    ["WhatsApp", "Twilio API", "Salida rápida y conexión estable"],
    ["Backend", "Node.js + TypeScript", "Base mantenible para integraciones"],
    ["Datos", "PostgreSQL", "Pedidos, clientes, estados y trazabilidad"],
    ["Panel", "Next.js", "Revisión interna de pedidos y estados"],
    ["IA opcional", "OpenAI API", "Clasificar, resumir y extraer datos"],
  ];
  let y = 244;
  for (const [area, tech, why] of rows) {
    addBox(slide, 86, y, 1100, 58, { fill: C.white, line: C.line, lineWidth: 1, radius: 8 });
    addText(slide, area, 112, y + 16, 180, 22, { size: 18, bold: true, color: C.accentDark });
    addText(slide, tech, 344, y + 15, 250, 24, { size: 20, bold: true });
    addText(slide, why, 648, y + 15, 470, 24, { size: 19, color: C.muted });
    y += 70;
  }
  footer(slide, 5);
}

// 6
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "El retorno se ve en horas, errores y claridad", "No se vende un bot; se vende menos carga operativa.");
  addBox(slide, 90, 262, 486, 248, { fill: C.soft, line: C.line, lineWidth: 1, radius: 12 });
  label(slide, "Antes", 122, 292);
  addText(slide, "Una persona lee, interpreta, pregunta, copia y ordena cada conversación.", 122, 328, 388, 116, { size: 29, bold: true });
  addText(slide, "Más volumen = más riesgo de pedidos incompletos o datos mal pasados.", 122, 462, 400, 46, { size: 18, color: C.muted });
  addBox(slide, 704, 262, 486, 248, { fill: C.soft, line: C.line, lineWidth: 1, radius: 12 });
  label(slide, "Después", 736, 292);
  addText(slide, "El sistema filtra lo repetitivo y deja al equipo los casos importantes.", 736, 328, 388, 116, { size: 29, bold: true });
  addText(slide, "Cada pedido llega con un resumen más claro y datos mínimos recogidos.", 736, 462, 400, 46, { size: 18, color: C.muted });
  addBox(slide, 606, 360, 70, 70, { geometry: "ellipse", fill: C.accent });
  addText(slide, "→", 604, 369, 74, 40, { size: 44, bold: true, color: C.white, align: "center" });
  footer(slide, 6);
}

// 7
{
  const slide = deck.slides.add();
  slide.background.fill = C.soft;
  title(slide, "El alcance inicial queda controlado", "El MVP se enfoca en ahorrar tiempo ahora y dejar preparado lo siguiente.");
  addText(slide, "Incluye", 110, 244, 300, 40, { size: 35, bold: true });
  addText(slide, "Fase posterior", 720, 244, 360, 40, { size: 35, bold: true });
  const left = ["Configuración de Twilio", "Flujos de conversación", "FAQ y derivación a humano", "Pedidos de restaurantes por email/panel", "Panel básico y base de datos", "2 semanas de ajustes"];
  const right = ["Integración completa con Ágora POS", "Agente de voz", "Presupuestos complejos automáticos", "Campañas WhatsApp marketing", "CRM avanzado"];
  let y = 310;
  for (const item of left) {
    addDotNumber(slide, "✓", 112, y - 8);
    addText(slide, item, 170, y, 420, 26, { size: 21 });
    y += 50;
  }
  y = 310;
  for (const item of right) {
    addBox(slide, 724, y - 8, 42, 42, { geometry: "ellipse", fill: C.line });
    addText(slide, "→", 724, y, 42, 24, { size: 22, bold: true, color: C.ink, align: "center" });
    addText(slide, item, 782, y, 420, 26, { size: 21, color: C.muted });
    y += 58;
  }
  footer(slide, 7);
}

// 8
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "La inversión separa desarrollo y consumo", "El coste fijo cubre el trabajo; los proveedores externos dependen del uso real.");
  addBox(slide, 96, 260, 310, 210, { fill: C.accent, radius: 16 });
  addText(slide, "3.500 €", 126, 318, 250, 50, { size: 52, bold: true, color: C.white, align: "center" });
  addText(slide, "Desarrollo Fase 1", 126, 386, 250, 30, { size: 23, bold: true, color: C.white, align: "center" });
  addBox(slide, 486, 260, 310, 210, { fill: C.soft, line: C.line, lineWidth: 1, radius: 16 });
  addText(slide, "250 €/mes", 516, 318, 250, 50, { size: 48, bold: true, align: "center" });
  addText(slide, "Mantenimiento", 516, 386, 250, 30, { size: 23, bold: true, align: "center" });
  addBox(slide, 876, 260, 310, 210, { fill: C.soft, line: C.line, lineWidth: 1, radius: 16 });
  addText(slide, "75–200", 906, 306, 250, 44, { size: 43, bold: true, align: "center" });
  addText(slide, "€/mes", 906, 358, 250, 38, { size: 36, bold: true, align: "center" });
  addText(slide, "Costes externos\nestimados", 906, 410, 250, 48, { size: 20, bold: true, align: "center" });
  addText(slide, "Twilio/WhatsApp, hosting, base de datos, IA opcional y monitorización. El coste real se revisa tras las primeras semanas.", 154, 534, 972, 58, { size: 22, color: C.muted, align: "center" });
  addText(slide, "Nota: si aplica Kleinunternehmerregelung (§19 UStG), la factura se emitiría sin IVA; conviene confirmarlo fiscalmente antes de facturar.", 180, 624, 920, 30, { size: 14, color: C.muted, align: "center" });
  footer(slide, 8);
}

// 9
{
  const slide = deck.slides.add();
  slide.background.fill = C.soft;
  title(slide, "Empezamos pequeño para ganar control rápido", "Primero ahorrar tiempo y ordenar pedidos. Después automatizar más.");
  const steps = [
    ["1", "Accesos", "WhatsApp Business, Meta y Twilio"],
    ["2", "Flujos", "Pedidos, tartas, restaurantes y FAQs"],
    ["3", "Prototipo", "Primer bot y panel básico"],
    ["4", "Pruebas", "Conversaciones reales anonimizadas"],
    ["5", "Lanzamiento", "Ajustes durante las dos primeras semanas"],
  ];
  let x = 86;
  for (const [n, head, body] of steps) {
    addBox(slide, x, 290, 198, 210, { fill: C.white, line: C.line, lineWidth: 1, radius: 16, shadow: "shadow-sm" });
    addBox(slide, x + 20, 314, 48, 48, { geometry: "ellipse", fill: C.accent });
    addText(slide, n, x + 20, 323, 48, 24, { size: 24, bold: true, color: C.white, align: "center" });
    addText(slide, head, x + 20, 386, 150, 30, { size: 25, bold: true });
    addText(slide, body, x + 20, 430, 150, 58, { size: 17, color: C.muted });
    x += 230;
  }
  addText(slide, "Decisión recomendada: aprobar la Fase 1 y medir impacto real antes de ampliar a Ágora POS y voz.", 122, 566, 1036, 44, { size: 29, bold: true, align: "center" });
  footer(slide, 9);
}

await fs.mkdir(path.dirname(OUT), { recursive: true });
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
