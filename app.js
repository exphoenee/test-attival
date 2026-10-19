const STORAGE_KEY = 'munkaora-v1';

// state: { projects: [{id, name, color}], entries: { 'YYYY-MM-DD': [{id, projectId, hours}] } }
let state = load();
const todayKey = toKey(new Date());
let selected = todayKey;
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

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
  const prefix = `${viewYear}-${pad(viewMonth + 1)}-`;
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
function renderCalendar() {
  const first = new Date(viewYear, viewMonth, 1);
  $('month-label').textContent = first.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });

  const cal = $('calendar');
  cal.replaceChildren(...['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map(d => el('div', { className: 'dow', textContent: d })));

  const offset = (first.getDay() + 6) % 7; // hétfő = 0
  const start = new Date(viewYear, viewMonth, 1 - offset);
  const weeks = Math.ceil((offset + new Date(viewYear, viewMonth + 1, 0).getDate()) / 7);

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toKey(d);
    const entries = state.entries[key] || [];
    const total = dayTotal(key);
    const cls = ['day'];
    if (d.getMonth() !== viewMonth) cls.push('other');
    if (key === todayKey) cls.push('today');
    if (key === selected) cls.push('selected');

    const bars = el('div', { className: 'bars' },
      ...[...new Set(entries.map(e => e.projectId))].map(id =>
        el('i', { style: `background:${project(id)?.color || '#999'}` })));

    cal.append(el('button', { type: 'button', className: cls.join(' '), onclick: () => selectDay(key) },
      el('span', { className: 'num', textContent: d.getDate() }),
      bars,
      el('span', { className: 'sum', textContent: total ? fmt(total) : '' })));
  }
}

function selectDay(key) {
  selected = key;
  const d = fromKey(key);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  render();
}

function shiftMonth(delta) {
  const d = new Date(viewYear, viewMonth + delta, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  render();
}
$('prev').onclick = () => shiftMonth(-1);
$('next').onclick = () => shiftMonth(1);
$('today').onclick = () => selectDay(todayKey);

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
  renderDay();
}

render();
