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
