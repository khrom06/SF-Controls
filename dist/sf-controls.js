(() => {
"use strict";
// SF-kit 1.0 — shared design tokens and card base class. The same file ships in every SF-* card repository (keep them identical).
// Visual language: the palette and HUD frame of SF-Cards (https://github.com/khrom06/SF-Cards), so cards from different repos sit side by side.
const SF_VARS_DARK = `--sf-cyan:#00e5ff; --sf-amber:#ffb300; --sf-red:#ff3355; --sf-green:#2bff88; --sf-grey:#5b6b7d; --sf-text:#cfefff; --sf-dim:#7fa3bd;
    --sf-cyan-rgb:0 229 255; --sf-amber-rgb:255 179 0; --sf-red-rgb:255 51 85; --sf-green-rgb:43 255 136; --sf-fg-rgb:255 255 255; --sf-strong:#fff;
    --sf-bg0:#0d2440; --sf-bg1:#06101d; --sf-bg2:#03080f; --sf-on-accent:#03080f; --sf-violet:#b388ff; --sf-violet-rgb:179 136 255;`;
const SF_VARS_LIGHT = `--sf-cyan:#00798f; --sf-amber:#a85f00; --sf-red:#c8173d; --sf-green:#08783f; --sf-grey:#52687a; --sf-text:#1c3a4e; --sf-dim:#37536a;
    --sf-cyan-rgb:0 121 143; --sf-amber-rgb:168 95 0; --sf-red-rgb:200 23 61; --sf-green-rgb:8 120 63; --sf-fg-rgb:4 40 62; --sf-strong:#04141f;
    --sf-bg0:#fbfdff; --sf-bg1:#eef5fb; --sf-bg2:#e2edf6; --sf-on-accent:#fff; --sf-violet:#6a3bc4; --sf-violet-rgb:106 59 196;`;

const SF_BASE_CSS = `
  :host { display:block; ${SF_VARS_DARK} }
  :host([theme="light"]) { ${SF_VARS_LIGHT} }
  * { box-sizing:border-box; }
  :host([dir="rtl"]) .hud { direction:rtl; } :host([dir="rtl"]) svg, :host([dir="rtl"]) .track, :host([dir="rtl"]) input[type=range] { direction:ltr; }
  .hud { position:relative; overflow:hidden; border-radius:14px; padding:16px 18px 18px; color:var(--sf-text);
    background: radial-gradient(ellipse at 50% -20%, var(--sf-bg0) 0%, var(--sf-bg1) 60%, var(--sf-bg2) 100%);
    border:1px solid rgb(var(--sf-cyan-rgb) / .22); font-family:'B612 Mono', ui-monospace, monospace; font-size:13px;
    box-shadow: inset 0 0 40px rgb(var(--sf-cyan-rgb) / .06), 0 0 22px rgb(var(--sf-cyan-rgb) / .07); }
  .hud::after { content:""; position:absolute; inset:0; pointer-events:none;
    background: repeating-linear-gradient(0deg, rgb(var(--sf-fg-rgb) / .022) 0 1px, transparent 1px 3px); }
  .c { position:absolute; width:14px; height:14px; border-color:var(--sf-cyan); border-style:solid; opacity:.8; }
  .c.tl { top:6px; left:6px; border-width:2px 0 0 2px; } .c.tr { top:6px; right:6px; border-width:2px 2px 0 0; }
  .c.bl { bottom:6px; left:6px; border-width:0 0 2px 2px; } .c.br { bottom:6px; right:6px; border-width:0 2px 2px 0; }
  .head { display:flex; align-items:center; gap:10px; margin-bottom:14px; font-family:Orbitron, ui-sans-serif, sans-serif; font-weight:700;
    font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--sf-cyan); }
  .head .grow { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .head .tag { font-size:10px; letter-spacing:.12em; padding:2px 8px; border-radius:20px; border:1px solid currentColor; }
  .tag.ok { color:var(--sf-green); } .tag.warn { color:var(--sf-amber); } .tag.bad { color:var(--sf-red); }
  .empty { padding:18px 6px; text-align:center; color:var(--sf-dim); letter-spacing:.08em; }
  .err { color:var(--sf-red); padding:10px; border:1px dashed var(--sf-red); border-radius:8px; }
  [data-act] { cursor:pointer; }
  [data-act]:focus-visible, button:focus-visible, input:focus-visible { outline:2px solid var(--sf-cyan); outline-offset:2px; border-radius:6px; }
  button { font:inherit; color:inherit; background:rgb(var(--sf-cyan-rgb) / .1); border:1px solid rgb(var(--sf-cyan-rgb) / .35);
    border-radius:8px; padding:6px 12px; cursor:pointer; }
  button:hover { background:rgb(var(--sf-cyan-rgb) / .2); }
  @media (pointer: coarse) { button, .row { min-height:40px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const sfEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sfNum = (v, d = NaN) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const sfLang = (hass) => String((hass && (hass.locale?.language || hass.language)) || "en").slice(0, 2).toLowerCase();
// Translation lookup with English fallback: sfT(dict, lang, key, {n: 3}) replaces {n}.
const sfT = (dict, lang, key, vars) => {
  let s = (dict[lang] && dict[lang][key]) ?? (dict.en && dict.en[key]) ?? key;
  // In right-to-left text, numbers with Latin units are isolated so "5 min" is not scrambled by the bidi algorithm.
  if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(lang === "ar" ? "\u2066" + vars[k] + "\u2069" : String(vars[k]));
  return s;
};
// Human duration from seconds: "45 s", "12 min", "3 h 05", "2 d 4 h".
const sfAge = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) return "–";
  if (sec < 90) return Math.round(sec) + " s";
  const m = Math.floor(sec / 60); if (m < 90) return m + " min";
  const h = Math.floor(m / 60); if (h < 48) return h + " h " + String(m % 60).padStart(2, "0");
  return Math.floor(h / 24) + " d " + (h % 24) + " h";
};
const sfName = (st, id) => (st && st.attributes && st.attributes.friendly_name) || id;
const sfMoreInfo = (el, entityId) => el.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));

// Base class. Subclasses provide: normalize(config) -> config, signature() -> string (cheap; the card re-renders only when it changes),
// body() -> html string, title(), tag() (optional {cls,text}), css (optional), onAct(el, ev) for [data-act] clicks, tick (ms, optional timer).
// Re-rendering never loops: it happens on (a) a new signature, (b) setConfig, (c) the optional timer, nothing else.
class SFCard extends HTMLElement {
  constructor() {
    super(); this.attachShadow({ mode: "open" }); this._cfg = null; this._hass = null; this._sig = null; this._timer = null;
    this.shadowRoot.addEventListener("click", (ev) => { const el = ev.target.closest && ev.target.closest("[data-act]"); if (el && this.onAct) this.onAct(el, ev); });
    this.shadowRoot.addEventListener("keydown", (ev) => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("[data-act][role=button]")) { ev.preventDefault(); ev.target.click(); } });
  }
  setConfig(c) { if (!c || typeof c !== "object") throw new Error("Invalid configuration"); this._cfg = this.normalize(c); this._sig = null; this._draw(); }
  set hass(h) { this._hass = h; if (!this._cfg) return; const s = this.signature(); if (s !== this._sig) { this._sig = s; this._draw(); } }
  get hass() { return this._hass; }
  connectedCallback() { if (this.tick && !this._timer) this._timer = setInterval(() => this._draw(), this.tick); }
  disconnectedCallback() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
  // Language: the card's own `language` option wins, otherwise the Home Assistant UI language (first two letters, e.g. zh-Hans -> zh).
  _lang() { const o = this._cfg && this._cfg.language; return typeof o === "string" && o ? o.slice(0, 2).toLowerCase() : sfLang(this._hass); }
  getCardSize() { return 3; }
  _theme() { const t = this._cfg && this._cfg.theme; if (t === "light" || t === "dark") return t; return this._hass && this._hass.themes && this._hass.themes.darkMode === false ? "light" : "dark"; }
  _draw() {
    if (!this._cfg) return;
    const root = this.shadowRoot, ae = root.activeElement;
    const keep = ae && ae.id ? { id: ae.id, value: ae.value, s: ae.selectionStart, e: ae.selectionEnd } : null;
    this.setAttribute("theme", this._theme()); this.setAttribute("dir", this._lang() === "ar" ? "rtl" : "ltr");
    let inner;
    try {
      const tag = this.tag ? this.tag() : null, ttl = this.title() || "";
      inner = `<div class="hud"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
        ${ttl || tag ? `<div class="head"><span class="grow">${sfEsc(ttl)}</span>${tag ? `<span class="tag ${tag.cls}">${sfEsc(tag.text)}</span>` : ""}</div>` : ""}${this.body()}</div>`;
    } catch (e) { inner = `<div class="hud"><div class="err">${sfEsc(this.constructor.name)}: ${sfEsc(e && e.message)}</div></div>`; }
    root.innerHTML = `<style>${SF_BASE_CSS}${this.css || ""}</style>${inner}`;
    if (keep) { const n = root.getElementById(keep.id); if (n) { if (n.value !== undefined && n.tagName === "INPUT" && n.type !== "range") n.value = keep.value; n.focus(); try { n.setSelectionRange(keep.s, keep.e); } catch (e) { /* not a text input */ } } }
  }
}
const sfRegister = (tag, cls, name, description) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === tag)) window.customCards.push({ type: tag, name, description, preview: false });
};
// ---- sf-fan-card ----------------------------------------------------------------------------------------------------------------------------
// Fan features (Home Assistant bit flags): SET_SPEED 1, OSCILLATE 2, DIRECTION 4, PRESET_MODE 8.
const FAN_I18N = {
  en: { off: "OFF", on: "ON", speed: "Speed", presets: "Mode", osc: "Oscillate", dir: "Reverse", unavailable: "Unavailable", missing: "Entity not found: {id}" },
  fr: { off: "ARRÊT", on: "MARCHE", speed: "Vitesse", presets: "Mode", osc: "Oscillation", dir: "Inverser", unavailable: "Indisponible", missing: "Entité introuvable : {id}" },
  de: { off: "AUS", on: "AN", speed: "Stufe", presets: "Modus", osc: "Schwenken", dir: "Umkehren", unavailable: "Nicht verfügbar", missing: "Entität nicht gefunden: {id}" },
  es: { off: "APAGADO", on: "ENCENDIDO", speed: "Velocidad", presets: "Modo", osc: "Oscilar", dir: "Invertir", unavailable: "No disponible", missing: "Entidad no encontrada: {id}" },
  nl: {"off": "UIT", "on": "AAN", "speed": "Snelheid", "presets": "Modus", "osc": "Zwenken", "dir": "Omkeren", "unavailable": "Niet beschikbaar", "missing": "Entiteit niet gevonden: {id}"},
  it: {"off": "SPENTO", "on": "ACCESO", "speed": "Velocità", "presets": "Modalità", "osc": "Oscillazione", "dir": "Inverti", "unavailable": "Non disponibile", "missing": "Entità non trovata: {id}"},
  pt: {"off": "DESLIGADO", "on": "LIGADO", "speed": "Velocidade", "presets": "Modo", "osc": "Oscilar", "dir": "Inverter", "unavailable": "Indisponível", "missing": "Entidade não encontrada: {id}"},
  pl: {"off": "WYŁ.", "on": "WŁ.", "speed": "Prędkość", "presets": "Tryb", "osc": "Oscylacja", "dir": "Odwróć", "unavailable": "Niedostępny", "missing": "Nie znaleziono encji: {id}"},
  ru: {"off": "ВЫКЛ", "on": "ВКЛ", "speed": "Скорость", "presets": "Режим", "osc": "Качание", "dir": "Реверс", "unavailable": "Недоступно", "missing": "Сущность не найдена: {id}"},
  zh: {"off": "关", "on": "开", "speed": "风速", "presets": "模式", "osc": "摆头", "dir": "反转", "unavailable": "不可用", "missing": "未找到实体：{id}"},
  ar: {"off": "إيقاف", "on": "تشغيل", "speed": "السرعة", "presets": "الوضع", "osc": "التأرجح", "dir": "عكس", "unavailable": "غير متوفر", "missing": "الكيان غير موجود: {id}"},
};

// Rotor period in seconds for a speed percentage: 100 % -> 0.45 s per turn, 1 % -> 4 s; off -> 0 (no animation).
function fanPeriod(on, pct) { if (!on) return 0; const p = Math.min(100, Math.max(1, Number.isFinite(pct) ? pct : 50)); return +(4 - (p - 1) * (3.55 / 99)).toFixed(2); }

class SFFanCard extends SFCard {
  static getStubConfig() { return { entity: "fan.living_room" }; }
  normalize(c) { if (typeof c.entity !== "string" || !c.entity.startsWith("fan.")) throw new Error("entity: a fan.* entity is required"); this._drag = false; return { ...c }; }
  _st() { return this._hass && this._hass.states[this._cfg.entity]; }
  signature() {
    if (this._drag) return this._sig;   // do not re-render under the user's finger
    const s = this._st(); return s ? [s.state, s.attributes.percentage, s.attributes.preset_mode, s.attributes.oscillating, s.attributes.direction, s.attributes.friendly_name].join("|") + this._theme() : "-" + this._theme();
  }
  title() { const s = this._st(); return this._cfg.name || (s && s.attributes.friendly_name) || this._cfg.entity; }
  tag() { const s = this._st(), L = this._lang(); if (!s) return null; return s.state === "unavailable" ? { cls: "bad", text: sfT(FAN_I18N, L, "unavailable") } : { cls: s.state === "on" ? "ok" : "warn", text: sfT(FAN_I18N, L, s.state === "on" ? "on" : "off") }; }
  get css() { return `
    .stage { display:flex; justify-content:center; margin:2px 0 10px; } .stage svg { width:120px; height:120px; }
    .rotor { transform-origin:60px 60px; } .rotor.spin { animation:spin var(--p) linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }
    .blade { fill:rgb(var(--sf-cyan-rgb) / .35); stroke:var(--sf-cyan); stroke-width:1.4; } .off .blade { fill:rgb(var(--sf-grey-rgb, 120 140 160) / .25); stroke:var(--sf-grey); }
    .hub { fill:var(--sf-bg1); stroke:var(--sf-cyan); stroke-width:2; } .ring { fill:none; stroke:rgb(var(--sf-cyan-rgb) / .3); stroke-width:2; }
    .ctl { display:flex; align-items:center; gap:12px; margin:8px 0; } .ctl label { width:84px; color:var(--sf-dim); font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
    input[type=range] { flex:1; accent-color:var(--sf-cyan); height:28px; } .val { width:44px; text-align:right; color:var(--sf-strong); }
    .chips { display:flex; flex-wrap:wrap; gap:6px; flex:1; } .chips button.on, button.on { background:rgb(var(--sf-cyan-rgb) / .3); border-color:var(--sf-cyan); color:var(--sf-strong); }
    .dis { opacity:.5; pointer-events:none; }`; }
  body() {
    const s = this._st(), L = this._lang(), t = (k, v) => sfT(FAN_I18N, L, k, v);
    if (!s) return `<div class="err">${sfEsc(t("missing", { id: this._cfg.entity }))}</div>`;
    const a = s.attributes || {}, on = s.state === "on", dead = s.state === "unavailable" || s.state === "unknown", feat = Number(a.supported_features) || 0;
    const pct = sfNum(a.percentage, on ? 100 : 0), per = fanPeriod(on, a.percentage == null ? NaN : pct), step = Math.max(1, sfNum(a.percentage_step, 1));
    const blade = (r) => `<path class="blade" transform="rotate(${r} 60 60)" d="M60 60 C46 44 48 18 60 12 C72 18 74 44 60 60Z"/>`;
    let h = `<div class="stage ${on ? "" : "off"} ${dead ? "dis" : ""}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring" cx="60" cy="60" r="56"/><g class="rotor ${per ? "spin" : ""}" style="--p:${per || 1}s">${blade(0)}${blade(120)}${blade(240)}</g><circle class="hub" cx="60" cy="60" r="9"/></svg></div>`;
    h += `<div class="ctl ${dead ? "dis" : ""}"><button data-act="power" class="${on ? "on" : ""}" aria-pressed="${on}">${sfEsc(t(on ? "on" : "off"))}</button>`;
    if ((feat & 1) || a.percentage != null) h += `<input id="sl" type="range" min="0" max="100" step="${step}" value="${Math.round(pct)}" aria-label="${sfEsc(t("speed"))}"><span class="val" id="vv">${Math.round(pct)}%</span>`;
    h += `</div>`;
    if (Array.isArray(a.preset_modes) && a.preset_modes.length) h += `<div class="ctl ${dead ? "dis" : ""}"><label>${sfEsc(t("presets"))}</label><div class="chips">${a.preset_modes.map((m) => `<button data-act="preset" data-m="${sfEsc(m)}" class="${a.preset_mode === m ? "on" : ""}" aria-pressed="${a.preset_mode === m}">${sfEsc(m)}</button>`).join("")}</div></div>`;
    if (feat & 2 || a.oscillating != null || (feat & 4) || a.direction) {
      h += `<div class="ctl ${dead ? "dis" : ""}"><label></label><div class="chips">`;
      if ((feat & 2) || a.oscillating != null) h += `<button data-act="osc" class="${a.oscillating ? "on" : ""}" aria-pressed="${!!a.oscillating}">${sfEsc(t("osc"))}</button>`;
      if ((feat & 4) || a.direction) h += `<button data-act="dir" class="${a.direction === "reverse" ? "on" : ""}" aria-pressed="${a.direction === "reverse"}">${sfEsc(t("dir"))}</button>`;
      h += `</div></div>`;
    }
    return h;
  }
  connectedCallback() {
    super.connectedCallback();
    if (this._bound) return; this._bound = true;
    const r = this.shadowRoot;
    r.addEventListener("pointerdown", (e) => { if (e.target.id === "sl") this._drag = true; });
    r.addEventListener("input", (e) => { if (e.target.id === "sl") { const v = r.getElementById("vv"); if (v) v.textContent = e.target.value + "%"; } });
    r.addEventListener("change", (e) => {
      if (e.target.id !== "sl") return; this._drag = false;
      const pct = Math.round(Number(e.target.value)); if (!Number.isFinite(pct)) return;
      this._call(pct === 0 ? "turn_off" : "set_percentage", pct === 0 ? {} : { percentage: pct });
    });
    r.addEventListener("pointerup", () => { if (this._drag) setTimeout(() => { this._drag = false; }, 400); });   // released without a change event
  }
  _call(service, data) { const s = this._st(); if (!s || !this._hass) return; Promise.resolve(this._hass.callService("fan", service, { entity_id: this._cfg.entity, ...data })).catch(() => {}); }
  onAct(el) {
    const s = this._st(); if (!s) return; const a = s.attributes || {};
    switch (el.dataset.act) {
      case "power": this._call(s.state === "on" ? "turn_off" : "turn_on", {}); break;
      case "preset": this._call("set_preset_mode", { preset_mode: el.dataset.m }); break;
      case "osc": this._call("oscillate", { oscillating: !a.oscillating }); break;
      case "dir": this._call("set_direction", { direction: a.direction === "reverse" ? "forward" : "reverse" }); break;
    }
  }
}
sfRegister("sf-fan-card", SFFanCard, "SF Fan", "Fan card: animated rotor, speed slider, preset modes, oscillation and direction.");
// ---- sf-bar-card ----------------------------------------------------------------------------------------------------------------------------
const BAR_I18N = { en: { missing: "Not found", none: "No entities configured" }, fr: { missing: "Introuvable", none: "Aucune entité configurée" }, de: { missing: "Nicht gefunden", none: "Keine Entitäten konfiguriert" }, es: { missing: "No encontrada", none: "Sin entidades configuradas" }, nl: {"missing": "Niet gevonden", "none": "Geen entiteiten ingesteld"}, it: {"missing": "Non trovata", "none": "Nessuna entità configurata"}, pt: {"missing": "Não encontrada", "none": "Nenhuma entidade configurada"}, pl: {"missing": "Nie znaleziono", "none": "Brak skonfigurowanych encji"}, ru: {"missing": "Не найдено", "none": "Сущности не настроены"}, zh: {"missing": "未找到", "none": "未配置实体"}, ar: {"missing": "غير موجود", "none": "لم يتم إعداد أي كيан"}, };
const BAR_COLORS = { cyan: "var(--sf-cyan)", green: "var(--sf-green)", amber: "var(--sf-amber)", red: "var(--sf-red)", violet: "var(--sf-violet)", grey: "var(--sf-grey)" };

// Picks the severity band for a value: the band with the highest `from` that is <= value (bands may be given in any order).
function barColor(value, severity, fallback) {
  let best = null;
  for (const b of Array.isArray(severity) ? severity : []) if (b && Number.isFinite(+b.from) && value >= +b.from && (!best || +b.from > +best.from)) best = b;
  const c = best ? best.color : fallback;
  return BAR_COLORS[c] || (typeof c === "string" && /^(#[0-9a-f]{3,8}|rgb|hsl)/i.test(c.trim()) ? c : BAR_COLORS.cyan);
}
// Fraction 0..1 of the bar that is filled; min == max or garbage yields 0 (never NaN).
function barFraction(v, min, max) { if (!Number.isFinite(v) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0; return Math.min(1, Math.max(0, (v - min) / (max - min))); }

class SFBarCard extends SFCard {
  static getStubConfig() { return { entities: [{ entity: "sensor.battery_level", min: 0, max: 100, unit: "%" }] }; }
  normalize(c) {
    const raw = [].concat(c.entities || [], c.entity || []);
    const rows = raw.map((r) => (typeof r === "string" ? { entity: r } : r)).filter((r) => r && typeof r.entity === "string");
    return { ...c, rows: rows.map((r) => ({ ...c.defaults, ...r })), min: sfNum(c.min, 0), max: sfNum(c.max, 100) };
  }
  signature() { const st = this._hass ? this._hass.states : {}; return this._cfg.rows.map((r) => { const s = st[r.entity]; return r.entity + ":" + (s ? (r.attribute ? s.attributes[r.attribute] : s.state) : "-"); }).join("|") + this._theme(); }
  title() { return this._cfg.title || ""; }
  get css() { return `
    .row { padding:7px 4px; } .top { display:flex; justify-content:space-between; gap:10px; margin-bottom:5px; } .nm { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--sf-strong); }
    .v { color:var(--sf-text); white-space:nowrap; } .v small { color:var(--sf-dim); } .track { position:relative; height:10px; border-radius:6px; background:rgb(var(--sf-cyan-rgb) / .1); border:1px solid rgb(var(--sf-cyan-rgb) / .2); overflow:hidden; }
    .fill { position:absolute; inset:0 auto 0 0; border-radius:6px; background:var(--col); box-shadow:0 0 10px var(--col); transition:width .5s ease; opacity:.92; }
    .tick { position:absolute; top:-2px; bottom:-2px; width:2px; background:var(--sf-strong); opacity:.8; } .na { color:var(--sf-grey); }`; }
  body() {
    const L = this._lang(), st = this._hass ? this._hass.states : {}, c = this._cfg;
    if (!c.rows.length) return `<div class="empty">${sfEsc(sfT(BAR_I18N, L, "none"))}</div>`;
    return c.rows.map((r) => {
      const s = st[r.entity], raw = s ? (r.attribute ? s.attributes[r.attribute] : s.state) : undefined, v = sfNum(raw);
      const min = sfNum(r.min, c.min), max = sfNum(r.max, c.max), dec = Math.max(0, Math.min(6, Math.round(sfNum(r.decimals, Math.abs(v) < 10 ? 1 : 0))));
      const name = r.name || (s && s.attributes.friendly_name) || r.entity, unit = r.unit != null ? r.unit : (s && s.attributes.unit_of_measurement) || "";
      const frac = barFraction(v, min, max), col = barColor(v, r.severity || c.severity, r.color || c.color || "cyan");
      const tgt = sfNum(r.target, NaN), tf = Number.isFinite(tgt) ? barFraction(tgt, min, max) : null;
      const val = Number.isFinite(v) ? `${v.toFixed(dec)}<small> ${sfEsc(unit)}</small>` : `<span class="na">${sfEsc(s ? (raw == null ? "–" : raw) : sfT(BAR_I18N, L, "missing"))}</span>`;
      return `<div class="row" data-act="info" data-id="${sfEsc(r.entity)}" role="button" tabindex="0"><div class="top"><span class="nm">${sfEsc(name)}</span><span class="v">${val}</span></div>`
        + `<div class="track" role="progressbar" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${Number.isFinite(v) ? v : 0}"><div class="fill" style="width:${(frac * 100).toFixed(1)}%;--col:${col}"></div>${tf != null ? `<i class="tick" style="left:${(tf * 100).toFixed(1)}%"></i>` : ""}</div></div>`;
    }).join("");
  }
  onAct(el) { if (el.dataset.act === "info") sfMoreInfo(this, el.dataset.id); }
}
sfRegister("sf-bar-card", SFBarCard, "SF Bar", "Horizontal bar gauges for one or more entities, with severity colours and an optional target marker.");
// ---- sf-todo-card ---------------------------------------------------------------------------------------------------------------------------
const TODO_I18N = {
  en: { title: "To-do", add: "Add an item…", addBtn: "Add", done: "Completed", clear: "Clear completed", empty: "Nothing to do", err: "Could not read the list", missing: "Entity not found: {id}" },
  fr: { title: "À faire", add: "Ajouter un élément…", addBtn: "Ajouter", done: "Terminés", clear: "Effacer les terminés", empty: "Rien à faire", err: "Liste illisible", missing: "Entité introuvable : {id}" },
  de: { title: "Aufgaben", add: "Eintrag hinzufügen…", addBtn: "Hinzufügen", done: "Erledigt", clear: "Erledigte löschen", empty: "Nichts zu tun", err: "Liste nicht lesbar", missing: "Entität nicht gefunden: {id}" },
  es: { title: "Tareas", add: "Añadir elemento…", addBtn: "Añadir", done: "Completadas", clear: "Borrar completadas", empty: "Nada que hacer", err: "No se puede leer la lista", missing: "Entidad no encontrada: {id}" },
 nl: {"title": "Taken", "add": "Item toevoegen…", "addBtn": "Toevoegen", "done": "Voltooid", "clear": "Voltooide wissen", "empty": "Niets te doen", "err": "Lijst niet leesbaar", "missing": "Entiteit niet gevonden: {id}"},
 it: {"title": "Da fare", "add": "Aggiungi elemento…", "addBtn": "Aggiungi", "done": "Completati", "clear": "Cancella completati", "empty": "Niente da fare", "err": "Elenco illeggibile", "missing": "Entità non trovata: {id}"},
 pt: {"title": "Tarefas", "add": "Adicionar item…", "addBtn": "Adicionar", "done": "Concluídas", "clear": "Limpar concluídas", "empty": "Nada a fazer", "err": "Lista ilegível", "missing": "Entidade não encontrada: {id}"},
 pl: {"title": "Do zrobienia", "add": "Dodaj pozycję…", "addBtn": "Dodaj", "done": "Ukończone", "clear": "Wyczyść ukończone", "empty": "Nic do zrobienia", "err": "Nie można odczytać listy", "missing": "Nie znaleziono encji: {id}"},
 ru: {"title": "Задачи", "add": "Добавить пункт…", "addBtn": "Добавить", "done": "Выполнено", "clear": "Очистить выполненные", "empty": "Нечего делать", "err": "Не удалось прочитать список", "missing": "Сущность не найдена: {id}"},
 zh: {"title": "待办", "add": "添加项目…", "addBtn": "添加", "done": "已完成", "clear": "清除已完成", "empty": "无待办事项", "err": "无法读取列表", "missing": "未找到实体：{id}"},
 ar: {"title": "المهام", "add": "إضافة عنصر…", "addBtn": "إضافة", "done": "مكتملة", "clear": "مسح المكتملة", "empty": "لا شيء للقيام به", "err": "تعذّرت قراءة القائمة", "missing": "الكيان غير موجود: {id}"},
};
const TODO_MIN_INTERVAL = 3000;

