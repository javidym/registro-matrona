/* Registro diario · Vanesa Ballester, Matrona Integrativa
   App estática: todo se guarda en localStorage de este dispositivo. */
'use strict';

const PREFIX = 'vb-registro:';
const PERFILES = [
  { id: 'javier', nombre: 'Javier Alcaraz' },
  { id: 'noelia', nombre: 'Noelia Herreros' },
];
const SETTINGS = 'vb-ajustes';
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COMIDAS = [
  ['desayuno', 'Desayuno'],
  ['mediamanana', 'Media mañana'],
  ['comida', 'Comida'],
  ['merienda', 'Merienda'],
  ['cena', 'Cena'],
];
const COLS = [
  { k: 'alimentos', label: 'Alimentos y bebidas', type: 'textarea', split: true,
    ask: '¿Qué comiste y bebiste?' },
  { k: 'cantidad', label: 'Cantidad aprox.', ask: '¿Qué cantidad aproximada?',
    defaults: ['Poca', 'Normal', 'Abundante', '1 plato', '1 pieza'] },
  { k: 'preparacion', label: 'Forma de preparación', ask: '¿Cómo estaba preparado?',
    defaults: ['Crudo', 'A la plancha', 'Al horno', 'Hervido', 'Al vapor', 'Guisado', 'Frito'] },
  { k: 'picoteo', label: '¿Hubo picoteo?', ask: '¿Hubo picoteo?', defaults: ['No', 'Sí'] },
  { k: 'sento', label: '¿Cómo te sentó?', ask: '¿Cómo te sentó?',
    defaults: ['Bien', 'Muy bien', 'Pesadez', 'Hinchazón', 'Gases', 'Acidez'] },
];

const SEC = {
  dia: 'Día y fecha',
  alim: 'Alimentación y digestión',
  act: 'Actividad física y movimiento',
  desc: 'Descanso y estado nervioso',
  obs: 'Señales del cuerpo y observaciones',
  ciclo: 'Ciclo menstrual',
};

/* ---------- Definición de campos (orden = orden del asistente) ---------- */
const FIELDS = [
  { id: 'dia', sec: 'dia', label: 'Día', ask: '¿Qué día es?', hint: 'Día de la semana o nº de día del registro.' },
  // Solo para Noelia, a partir del 16/10/2026
  { id: 'ciclo', sec: 'ciclo', label: 'Día del ciclo', ask: '¿En qué día del ciclo estás?', type: 'ciclo',
    perfil: 'noelia', desde: '2026-10-16',
    hint: 'Toca en el calendario el día en que empezó tu regla (o todos los días de regla) y se calcula solo. También puedes escribirlo.' },
];
for (const [mk, mname] of COMIDAS) {
  for (const c of COLS) {
    FIELDS.push({
      id: `${mk}.${c.k}`, sec: 'alim', sub: mname, label: c.label,
      ask: `${mname}: ${c.ask}`,
      type: c.type, split: c.split, defaults: c.defaults,
    });
  }
}
FIELDS.push(
  { id: 'agua', sec: 'alim', label: 'Agua total del día', ask: '¿Cuánta agua has bebido en total?',
    type: 'agua' },
  { id: 'cafeina', sec: 'alim', label: 'Cafeína (café, té, refrescos)', ask: '¿Has tomado cafeína (café, té, refrescos)?',
    type: 'choice', options: ['Sí', 'No'] },
  { id: 'cafeinaCantidad', sec: 'alim', label: 'Cantidad de cafeína', ask: '¿Qué cantidad de cafeína?',
    defaults: ['1 café', '2 cafés', '1 té', '1 refresco'] },

  { id: 'actividad.tipo', sec: 'act', label: 'Tipo de actividad', ask: '¿Qué actividad física hiciste?',
    defaults: ['Caminar', 'Yoga', 'Pilates', 'Natación', 'Bicicleta', 'Ninguna'] },
  { id: 'actividad.duracion', sec: 'act', label: 'Duración', ask: '¿Cuánto duró?',
    defaults: ['15 min', '30 min', '45 min', '1 h'] },
  { id: 'actividad.intensidad', sec: 'act', label: 'Intensidad', ask: '¿Con qué intensidad?',
    type: 'choice', options: ['Baja', 'Media', 'Alta'] },
  { id: 'actividad.sensacion', sec: 'act', label: 'Sensación corporal posterior', ask: '¿Cómo sentiste el cuerpo después?',
    defaults: ['Bien', 'Con energía', 'Relajada', 'Cansada', 'Con molestias'] },

  { id: 'sueno.horas', sec: 'desc', label: 'Horas de sueño', ask: '¿Cuántas horas dormiste?', type: 'number', step: 0.5 },
  { id: 'sueno.calidad', sec: 'desc', label: 'Calidad del sueño', ask: '¿Qué tal dormiste?',
    type: 'choice', options: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Muy buena'] },
  { id: 'estres', sec: 'desc', label: 'Nivel de estrés (0–10)', ask: '¿Cuál ha sido tu nivel de estrés hoy? (0–10)',
    type: 'scale' },

  { id: 'observaciones', sec: 'obs', label: 'Señales del cuerpo y observaciones', type: 'textarea', split: true, rows: 7,
    ask: '¿Qué señales has notado en tu cuerpo hoy?',
    hint: 'Energía, estado de ánimo, dolor pélvico, molestias digestivas, hinchazón, flujo cervical, antojos, etc.',
    prefixes: ['Energía', 'Estado de ánimo', 'Dolor pélvico', 'Molestias digestivas', 'Hinchazón', 'Flujo cervical', 'Antojos'] },
);

/* ---------- Utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtFecha = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
function load(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function allDays() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(pre())) out.push(k.slice(pre().length));
    }
  } catch { /* sin almacenamiento */ }
  return out.sort();
}

