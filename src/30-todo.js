// ---- sf-todo-card ---------------------------------------------------------------------------------------------------------------------------
const TODO_I18N = {
  en: { title: "To-do", add: "Add an item…", addBtn: "Add", done: "Completed", clear: "Clear completed", empty: "Nothing to do", err: "Could not read the list", missing: "Entity not found: {id}" },
  fr: { title: "À faire", add: "Ajouter un élément…", addBtn: "Ajouter", done: "Terminés", clear: "Effacer les terminés", empty: "Rien à faire", err: "Liste illisible", missing: "Entité introuvable : {id}" },
  de: { title: "Aufgaben", add: "Eintrag hinzufügen…", addBtn: "Hinzufügen", done: "Erledigt", clear: "Erledigte löschen", empty: "Nichts zu tun", err: "Liste nicht lesbar", missing: "Entität nicht gefunden: {id}" },
  es: { title: "Tareas", add: "Añadir elemento…", addBtn: "Añadir", done: "Completadas", clear: "Borrar completadas", empty: "Nada que hacer", err: "No se puede leer la lista", missing: "Entidad no encontrada: {id}" },
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
  title() { return this._cfg.title || (this._st() && this._st().attributes.friendly_name) || sfT(TODO_I18N, sfLang(this._hass), "title"); }
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
    const L = sfLang(this._hass), t = (k, v) => sfT(TODO_I18N, L, k, v);
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
window.__sfControls = { fanPeriod, barColor, barFraction, todoItems };   // exposed for the test page only
