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