/* ---------- Estado ---------- */
let fecha = iso(new Date());
let data = {};
let step = 0;
let mode = load(SETTINGS, {}).mode || 'wizard';
let settings = Object.assign({ watermark: true }, load(SETTINGS, {}));
let perfil = PERFILES.some((p) => p.id === settings.perfil) ? settings.perfil : PERFILES[0].id;
const pre = () => PREFIX + perfil + ':';
const nombrePerfil = () => PERFILES.find((p) => p.id === perfil).nombre;

// Días guardados antes de existir los perfiles: pasan al primer perfil
try {
  Object.keys(localStorage).filter((k) => /^vb-registro:\d{4}-/.test(k)).forEach((k) => {
    const nk = PREFIX + PERFILES[0].id + ':' + k.slice(PREFIX.length);
    if (!localStorage.getItem(nk)) localStorage.setItem(nk, localStorage.getItem(k));
    localStorage.removeItem(k);
  });
} catch { /* sin almacenamiento */ }
let dirty = false;
let saveTimer = null;
let suggestCache = null;

/* ---------- Construcción del formulario ---------- */
const form = $('#form');

function inputHtml(f) {
  const name = `name="${f.id}" id="f-${f.id}"`;
  switch (f.type) {
    case 'textarea':
      return `<textarea ${name} rows="${f.rows || 3}"></textarea>`;
    case 'number':
      return `<input type="number" inputmode="decimal" min="0" step="${f.step || 1}" ${name}>`;
    case 'agua':
      return `<div class="inline"><input type="number" inputmode="decimal" min="0" step="0.5" ${name}>
        <select name="aguaUnidad" id="f-aguaUnidad" aria-label="Unidad"><option>vasos</option><option>litros</option></select></div>`;
    case 'choice':
      return `<div class="choices">${f.options.map((o) =>
        `<label><input type="radio" name="${f.id}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div>`;
    case 'ciclo':
      return `<input type="number" inputmode="numeric" min="1" max="99" ${name}><div class="cal" data-cal></div>`;
    case 'scale':
      return `<div class="choices scale">${Array.from({ length: 11 }, (_, i) =>
        `<label><input type="radio" name="${f.id}" value="${i}"><span>${i}</span></label>`).join('')}</div>`;
    default:
      return `<input type="text" ${name} enterkeyhint="next">`;
  }
}

