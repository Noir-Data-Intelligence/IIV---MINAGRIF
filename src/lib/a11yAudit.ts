// Lightweight accessibility audit runner using axe-core.
// Loads each route inside a hidden iframe, injects axe-core (same-origin),
// runs the WCAG ruleset and returns structured results.
//
// Focus rules required by the user: colour contrast and tap/text sizes.
// We still run the full WCAG 2.1 AA ruleset and flag the focused ones.

import axeSource from "axe-core/axe.min.js?raw";

export interface A11yNode {
  target: string;
  html: string;
  failureSummary: string;
}

export interface A11yViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  help: string;
  helpUrl: string;
  description: string;
  tags: string[];
  nodes: A11yNode[];
  category: "contraste" | "tamanho" | "outro";
}

export interface RouteAuditResult {
  path: string;
  label: string;
  scannedAt: string;
  durationMs: number;
  violations: A11yViolation[];
  passCount: number;
  incompleteCount: number;
  error?: string;
}

const CONTRAST_RULES = new Set(["color-contrast", "color-contrast-enhanced"]);
const SIZE_RULES = new Set(["target-size", "meta-viewport", "meta-viewport-large"]);

function classify(id: string): A11yViolation["category"] {
  if (CONTRAST_RULES.has(id)) return "contraste";
  if (SIZE_RULES.has(id)) return "tamanho";
  return "outro";
}

function waitForLoad(iframe: HTMLIFrameElement, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error("Tempo esgotado ao carregar a rota."));
    }, timeoutMs);
    iframe.addEventListener("load", () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      // Give the app a moment to hydrate and render data.
      window.setTimeout(resolve, 1200);
    }, { once: true });
  });
}

// axe.run() em rotas com animações CSS contínuas (ex: hero com Ken Burns) pode nunca
// resolver — o MutationObserver interno do axe mantém-se ocupado com o reflow constante.
// Sem este timeout, uma única rota problemática bloqueia o crawl das restantes 14.
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (v) => { window.clearTimeout(timer); resolve(v); },
      (e) => { window.clearTimeout(timer); reject(e); },
    );
  });
}

export async function auditRoute(
  path: string,
  label: string,
  container: HTMLElement,
  viewport: { width: number; height: number },
): Promise<RouteAuditResult> {
  const start = performance.now();
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `
    position: absolute; left: -99999px; top: 0;
    width: ${viewport.width}px; height: ${viewport.height}px;
    border: 0; visibility: hidden;
  `;
  iframe.src = path;
  container.appendChild(iframe);

  try {
    await waitForLoad(iframe);
    const win = iframe.contentWindow as any;
    const doc = iframe.contentDocument;
    if (!win || !doc) throw new Error("Não foi possível aceder ao documento da rota.");

    // Congela animações/transições CSS antes de correr o axe. Rotas com animação
    // contínua (Ken Burns do hero, gráficos, "pulse") mantêm o layout em recalculo
    // permanente; o axe fica preso num loop síncrono de recalculo de estilos que nenhum
    // timeout consegue interromper (single-threaded). Uma vez congelado, o axe analisa
    // um snapshot estático — mais rápido e mais determinístico.
    const freeze = doc.createElement("style");
    freeze.textContent = `*, *::before, *::after {
      animation-play-state: paused !important;
      animation-duration: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`;
    doc.head.appendChild(freeze);

    // Inject axe-core into the iframe scope (same origin -> permitted).
    if (!win.axe) {
      const script = doc.createElement("script");
      script.textContent = axeSource;
      doc.head.appendChild(script);
    }
    const axe = win.axe;
    if (!axe) throw new Error("Falhou a injecção do motor de auditoria.");

    const results = await withTimeout(
      axe.run(doc, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        resultTypes: ["violations", "passes", "incomplete"],
      }),
      20000,
      "Tempo esgotado a analisar a rota (possível animação contínua a bloquear o motor de auditoria).",
    );

    const violations: A11yViolation[] = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact ?? null,
      help: v.help,
      helpUrl: v.helpUrl,
      description: v.description,
      tags: v.tags,
      category: classify(v.id),
      nodes: v.nodes.slice(0, 5).map((n: any) => ({
        target: Array.isArray(n.target) ? n.target.join(" ") : String(n.target),
        html: n.html?.slice(0, 240) ?? "",
        failureSummary: n.failureSummary ?? "",
      })),
    }));

    return {
      path,
      label,
      scannedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - start),
      violations,
      passCount: results.passes.length,
      incompleteCount: results.incomplete.length,
    };
  } catch (e: any) {
    return {
      path,
      label,
      scannedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - start),
      violations: [],
      passCount: 0,
      incompleteCount: 0,
      error: e?.message ?? "Erro desconhecido.",
    };
  } finally {
    container.removeChild(iframe);
  }
}

export interface AuditSummary {
  total: number;
  contraste: number;
  tamanho: number;
  outro: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export function summarise(results: RouteAuditResult[]): AuditSummary {
  const s: AuditSummary = {
    total: 0, contraste: 0, tamanho: 0, outro: 0,
    critical: 0, serious: 0, moderate: 0, minor: 0,
  };
  for (const r of results) {
    for (const v of r.violations) {
      const count = v.nodes.length || 1;
      s.total += count;
      s[v.category] += count;
      if (v.impact === "critical") s.critical += count;
      else if (v.impact === "serious") s.serious += count;
      else if (v.impact === "moderate") s.moderate += count;
      else if (v.impact === "minor") s.minor += count;
    }
  }
  return s;
}
