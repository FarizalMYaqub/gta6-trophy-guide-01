// Leonida Legend: offline GTA 6 trophy guide and tracker.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and offers export / import of that progress. No network
// request is made at run time beyond the local data file.
const PROGRESS_KEY = 'gta6-trophy-guide-progress-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';
const listEl = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const statusEl = document.getElementById('statusFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const countEl = document.getElementById('countLine');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeStatsEl = document.getElementById('gradeStats');

const params = new URLSearchParams(location.search);
const demoIds = params.get('demo') === '1'
  ? [2, 3, 4, 5, 8, 15, 19, 21, 33, 35, 42, 52]
  : [];
let earned = new Set(demoIds);
try {
  const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
  if (Array.isArray(saved)) earned = new Set([...demoIds, ...saved]);
} catch (err) { /* corrupted save: start fresh */ }
let hideSpoilers = true;
try {
  const savedSpoiler = localStorage.getItem(SPOILER_KEY);
  if (savedSpoiler !== null) hideSpoilers = savedSpoiler === '1';
} catch (err) { /* private mode: keep default */ }
if (params.get('spoiler') === 'off') hideSpoilers = false;
if (params.get('spoiler') === 'on') hideSpoilers = true;
spoilerEl.checked = hideSpoilers;
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('q')) { searchEl.value = params.get('q'); }

let doc = null;
let openId = params.get('open') ? Number(params.get('open')) : null;

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned])); } catch (err) { /* storage full or blocked */ }
}

function saveSpoilerSetting() {
  try { localStorage.setItem(SPOILER_KEY, hideSpoilers ? '1' : '0'); } catch (err) { /* ignore */ }
}

function isSpoilerHidden(t) {
  return hideSpoilers && t.kind === 'story' && !earned.has(t.id);
}

function sourceLink(key) {
  const s = doc.sources[key];
  if (!s) return key;
  if (s.url) {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    return a;
  }
  return document.createTextNode(s.name);
}

function renderProgress() {
  const total = doc.trophies.length;
  const done = doc.trophies.filter((t) => earned.has(t.id)).length;
  progressText.textContent = `${done} of ${total} earned`;
  progressPct.textContent = `${Math.round((done / total) * 100)}%`;
  progressFill.style.width = `${(done / total) * 100}%`;
  gradeStatsEl.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const group = doc.trophies.filter((t) => t.grade === grade);
    const got = group.filter((t) => earned.has(t.id)).length;
    const chip = document.createElement('span');
    chip.className = 'grade-chip';
    chip.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = `${grade[0].toUpperCase()}${grade.slice(1)} `;
    const num = document.createElement('b');
    num.textContent = `${got}/${group.length}`;
    chip.append(label, num);
    gradeStatsEl.append(chip);
  }
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const step of doc.roadmap) {
    const li = document.createElement('li');
    const stage = document.createElement('span');
    stage.className = 'roadmap-stage';
    stage.textContent = `Stage ${step.stage}`;
    const title = document.createElement('h3');
    title.textContent = step.title;
    const text = document.createElement('p');
    text.textContent = step.text;
    li.append(stage, title, text);
    list.append(li);
  }
}

function renderMissable() {
  const box = document.getElementById('missableList');
  box.replaceChildren();
  const flagged = doc.trophies.filter((t) => t.missable);
  if (!flagged.length) {
    const p = document.createElement('p');
    p.textContent = 'No trophy in this list is missable.';
    box.append(p);
    return;
  }
  for (const t of flagged) {
    const div = document.createElement('div');
    div.className = 'missable-item';
    const strong = document.createElement('strong');
    strong.textContent = `⚠ ${t.name} (${t.grade})`;
    const p = document.createElement('p');
    p.textContent = t.missableNote ?? t.guide;
    div.append(strong, p);
    box.append(div);
  }
}