// Normalises what todo.get_items returns for one entity into [{uid, summary, done, due}] (junk entries dropped).
function todoItems(resp, entityId) {
  const list = resp && resp.response && resp.response[entityId] && resp.response[entityId].items;
  return (Array.isArray(list) ? list : []).filter((i) => i && typeof i.summary === "string").map((i) => ({ uid: i.uid || i.summary, summary: i.summary, done: i.status === "completed", due: i.due || "" }));
}

class SFTodoCard extends SFCard {
  static getStubConfig() { return { entity: "todo.shopping_list" }; }
  normalize(c) {
    if (typeof c.entity !== "string" || !c.entity.startsWith("todo.")) throw new Error("entity: a todo.* entity is required");
    this._items = []; this._error = false; this._inflight = false; this._dirty = true; this._last = 0; this._showDone = false; return { ...c };
  }
  signature() { const s = this._hass && this._hass.states[this._cfg.entity], v = s ? s.state + ":" + (s.last_updated || "") : "-"; if (v !== this._tdSig) { this._tdSig = v; this._dirty = true; } return v + this._theme(); }
  title() { return this._cfg.title || (this._st() && this._st().attributes.friendly_name) || sfT(TODO_I18N, this._lang(), "title"); }
  _st() { return this._hass && this._hass.states[this._cfg.entity]; }
  tag() { const s = this._st(); return s && /^\d+$/.test(s.state) ? { cls: +s.state ? "warn" : "ok", text: s.state } : null; }
  get tick() { return 30000; }
  _draw() { this._fetch(); super._draw(); }
  _fetch(force) {
    if (!this._cfg || !this._hass || this._inflight || !this._st()) return;
    if (!force && (!this._dirty || Date.now() - this._last < TODO_MIN_INTERVAL)) return;
    this._inflight = true; this._dirty = false; this._last = Date.now();
    Promise.resolve().then(() => this._hass.callWS({ type: "call_service", domain: "todo", service: "get_items", target: { entity_id: this._cfg.entity }, service_data: { status: ["needs_action", "completed"] }, return_response: true }))
      .then((r) => { this._items = todoItems(r, this._cfg.entity); this._error = false; })
      .catch(() => { this._error = true; })
      .finally(() => { this._inflight = false; super._draw(); });
  }
  get css() { return `
    .add { display:flex; gap:8px; margin-bottom:10px; } .add input { flex:1; min-width:0; font:inherit; color:var(--sf-strong); background:rgb(var(--sf-cyan-rgb) / .07); border:1px solid rgb(var(--sf-cyan-rgb) / .3); border-radius:8px; padding:7px 10px; }
    .it { display:flex; align-items:center; gap:10px; padding:7px 4px; border-top:1px solid rgb(var(--sf-cyan-rgb) / .12); } .it:first-of-type { border-top:0; }
    .bx { width:20px; height:20px; flex:none; border-radius:6px; border:2px solid var(--sf-cyan); display:grid; place-items:center; background:none; padding:0; min-height:0; }
    .it.d .bx { background:var(--sf-green); border-color:var(--sf-green); color:var(--sf-on-accent); } .it.d .tx { text-decoration:line-through; color:var(--sf-dim); }
    .tx { flex:1; min-width:0; overflow-wrap:anywhere; color:var(--sf-strong); } .due { color:var(--sf-amber); font-size:11px; }
    .sec { margin:12px 0 4px; display:flex; justify-content:space-between; align-items:center; font-family:Orbitron, ui-sans-serif, sans-serif; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sf-dim); }
    .sec button { font-size:10px; padding:2px 8px; }`; }
  body() {
    const L = this._lang(), t = (k, v) => sfT(TODO_I18N, L, k, v);
    if (!this._st()) return `<div class="err">${sfEsc(t("missing", { id: this._cfg.entity }))}</div>`;
    const todo = this._items.filter((i) => !i.done), done = this._items.filter((i) => i.done);
    const item = (i) => `<div class="it ${i.done ? "d" : ""}"><button class="bx" data-act="tgl" data-u="${sfEsc(i.uid)}" data-d="${i.done ? 1 : 0}" role="checkbox" aria-checked="${i.done}" aria-label="${sfEsc(i.summary)}">${i.done ? "✓" : ""}</button><span class="tx">${sfEsc(i.summary)}</span>${i.due ? `<span class="due">${sfEsc(String(i.due).slice(0, 10))}</span>` : ""}</div>`;
    let h = `<form class="add" data-form="1"><input id="ni" type="text" maxlength="255" placeholder="${sfEsc(t("add"))}" aria-label="${sfEsc(t("add"))}" autocomplete="off"><button type="submit">${sfEsc(t("addBtn"))}</button></form>`;
    if (this._error) h += `<div class="err">${sfEsc(t("err"))}</div>`;
    h += todo.length ? todo.map(item).join("") : (this._error ? "" : `<div class="empty">${sfEsc(t("empty"))}</div>`);
    if (done.length) {
      h += `<div class="sec"><span data-act="showdone" role="button" tabindex="0">${this._showDone ? "▾" : "▸"} ${sfEsc(t("done"))} (${done.length})</span>${this._showDone ? `<button data-act="clear">${sfEsc(t("clear"))}</button>` : ""}</div>`;
      if (this._showDone) h += done.map(item).join("");
    }
    return h;
  }
  connectedCallback() {
    super.connectedCallback();
    if (this._bound) return; this._bound = true;
    this.shadowRoot.addEventListener("submit", (e) => {
      e.preventDefault(); const inp = this.shadowRoot.getElementById("ni"), v = inp && inp.value.trim(); if (!v) return;
      inp.value = ""; this._svc("add_item", { item: v });
    });
  }
  _svc(service, data) {
    if (!this._hass) return Promise.resolve();
    return Promise.resolve(this._hass.callService("todo", service, { entity_id: this._cfg.entity, ...data })).catch(() => { this._error = true; }).finally(() => { this._dirty = true; this._last = 0; this._fetch(true); });
  }
  onAct(el) {
    const a = el.dataset.act;
    if (a === "tgl") { const it = this._items.find((i) => String(i.uid) === el.dataset.u); if (it) { it.done = !it.done; super._draw(); this._svc("update_item", { item: it.uid, status: it.done ? "completed" : "needs_action" }); } }
    else if (a === "showdone") { this._showDone = !this._showDone; super._draw(); }
    else if (a === "clear") this._svc("remove_completed_items", {});
  }
}
sfRegister("sf-todo-card", SFTodoCard, "SF To-do", "To-do / shopping list card: add, check off and clear items.");
window.__sfControls = { i18n: { fan: FAN_I18N, bar: BAR_I18N, todo: TODO_I18N }, fanPeriod, barColor, barFraction, todoItems };   // exposed for the test page only

})();
