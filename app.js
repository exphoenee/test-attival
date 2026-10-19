const STORAGE_KEY = 'munkaora-v1';

// state: { projects: [{id, name, color}], entries: { 'YYYY-MM-DD': [{id, projectId, hours}] } }
let state = load();
const todayKey = toKey(new Date());
let selected = todayKey;
let view = 'month'; // month | week | day

function addDays(key, n) { const d = fromKey(key); return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
function addMonths(key, n) {
  const d = fromKey(key);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return toKey(new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last)));
}
function weekStart(key) { return addDays(key, -((fromKey(key).getDay() + 6) % 7)); }

const $ = id => document.getElementById(id);

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && Array.isArray(s.projects) && s.entries) return s;
  } catch (e) {}
  return { projects: [], entries: {} };
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function pad(n) { return String(n).padStart(2, '0'); }
function toKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function fmt(h) { return (Math.round(h * 100) / 100).toString().replace('.', ',') + ' ó'; }
function project(id) { return state.projects.find(p => p.id === id); }
function dayTotal(key) { return (state.entries[key] || []).reduce((s, e) => s + e.hours, 0); }

function el(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  n.append(...children);
  return n;
}

// ---------- Projects ----------
$('project-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('project-name').value.trim();
  if (!name) return;
  state.projects.push({ id: uid(), name, color: $('project-color').value });
  $('project-name').value = '';
  save();
  render();
});

function deleteProject(id) {
  const p = project(id);
  if (!confirm(`Törlöd a(z) "${p.name}" projektet és az összes hozzá tartozó bejegyzést?`)) return;
  state.projects = state.projects.filter(x => x.id !== id);
  for (const k of Object.keys(state.entries)) {
    state.entries[k] = state.entries[k].filter(e => e.projectId !== id);
    if (!state.entries[k].length) delete state.entries[k];
  }
  save();
  render();
}

function renderProjects() {
  const list = $('project-list');
  list.replaceChildren(...state.projects.map(p =>
    el('li', {},
      el('span', { className: 'dot', style: `background:${p.color}` }),
      el('span', { className: 'name', textContent: p.name }),
      el('button', { className: 'icon', title: 'Törlés', textContent: '✕', onclick: () => deleteProject(p.id) })
    )));
  $('project-empty').hidden = state.projects.length > 0;
}

// ---------- Month summary ----------
function renderSummary() {
  const prefix = selected.slice(0, 8);
  const per = {};
  let total = 0;
  for (const [k, list] of Object.entries(state.entries)) {
    if (!k.startsWith(prefix)) continue;
    for (const e of list) { per[e.projectId] = (per[e.projectId] || 0) + e.hours; total += e.hours; }
  }
  $('month-summary').replaceChildren(...state.projects.filter(p => per[p.id]).map(p =>
    el('li', {},
      el('span', { className: 'dot', style: `background:${p.color}` }),
      el('span', { className: 'name', textContent: p.name }),
      el('span', { className: 'hours', textContent: fmt(per[p.id]) }))));
  $('month-total').textContent = `Hónap összesen: ${fmt(total)}`;
}

// ---------- Calendar ----------
function dotsFor(entries) {
  return el('div', { className: 'bars' },
    ...[...new Set(entries.map(e => e.projectId))].map(id =>
      el('i', { style: `background:${project(id)?.color || '#999'}` })));
}

function renderCalendar() {
  const sel = fromKey(selected);
  const cal = $('calendar');
  document.querySelectorAll('#view-tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  if (view === 'month') {
    $('month-label').textContent = sel.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
    const grid = el('div', { className: 'cal' },
      ...['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => el('div', { className: 'dow', textContent: d })));
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // hétfő = 0
    const weeks = Math.ceil((offset + new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate()) / 7);
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), 1 - offset + i);
      const key = toKey(d);
      const total = dayTotal(key);
      const cls = ['day'];
      if (d.getMonth() !== sel.getMonth()) cls.push('other');
      if (key === todayKey) cls.push('today');
      if (key === selected) cls.push('selected');
      grid.append(el('button', { type: 'button', className: cls.join(' '), onclick: () => selectDay(key) },
        el('span', { className: 'num', textContent: d.getDate() }),
        dotsFor(state.entries[key] || []),
        el('span', { className: 'sum', textContent: total ? fmt(total) : '' })));
    }
    cal.replaceChildren(grid);
  } else if (view === 'week') {
    const start = weekStart(selected), end = addDays(start, 6);
    const f = k => fromKey(k).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
    $('month-label').textContent = `${f(start)} – ${f(end)}`;
    const grid = el('div', { className: 'week' });
    for (let i = 0; i < 7; i++) {
      const key = addDays(start, i);
      const cls = ['day'];
      if (key === todayKey) cls.push('today');
      if (key === selected) cls.push('selected');
      const total = dayTotal(key);
      grid.append(el('button', { type: 'button', className: cls.join(' '), onclick: () => selectDay(key) },
        el('span', { className: 'head', textContent: fromKey(key).toLocaleDateString('hu-HU', { weekday: 'short', day: 'numeric' }) }),
        ...(state.entries[key] || []).map(en => {
          const p = project(en.projectId);
          return el('span', { className: 'chip' },
            el('i', { className: 'dot', style: `background:${p?.color || '#999'}` }),
            el('span', { textContent: p?.name || '(törölt)' }),
            el('span', { textContent: fmt(en.hours) }));
        }),
        el('span', { className: 'sum', textContent: total ? fmt(total) : '' })));
    }
    cal.replaceChildren(grid);
  } else {
    $('month-label').textContent = sel.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const entries = state.entries[selected] || [];
    const max = Math.max(1, ...entries.map(e => e.hours));
    const wrap = el('div', { className: 'dayview' });
    if (!entries.length) wrap.append(el('p', { className: 'empty', textContent: 'Erre a napra még nincs bejegyzés.' }));
    entries.forEach(en => wrap.append(barRow(project(en.projectId), en.hours, max)));
    wrap.append(el('p', { className: 'total', textContent: `Nap összesen: ${fmt(dayTotal(selected))}` }));
    cal.replaceChildren(wrap);
  }
}