function trophyCard(t) {
  const card = document.createElement('article');
  card.className = 'trophy' + (earned.has(t.id) ? ' earned' : '');
  const head = document.createElement('div');
  head.className = 'trophy-head';
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'trophy-check';
  check.setAttribute('aria-label', earned.has(t.id) ? `Mark ${t.name} as not earned` : `Mark ${t.name} as earned`);
  check.textContent = earned.has(t.id) ? '✓' : '';
  check.addEventListener('click', (e) => {
    e.stopPropagation();
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveProgress();
    renderAll();
  });
  const body = document.createElement('div');
  body.className = 'trophy-body';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  if (isSpoilerHidden(t)) {
    name.textContent = 'Hidden story trophy';
    name.classList.add('spoiler-mask');
    desc.textContent = 'Spoiler hidden until earned. Earn it in the game to reveal its name and description here.';
    desc.classList.add('spoiler-mask');
  } else {
    name.textContent = t.name;
    desc.textContent = t.description;
  }
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${t.grade}`;
  gradeBadge.textContent = t.grade;
  meta.append(gradeBadge);
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge';
  kindBadge.textContent = t.kind === 'platinum' ? 'all 54 others' : t.kind;
  meta.append(kindBadge);
  if (t.count) {
    const countBadge = document.createElement('span');
    countBadge.className = 'badge';
    countBadge.textContent = `target: ${t.count.toLocaleString('en-US')}`;
    meta.append(countBadge);
  }
  if (t.hidden) {
    const hiddenBadge = document.createElement('span');
    hiddenBadge.className = 'badge hidden-badge';
    hiddenBadge.textContent = 'hidden on PS5';
    meta.append(hiddenBadge);
  }
  if (t.missable) {
    const missBadge = document.createElement('span');
    missBadge.className = 'badge missable';
    missBadge.textContent = 'missable';
    meta.append(missBadge);
  }
  if (earned.has(t.id)) {
    const earnedBadge = document.createElement('span');
    earnedBadge.className = 'badge';
    earnedBadge.textContent = '✓ earned';
    meta.append(earnedBadge);
  }
  body.append(name, desc, meta);
  if (openId === t.id) {
    const detail = document.createElement('div');
    detail.className = 'trophy-detail';
    const h = document.createElement('h3');
    h.textContent = 'How to get it';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    detail.append(h, guide);
    if (t.missable && t.missableNote) {
      const note = document.createElement('p');
      note.className = 'missable-note';
      note.textContent = `When it can be missed: ${t.missableNote}`;
      detail.append(note);
    }
    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.append(document.createTextNode('Sources: '));
    (t.sources ?? []).forEach((key, i) => {
      if (i > 0) sources.append(document.createTextNode(' · '));
      sources.append(sourceLink(key));
    });
    detail.append(sources);
    body.append(detail);
  }
  head.append(check, body);
  card.append(head);
  card.addEventListener('click', () => {
    openId = openId === t.id ? null : t.id;
    renderAll();
  });
  return card;
}

function renderList() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const status = statusEl.value;
  const shown = doc.trophies.filter((t) => {
    if (kind === 'online') return false;
    if (kind === 'missable' && !t.missable) return false;
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !earned.has(t.id)) return false;
    if (status === 'unearned' && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
  listEl.replaceChildren();
  if (kind === 'online') {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No online trophies. All 55 trophies unlock in single-player, offline.';
    listEl.append(empty);
  } else if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No trophies match these filters.';
    listEl.append(empty);
  } else {
    for (const t of shown) listEl.append(trophyCard(t));
  }
  countEl.textContent = kind === 'online'
    ? '0 online trophies in this list.'
    : `Showing ${shown.length} of ${doc.trophies.length} trophies. Click a trophy to read its guide and sources.`;
}

function renderAll() {
  renderProgress();
  renderList();
}

function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = new Set(doc.trophies.map((t) => t.id));
    const next = new Set(ids.filter((id) => valid.has(Number(id))).map(Number));
    earned = next;
    saveProgress();
    renderAll();
  } catch (err) {
    window.alert('That file is not a progress export from this guide.');
  }
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importProgress(file);
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies in this tracker?')) {
    earned = new Set();
    saveProgress();
    renderAll();
  }
});
spoilerEl.addEventListener('change', () => {
  hideSpoilers = spoilerEl.checked;
  saveSpoilerSetting();
  renderAll();
});
for (const el of [searchEl, kindEl, gradeEl, statusEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}

const response = await fetch('data/trophies.json');
doc = await response.json();
renderRoadmap();
renderMissable();
renderAll();