function buildForm() {
  let html = '';
  let lastSec = null, lastSub = null;
  FIELDS.forEach((f, i) => {
    if (f.sec !== lastSec) {
      if (lastSec) html += '</section>';
      html += `<section class="sec sec-${f.sec}"><h2>${SEC[f.sec]}</h2>`;
      lastSec = f.sec; lastSub = null;
    }
    if (f.sub && f.sub !== lastSub) { html += `<h3 class="sub">${f.sub}</h3>`; lastSub = f.sub; }
    html += `<div class="q" data-i="${i}" data-id="${f.id}">
      <div class="ctx">${SEC[f.sec]}${f.sub ? ' · ' + f.sub : ''}</div>
      <label class="ask" for="f-${f.id}"><span class="long">${esc(f.ask)}</span><span class="short">${esc(f.label)}</span></label>
      ${f.hint ? `<p class="hint">${esc(f.hint)}</p>` : ''}
      ${inputHtml(f)}
      <div class="chips" data-for="${f.id}"></div>
    </div>`;
  });
  html += '</section>';
  form.innerHTML = html;
}

/* ---------- Lectura / escritura de valores ---------- */
function getVal(id) {
  const els = form.elements[id];
  if (!els) return '';
  if (els instanceof RadioNodeList) return els.value || '';
  return els.value;
}
function setVal(id, v) {
  const els = form.elements[id];
  if (!els) return;
  if (els instanceof RadioNodeList) {
    [...els].forEach((r) => { r.checked = r.value === String(v ?? ''); });
  } else els.value = v ?? '';
}
function readForm() {
  const d = { fecha };
  for (const f of FIELDS) d[f.id] = getVal(f.id).trim();
  d.aguaUnidad = getVal('aguaUnidad') || 'vasos';
  return d;
}
function fillForm(d) {
  for (const f of FIELDS) setVal(f.id, d[f.id]);
  setVal('aguaUnidad', d.aguaUnidad || 'vasos');
  autosize();
}

/* ---------- Guardado ---------- */
function isEmpty(d) { return FIELDS.every((f) => !d[f.id] || (f.id === 'dia' && d[f.id] === DIAS[parseIso(fecha).getDay()])); }