function selectDay(key) {
  selected = key;
  render();
}

function shift(dir) {
  selected = view === 'month' ? addMonths(selected, dir)
    : view === 'week' ? addDays(selected, 7 * dir)
    : addDays(selected, dir);
  render();
}
$('prev').onclick = () => shift(-1);
$('next').onclick = () => shift(1);
$('today').onclick = () => selectDay(todayKey);
$('view-tabs').addEventListener('click', e => {
  if (e.target.dataset.view) { view = e.target.dataset.view; render(); }
});

// ---------- Chart ----------
function barRow(p, hours, max) {
  return el('div', { className: 'bar-row' },
    el('span', { className: 'label', textContent: p?.name || '(törölt projekt)' }),
    el('div', { className: 'track' },
      el('div', { className: 'fill', style: `width:${(hours / max) * 100}%;background:${p?.color || '#999'}` })),
    el('span', { className: 'val', textContent: fmt(hours) }));
}

function renderChart() {
  const range = $('chart-range').value;
  const inRange = {
    month: k => k.startsWith(selected.slice(0, 8)),
    year: k => k.startsWith(selected.slice(0, 5)),
    week: k => k >= weekStart(selected) && k <= addDays(weekStart(selected), 6),
    all: () => true,
  }[range];

  const per = {};
  for (const [k, list] of Object.entries(state.entries)) {
    if (!inRange(k)) continue;
    for (const e of list) per[e.projectId] = (per[e.projectId] || 0) + e.hours;
  }
  const rows = Object.entries(per).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  $('chart').replaceChildren(...rows.map(([id, h]) => barRow(project(id), h, max)));
  $('chart-empty').hidden = rows.length > 0;
}
$('chart-range').onchange = renderChart;

// ---------- Day panel ----------
$('entry-form').addEventListener('submit', e => {
  e.preventDefault();
  const projectId = $('entry-project').value;
  const hours = parseFloat($('entry-hours').value);
  if (!projectId || !(hours > 0)) return;
  const list = state.entries[selected] || (state.entries[selected] = []);
  const existing = list.find(x => x.projectId === projectId);
  if (existing) existing.hours += hours;
  else list.push({ id: uid(), projectId, hours });
  $('entry-hours').value = '';
  save();
  render();
});

function editEntry(entry) {
  const v = prompt('Új óraszám:', String(entry.hours).replace('.', ','));
  if (v === null) return;
  const h = parseFloat(v.replace(',', '.'));
  if (!(h > 0 && h <= 24)) return;
  entry.hours = h;
  save();
  render();
}

function deleteEntry(id) {
  state.entries[selected] = state.entries[selected].filter(e => e.id !== id);
  if (!state.entries[selected].length) delete state.entries[selected];
  save();
  render();
}

function renderDay() {
  const d = fromKey(selected);
  const label = d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  $('day-label').textContent = selected === todayKey ? `Ma – ${label}` : label;

  const sel = $('entry-project');
  const prev = sel.value;
  sel.replaceChildren(...state.projects.map(p => el('option', { value: p.id, textContent: p.name })));
  if (project(prev)) sel.value = prev;
  const noProjects = state.projects.length === 0;
  sel.disabled = $('entry-hours').disabled = $('entry-form').querySelector('button').disabled = noProjects;
  if (noProjects) sel.append(el('option', { textContent: 'Előbb vegyél fel projektet' }));

  const entries = state.entries[selected] || [];
  $('entry-list').replaceChildren(...entries.map(en => {
    const p = project(en.projectId);
    return el('li', {},
      el('span', { className: 'dot', style: `background:${p?.color || '#999'}` }),
      el('span', { className: 'name', textContent: p?.name || '(törölt projekt)' }),
      el('span', { className: 'hours', textContent: fmt(en.hours) }),
      el('button', { className: 'icon', title: 'Szerkesztés', textContent: '✎', onclick: () => editEntry(en) }),
      el('button', { className: 'icon', title: 'Törlés', textContent: '✕', onclick: () => deleteEntry(en.id) }));
  }));
  $('entry-empty').hidden = entries.length > 0;
  $('day-total').textContent = entries.length ? `Nap összesen: ${fmt(dayTotal(selected))}` : '';
}

function render() {
  renderProjects();
  renderCalendar();
  renderSummary();
  renderChart();
  renderDay();
}

render();