function save(manual) {
  clearTimeout(saveTimer);
  data = readForm();
  const key = pre() + fecha;
  if (isEmpty(data) && !manual) { try { localStorage.removeItem(key); } catch { /* */ } }
  else { data.actualizado = new Date().toISOString(); if (!store(key, data)) { setState('⚠ No se pudo guardar', true); return; } }
  dirty = false; suggestCache = null;
  renderChips();
  const t = new Date();
  setState(`Guardado ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
  if (manual) toast('Guardado ✓');
}
function setState(txt, warn) { const s = $('#saveState'); s.textContent = txt; s.classList.toggle('warn', !!warn); }

form.addEventListener('input', (e) => {
  dirty = true; setState('Guardando…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(false), 600);
  if (e.target.tagName === 'TEXTAREA') autosize(e.target);
  if (e.target.type === 'radio' && mode === 'wizard' && e.target.closest('.q')?.dataset.i == step) {
    setTimeout(() => go(step + 1), 280);
  }
});
window.addEventListener('pagehide', () => { if (dirty) save(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) save(false); });

/* ---------- Cambiar de día ---------- */
function openDay(f) {
  if (dirty) save(false);
  fecha = f;
  $('#fecha').value = fecha;
  data = load(pre() + fecha, null) || { dia: DIAS[parseIso(fecha).getDay()] };
  fillForm(data);
  aplicarActivos();
  calMes = fecha.slice(0, 7);
  if (cicloActivo() && !data.ciclo) { const c = diaCiclo(fecha); if (c) setVal('ciclo', c.dia); }
  renderCal();
  suggestCache = null;
  renderChips();
  const act = activos();
  const firstEmpty = act.find((i) => !data[FIELDS[i].id]);
  step = firstEmpty ?? act[act.length - 1];
  showStep(false);
  setState(data.actualizado ? 'Guardado' : 'Nuevo día');
}
$('#fecha').addEventListener('change', (e) => { if (e.target.value) openDay(e.target.value); });
$('#prevDay').onclick = () => { const d = parseIso(fecha); d.setDate(d.getDate() - 1); openDay(iso(d)); };
$('#nextDay').onclick = () => { const d = parseIso(fecha); d.setDate(d.getDate() + 1); openDay(iso(d)); };

/* ---------- Sugerencias a partir de días anteriores (y de hoy) ---------- */
// Las columnas de comidas comparten sugerencias (lo escrito en la comida sirve para la cena)
function grupo(id) {
  const m = id.match(/^(desayuno|mediamanana|comida|merienda|cena)\.(.+)$/);
  return m ? 'col:' + m[2] : id;
}
function buildSuggest() {
  const days = allDays();
  if (!days.includes(fecha)) days.push(fecha);
  days.sort();
  const fuentes = {};
  days.forEach((day, idx) => {
    const d = day === fecha ? readForm() : load(pre() + day, {});
    const r = (idx + 1) / days.length; // más reciente = más peso
    for (const f of FIELDS) {
      if (['choice', 'scale', 'number', 'agua', 'ciclo'].includes(f.type) || f.id === 'dia') continue;
      const v = d[f.id]; if (!v) continue;
      const items = f.split ? v.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [v.trim()];
      for (const it of items) {
        if (it.length > 60) continue;
        (fuentes[grupo(f.id)] ||= []).push({ id: f.id, text: it, k: it.toLowerCase(), r, hoy: day === fecha });
      }
    }
  });
  const out = {};
  for (const f of FIELDS) {
    const src = fuentes[grupo(f.id)]; if (!src) continue;
    const sc = {};
    for (const s of src) {
      if (s.hoy && s.id === f.id) continue; // lo que ya está escrito hoy en este campo
      const e = (sc[s.k] ||= { text: s.text, p: 0 });
      e.p += (s.id === f.id ? 2 : 1) * (1 + s.r);
    }
    out[f.id] = Object.values(sc).sort((a, b) => b.p - a.p).map((e) => e.text);
  }
  return out;
}

function renderChips(onlyId) {
  if (!suggestCache) suggestCache = buildSuggest();
  for (const f of FIELDS) {
    if (onlyId && f.id !== onlyId) continue;
    const box = form.querySelector(`.chips[data-for="${CSS.escape(f.id)}"]`);
    if (!box) continue;
    // no sugerir lo que ya está escrito en el campo
    const cur = getVal(f.id).toLowerCase();
    const ya = new Set(f.split ? cur.split(/[,;\n]+/).map((s) => s.trim()) : [cur.trim()]);
    let html = '';
    if (f.prefixes) html += f.prefixes.map((p) => `<button type="button" class="chip pre" data-pre="${esc(p)}">+ ${esc(p)}</button>`).join('');
    const prev = (suggestCache[f.id] || []).filter((s) => !ya.has(s.toLowerCase())).slice(0, 10);
    const seen = new Set(prev.map((s) => s.toLowerCase()));
    const list = prev.concat((f.defaults || []).filter((d) => !seen.has(d.toLowerCase()) && !ya.has(d.toLowerCase()))).slice(0, 12);
    html += list.map((s, i) => `<button type="button" class="chip${i < prev.length ? ' hist' : ''}" data-v="${esc(s)}">${esc(s)}</button>`).join('');
    box.innerHTML = html;
  }
}

form.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const id = chip.parentElement.dataset.for;
  const f = FIELDS.find((x) => x.id === id);
  const el = form.elements[id];
  let cur = el.value;
  if (chip.dataset.pre) {
    el.value = (cur && !cur.endsWith('\n') ? cur + '\n' : cur) + chip.dataset.pre + ': ';
  } else if (f.split || f.type === 'textarea') {
    el.value = cur.trim() ? cur.replace(/[\s,]+$/, '') + ', ' + chip.dataset.v : chip.dataset.v;
  } else {
    el.value = chip.dataset.v;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
  const n = el.value.length; try { el.setSelectionRange(n, n); } catch { /* */ }
});

/* ---------- Perfil ---------- */
const selPerfil = $('#perfil');
selPerfil.innerHTML = PERFILES.map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
selPerfil.value = perfil;
selPerfil.onchange = () => {
  if (dirty) save(false);
  perfil = selPerfil.value;
  settings.perfil = perfil; store(SETTINGS, settings);
  openDay(fecha);
  toast(`Perfil: ${nombrePerfil()}`);
};

/* ---------- Preguntas que solo aplican a un perfil o desde una fecha ---------- */
const activo = (f) => (!f.perfil || f.perfil === perfil) && (!f.desde || fecha >= f.desde);
const activos = () => FIELDS.map((f, i) => i).filter((i) => activo(FIELDS[i]));
const cicloActivo = () => activo(FIELDS.find((f) => f.id === 'ciclo'));
function aplicarActivos() {
  $$('.q', form).forEach((q) => q.classList.toggle('off', !activo(FIELDS[+q.dataset.i])));
  $$('.sec', form).forEach((s) => s.classList.toggle('off', !$('.q:not(.off)', s)));
}

/* ---------- Ciclo menstrual ---------- */
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
let calMes = fecha.slice(0, 7);
const cicloKey = () => 'vb-ciclo:' + perfil;
const diasRegla = () => new Set(load(cicloKey(), { regla: [] }).regla);
const sumaDias = (s, n) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };

// Día del ciclo = días desde el primer día de la última regla (día 1 = inicio de la regla)
function diaCiclo(f) {
  const regla = diasRegla();
  for (let s = f, n = 0; n < 120; n++, s = sumaDias(s, -1)) {
    if (!regla.has(s)) continue;
    let inicio = s;
    while (regla.has(sumaDias(inicio, -1))) inicio = sumaDias(inicio, -1);
    return { dia: Math.round((parseIso(f) - parseIso(inicio)) / 864e5) + 1, inicio };
  }
  return null;
}
// Semanas (lunes a domingo) de un mes 'AAAA-MM'; null = hueco
function semanasMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const primero = new Date(y, m - 1, 1), total = new Date(y, m, 0).getDate();
  const celdas = Array((primero.getDay() + 6) % 7).fill(null);
  for (let d = 1; d <= total; d++) celdas.push(`${mes}-${String(d).padStart(2, '0')}`);
  while (celdas.length % 7) celdas.push(null);
  const out = []; for (let i = 0; i < celdas.length; i += 7) out.push(celdas.slice(i, i + 7));
  return out;
}
const tituloMes = (mes) => `${MESES[+mes.slice(5, 7) - 1]} ${mes.slice(0, 4)}`;

function calHtml(mes, interactivo) {
  const regla = diasRegla();
  const filas = semanasMes(mes).map((sem) => `<tr>${sem.map((s) => {
    if (!s) return '<td></td>';
    const cls = [regla.has(s) && 'regla', s === fecha && 'hoy'].filter(Boolean).join(' ');
    const n = +s.slice(8);
    return interactivo
      ? `<td><button type="button" data-d="${s}" class="${cls}" aria-pressed="${regla.has(s)}">${n}</button></td>`
      : `<td class="${cls}">${n}</td>`;
  }).join('')}</tr>`).join('');
  return `<table class="caltab"><thead><tr>${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<th>${d}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table>`;
}
function renderCal() {
  const box = $('[data-cal]', form);
  if (!box) return;
  box.innerHTML = `
    <div class="calhead">
      <button type="button" class="icon" data-mes="-1" aria-label="Mes anterior">‹</button>
      <strong>${tituloMes(calMes)}</strong>
      <button type="button" class="icon" data-mes="1" aria-label="Mes siguiente">›</button>
    </div>
    ${calHtml(calMes, true)}
    <p class="calley"><span class="sw regla"></span> Regla <span class="sw hoy"></span> Día del registro</p>`;
}
form.addEventListener('click', (e) => {
  const mesBtn = e.target.closest('[data-mes]');
  if (mesBtn) {
    const [y, m] = calMes.split('-').map(Number);
    calMes = iso(new Date(y, m - 1 + +mesBtn.dataset.mes, 1)).slice(0, 7);
    renderCal(); return;
  }
  const diaBtn = e.target.closest('[data-d]');
  if (!diaBtn) return;
  const regla = diasRegla(), s = diaBtn.dataset.d;
  regla.has(s) ? regla.delete(s) : regla.add(s);
  store(cicloKey(), { regla: [...regla].sort() });
  const c = diaCiclo(fecha);
  const el = form.elements.ciclo;
  el.value = c ? c.dia : '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  renderCal();
});

/* ---------- Asistente paso a paso ---------- */
function showStep(focus = true) {
  const act = activos(), pos = act.indexOf(step);
  $$('.q', form).forEach((q) => q.classList.toggle('cur', +q.dataset.i === step));
  $('#stepInfo').textContent = `${pos + 1} / ${act.length}`;
  $('#back').disabled = pos <= 0;
  $('#next').textContent = pos === act.length - 1 ? 'Terminar ✓' : 'Siguiente ›';
  const done = act.filter((i) => getVal(FIELDS[i].id)).length;
  $('#progress > div').style.width = `${(mode === 'wizard' ? (pos + 1) / act.length : done / act.length) * 100}%`;
  if (mode === 'wizard' && focus) {
    const el = form.querySelector('.q.cur input:not([type=radio]), .q.cur textarea');
    if (el) setTimeout(() => el.focus({ preventScroll: true }), 50);
    window.scrollTo({ top: 0 });
  }
}
function go(i) {
  const dir = i >= step ? 1 : -1;
  while (i >= 0 && i < FIELDS.length && !activo(FIELDS[i])) i += dir; // salta preguntas que no tocan
  if (i >= FIELDS.length) { save(false); toast('¡Registro del día completo! Ya puedes generar el documento.'); return; }
  if (i < 0) return;
  step = i;
  showStep();
}
$('#next').onclick = () => go(step + 1);
$('#back').onclick = () => go(step - 1);
form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    e.preventDefault();
    if (mode === 'wizard') go(step + 1);
    else {
      const ins = $$('input:not([type=radio]), textarea', form);
      const n = ins[ins.indexOf(e.target) + 1]; if (n) n.focus();
    }
  }
});
form.addEventListener('submit', (e) => e.preventDefault());
// En modo "Todo junto", tocar una pregunta la marca como paso actual
form.addEventListener('focusin', (e) => { const q = e.target.closest('.q'); if (q && mode === 'form') step = +q.dataset.i; });

function setMode(m) {
  mode = m;
  form.className = m;
  $('#wizNav').hidden = m !== 'wizard';
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  settings.mode = m; store(SETTINGS, settings);
  showStep(false);
  autosize();
  if (m === 'form') { const q = form.querySelector(`.q[data-i="${step}"]`); if (q && step > 0) q.scrollIntoView({ block: 'center' }); }
}
$$('.tabs button').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

function autosize(el) {
  (el ? [el] : $$('textarea', form)).forEach((t) => {
    t.style.height = 'auto';
    if (t.scrollHeight) t.style.height = t.scrollHeight + 2 + 'px';
  });
}

/* ---------- Avisos ---------- */
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Opciones ---------- */
const dlg = $('#moreDlg');
$('#moreBtn').onclick = () => {
  $('#optWatermark').checked = settings.watermark;
  $('#daysCount').textContent = `Días guardados: ${allDays().length}`;
  dlg.showModal();
};
$('#closeMore').onclick = () => dlg.close();
$('#optWatermark').onchange = (e) => { settings.watermark = e.target.checked; store(SETTINGS, settings); };
$('#exportBtn').onclick = () => {
  if (dirty) save(false);
  const all = {};
  for (const d of allDays()) all[d] = load(pre() + d, {});
  const blob = new Blob([JSON.stringify({ app: 'registro-matrona', version: 2, perfil, nombre: nombrePerfil(), dias: all, ciclo: load(cicloKey(), null) }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `registro-${perfil}-copia-${iso(new Date())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#importFile').onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    const dias = j.dias || {};
    if (j.ciclo && Array.isArray(j.ciclo.regla)) store(cicloKey(), { regla: [...new Set([...diasRegla(), ...j.ciclo.regla])].sort() });
    let n = 0;
    for (const d in dias) if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { store(pre() + d, dias[d]); n++; }
    toast(`Restaurados ${n} días en ${nombrePerfil()}`);
    openDay(fecha);
  } catch { toast('El archivo no es una copia válida'); }
  e.target.value = '';
  dlg.close();
};
$('#clearDay').onclick = () => {
  if (!confirm(`¿Vaciar todos los datos del ${fmtFecha(fecha)}?`)) return;
  try { localStorage.removeItem(pre() + fecha); } catch { /* */ }
  dirty = false;
  openDay(fecha);
  dlg.close();
};
$('#copyLast').onclick = () => {
  const ant = allDays().filter((d) => d < fecha).pop();
  if (!ant) { toast('No hay días anteriores guardados'); return; }
  const d = load(pre() + ant, {});
  let n = 0;
  for (const f of FIELDS) {
    if (f.id === 'dia' || f.type === 'ciclo' || getVal(f.id) || !d[f.id]) continue;
    setVal(f.id, d[f.id]); n++;
  }
  if (!getVal('agua') && d.aguaUnidad) setVal('aguaUnidad', d.aguaUnidad);
  autosize();
  save(false);
  toast(n ? `Copiados ${n} campos del ${fmtFecha(ant)}` : 'No había campos vacíos que copiar');
  dlg.close();
};
$('#saveBtn').onclick = () => save(true);

/* ---------- Documento ---------- */
const WATERMARK = `
<svg class="wm" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="200" cy="165" r="118" fill="none" stroke="#e8c4c6" stroke-width="3"/>
  <circle cx="200" cy="165" r="104" fill="none" stroke="#e6d6c0" stroke-width="1.5"/>
  <path d="M120 230 C160 200 240 200 280 230" fill="none" stroke="#e6d6c0" stroke-width="2"/>
  <text x="200" y="200" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="120" fill="#ebc9cb" letter-spacing="-6">VB</text>
  <text x="200" y="322" text-anchor="middle" font-family="'Brush Script MT', 'Segoe Script', cursive" font-size="44" fill="#e3c9ad">Vanesa Ballester</text>
  <text x="200" y="362" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#ebc9cb" letter-spacing="10">MATRONA</text>
</svg>`;

function v(d, id) { return esc(d[id] || ''); }
function blank(txt, w) { return txt ? `<span class="fill">${txt}</span>` : `<span class="line" style="min-width:${w || 6}em"></span>`; }
function nl(txt) { return txt.replace(/\n/g, '<br>'); }

function renderDoc() {
  const d = readForm();
  const rows = COMIDAS.map(([mk, mname]) => `<tr><th>${mname}</th>${COLS.map((c) => `<td>${nl(v(d, `${mk}.${c.k}`))}</td>`).join('')}</tr>`).join('');
  const conCiclo = cicloActivo();
  const ciclo = conCiclo ? diaCiclo(fecha) : null;
  const caf = d.cafeina;
  const mark = (o) => `<span class="opt${caf === o ? ' sel' : ''}">${o}</span>`;
  $('#doc').innerHTML = `
    ${settings.watermark ? WATERMARK : ''}
    <div class="a4in">
    <header class="dh">
      <div class="dname">Vanesa Ballester</div>
      <div class="drole">Matrona Integrativa</div>
      <div class="dcol">Nº Colegiado 15 375</div>
    </header>
    <p class="dline"><b>Nombre:</b> <span class="fill">${esc(nombrePerfil())}</span></p>
    <p class="dline"><b>Día:</b> ${blank(v(d, 'dia'), 8)} &nbsp; | &nbsp; <b>Fecha:</b> ${fmtFecha(fecha)}${conCiclo ? ` &nbsp; | &nbsp; <b>Día del ciclo:</b> ${blank(v(d, 'ciclo'), 3)}` : ''}</p>

    <h2>Alimentación y digestión</h2>
    <table class="t5">
      <thead><tr><th></th>${COLS.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="dline"><b>Agua total del día:</b> ${d.agua ? `<span class="fill">${esc(d.agua)} ${esc(d.aguaUnidad)}</span>` : `${blank('', 4)} vasos / litros`}</p>
    <p class="dline"><b>Cafeína (café, té, refrescos):</b> ${mark('Sí')} / ${mark('No')} &nbsp; | &nbsp; <b>Cantidad:</b> ${blank(v(d, 'cafeinaCantidad'), 6)}</p>

    <h2>Actividad física y movimiento</h2>
    <table class="t4">
      <thead><tr><th>Tipo de actividad</th><th>Duración</th><th>Intensidad</th><th>Sensación corporal posterior</th></tr></thead>
      <tbody><tr><td>${v(d, 'actividad.tipo')}</td><td>${v(d, 'actividad.duracion')}</td><td>${v(d, 'actividad.intensidad')}</td><td>${v(d, 'actividad.sensacion')}</td></tr></tbody>
    </table>

    <h2>Descanso y estado nervioso</h2>
    <table class="t3">
      <thead><tr><th>Horas de sueño</th><th>Calidad del sueño</th><th>Nivel de estrés (0–10)</th></tr></thead>
      <tbody><tr><td>${v(d, 'sueno.horas')}</td><td>${v(d, 'sueno.calidad')}</td><td>${v(d, 'estres')}</td></tr></tbody>
    </table>
${conCiclo ? `
    <h2>Ciclo menstrual</h2>
    <div class="ciclo">
      <div>
        <p class="dline"><b>Día del ciclo:</b> ${blank(v(d, 'ciclo'), 3)}</p>
        <p class="dline"><b>Inicio de la última regla:</b> ${blank(ciclo ? fmtFecha(ciclo.inicio) : '', 6)}</p>
        <p class="calley"><span class="sw regla"></span> Regla &nbsp; <span class="sw hoy"></span> Día del registro</p>
      </div>
      <div class="calmini"><div class="calmes">${tituloMes(fecha.slice(0, 7))}</div>${calHtml(fecha.slice(0, 7), false)}</div>
    </div>` : ''}

    <h2>Señales del cuerpo y observaciones</h2>
    <p class="obshint">(Energía, estado de ánimo, dolor pélvico, molestias digestivas, hinchazón, flujo cervical, antojos, etc.)</p>
    <div class="obs">${nl(v(d, 'observaciones'))}</div>
    </div>`;
}

function showDoc(on) {
  if (on) { if (dirty) save(false); renderDoc(); }
  $('#app').hidden = on;
  $('#docView').hidden = !on;
  if (on) fitDoc();
  window.scrollTo({ top: 0 });
}
// La hoja mide siempre un A4: si el contenido no cabe, se encoge el contenido (nunca hay 2.ª página).
// Además, en pantallas estrechas la hoja entera se ve escalada para que quepa a lo ancho.
function fitDoc() {
  const el = $('#doc'), inner = $('.a4in', el);
  el.style.zoom = 1;
  const cs = getComputedStyle(el);
  const altoUtil = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const anchoUtil = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const cabe = (z) => {
    inner.style.zoom = z; inner.style.width = anchoUtil / z + 'px';
    return inner.getBoundingClientRect().height <= altoUtil; // tamaño ya encogido
  };
  if (!cabe(1)) { // búsqueda del mayor tamaño que cabe
    let lo = 0.3, hi = 1;
    for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; if (cabe(m)) lo = m; else hi = m; }
    cabe(lo);
  }
  el.style.zoom = Math.min(1, (document.documentElement.clientWidth - 8) / el.offsetWidth);
}
window.addEventListener('resize', () => { if (!$('#docView').hidden) fitDoc(); });
window.addEventListener('beforeprint', () => { if (!$('#docView').hidden) fitDoc(); });
$('#genBtn').onclick = () => showDoc(true);
$('#docBack').onclick = () => showDoc(false);
$('#printBtn').onclick = () => { document.title = `Registro ${nombrePerfil()} ${fmtFecha(fecha).replace(/\//g, '-')}`; window.print(); };
window.addEventListener('afterprint', () => { document.title = 'Registro diario · Vanesa Ballester'; });

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
$('#pdfBtn').onclick = async () => {
  const btn = $('#pdfBtn'); const old = btn.textContent;
  btn.disabled = true; btn.textContent = 'Generando…';
  try {
    if (!window.jspdf) await loadScript('lib/jspdf.umd.min.js');
    if (!window.jspdf.jsPDF.API.autoTable) await loadScript('lib/jspdf.plugin.autotable.min.js');
    if (!window.generarPdf) await loadScript('pdf.js');
    const c = cicloActivo() ? diaCiclo(fecha) : null;
    const doc = await generarPdf(readForm(), {
      nombre: nombrePerfil(), fecha: fmtFecha(fecha), marcaAgua: settings.watermark ? WATERMARK : null,
      ciclo: cicloActivo() ? {
        inicio: c ? fmtFecha(c.inicio) : '', titulo: tituloMes(fecha.slice(0, 7)), semanas: semanasMes(fecha.slice(0, 7)),
        regla: diasRegla(), hoy: fecha,
      } : null,
    });
    doc.save(`Registro-${nombrePerfil().replace(/ /g, '-')}-${fmtFecha(fecha).replace(/\//g, '-')}.pdf`);
  } catch (err) {
    console.error(err);
    toast('No se pudo crear el PDF. Prueba con "Imprimir / Guardar PDF".');
  }
  btn.disabled = false; btn.textContent = old;
};

/* ---------- Inicio ---------- */
buildForm();
setMode(mode);
openDay(fecha);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
