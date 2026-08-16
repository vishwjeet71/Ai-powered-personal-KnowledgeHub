'use strict';

/* =========================================================================
   API LAYER
   All backend calls funnel through here. Endpoints, methods and payload
   shapes match main.py exactly — see the notes on /share-documents below,
   it's the one route that doesn't take a JSON body like the rest.
   ========================================================================= */

async function apiRequest(method, path, { query = null, body = null } = {}) {
  let url = path;
  if (query) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const opts = { method, headers: {} };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch (_) { /* empty/non-JSON body */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // fetch itself threw — network is down, CORS blocked, or the route 404s
    // with no JSON handler behind it.
    return { ok: false, status: 0, data: null, networkError: true };
  }
}

const api = {
  get: (path, query) => apiRequest('GET', path, { query }),
  post: (path, body, query) => apiRequest('POST', path, { body: body ?? {}, query }),
  patch: (path, body) => apiRequest('PATCH', path, { body: body ?? {} }),
  del: (path, body) => apiRequest('DELETE', path, { body }),
};

function reasonFrom(data, fallback) {
  // /chat has one branch that writes the key as "reason:" (trailing colon) —
  // main.py line ~280. Covering both so that specific failure still surfaces
  // a real message instead of "undefined".
  if (!data) return fallback;
  return data.reason ?? data['reason:'] ?? fallback;
}

/* =========================================================================
   STATE
   ========================================================================= */
const state = {
  view: 'chat',
  theme: 'light',
  documents: [],
  activeTypeFilter: '',
  selectMode: false,
  selected: new Set(),
  chatBusy: false,
};

/* =========================================================================
   DOM SHORTHAND
   ========================================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* =========================================================================
   UTILITIES
   ========================================================================= */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function truncate(str, n) {
  const s = String(str ?? '');
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function fileTypeOf(doc) {
  return (doc?.metadata?.file_type || doc?.metadata?.source || 'file').toString();
}

function fileNameOf(doc) {
  return doc?.metadata?.file_name || doc?.metadata?.source || 'Untitled source';
}

function iconForType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('pdf')) return 'picture_as_pdf';
  if (t.includes('doc')) return 'description';
  if (t.includes('web') || t.includes('html')) return 'language';
  if (t.includes('txt')) return 'article';
  return 'draft';
}

function attachRipple(el) {
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const span = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    span.className = 'ripple';
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${(e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
    span.style.top = `${(e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
    el.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
}

/* =========================================================================
   SNACKBAR
   ========================================================================= */
function showSnackbar(message, tone = 'default') {
  const host = $('#snackbarHost');
  const el = document.createElement('div');
  el.className = `snackbar${tone === 'error' ? ' snackbar--error' : ''}`;
  el.innerHTML = `
    <span class="material-symbols-outlined">${tone === 'error' ? 'error' : 'check_circle'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove());
  }, 3600);
}

/* =========================================================================
   SCRIM / SHEETS / DIALOGS
   ========================================================================= */
let openOverlays = new Set();

function showScrim() {
  const scrim = $('#scrim');
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('is-visible'));
}
function hideScrimIfIdle() {
  if (openOverlays.size > 0) return;
  const scrim = $('#scrim');
  scrim.classList.remove('is-visible');
  setTimeout(() => { if (openOverlays.size === 0) scrim.hidden = true; }, 250);
}

function openSheet(id) {
  const el = document.getElementById(id);
  el.hidden = false;
  showScrim();
  openOverlays.add(id);
  requestAnimationFrame(() => el.classList.add('is-visible'));
}
function closeSheet(id) {
  const el = document.getElementById(id);
  el.classList.remove('is-visible');
  openOverlays.delete(id);
  hideScrimIfIdle();
  setTimeout(() => { el.hidden = true; }, 320);
}

function openDialog(id) {
  const el = document.getElementById(id);
  el.hidden = false;
  showScrim();
  openOverlays.add(id);
  requestAnimationFrame(() => el.classList.add('is-visible'));
}
function closeDialog(id) {
  const el = document.getElementById(id);
  el.classList.remove('is-visible');
  openOverlays.delete(id);
  hideScrimIfIdle();
  setTimeout(() => { el.hidden = true; }, 220);
}

$('#scrim').addEventListener('click', () => {
  [...openOverlays].forEach((id) => {
    const el = document.getElementById(id);
    if (el.classList.contains('sheet')) closeSheet(id); else closeDialog(id);
  });
});

/* =========================================================================
   THEME
   ========================================================================= */
function initTheme() {
  const saved = localStorage.getItem('khub-theme');
  const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(preferred);
}
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('khub-theme', theme);
  $('#themeIcon').textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}
$('#themeToggle').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));

/* =========================================================================
   NAVIGATION
   ========================================================================= */
function switchView(view) {
  state.view = view;
  $$('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === view));
  $$('.nav-item').forEach((n) => n.classList.toggle('is-active', n.dataset.view === view));
  location.hash = view;

  if (view === 'library' && state.documents.length === 0) loadDocuments();
  if (view === 'settings') loadHealth();
}
$$('.nav-item').forEach((btn) => {
  attachRipple(btn);
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* =========================================================================
   HEALTH
   ========================================================================= */
async function loadHealth() {
  const { ok, data } = await api.get('/health');
  const dot = $('#healthDot');
  const label = $('#healthLabel');

  if (!ok || !data) {
    dot.className = 'health-pill__dot is-bad';
    label.textContent = 'Offline';
    $$('.status-row').forEach((row) => {
      row.querySelector('.status-row__dot').className = 'status-row__dot is-bad';
      row.querySelector('.status-row__state').textContent = 'Unknown';
    });
    return;
  }

  const allUp = data.chat_model && data.embedding_model && data.vectordb && data.agent;
  dot.className = `health-pill__dot ${allUp ? 'is-ok' : 'is-bad'}`;
  label.textContent = allUp ? 'Ready' : 'Needs setup';

  $$('.status-row').forEach((row) => {
    const key = row.dataset.key;
    const up = !!data[key];
    row.querySelector('.status-row__dot').className = `status-row__dot ${up ? 'is-ok' : 'is-bad'}`;
    row.querySelector('.status-row__state').textContent = up ? 'Connected' : 'Not loaded';
  });
}
$('#refreshHealth').addEventListener('click', () => { attachRippleOnce($('#refreshHealth')); loadHealth(); });
$('#healthPill').addEventListener('click', () => switchView('settings'));

function attachRippleOnce(el) { if (!el.dataset.rippled) { attachRipple(el); el.dataset.rippled = '1'; } }

/* =========================================================================
   CHAT
   ========================================================================= */
const chatThread = $('#chatThread');
const chatScroll = $('#chatScroll');
const chatEmpty = $('#chatEmpty');
const chatInput = $('#chatInput');

function renderMessage({ role, text, isError = false }) {
  chatEmpty.style.display = 'none';
  const wrap = document.createElement('div');
  wrap.className = `msg msg--${role}${isError ? ' msg--error' : ''}`;
  wrap.innerHTML = `
    <span class="msg__avatar">
      <span class="material-symbols-outlined">${role === 'user' ? 'person' : (isError ? 'error' : 'auto_awesome')}</span>
    </span>
    <span class="msg__bubble">${escapeHtml(text)}</span>
  `;
  chatThread.appendChild(wrap);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return wrap;
}

function renderTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg msg--agent msg--typing';
  wrap.innerHTML = `
    <span class="msg__avatar"><span class="material-symbols-outlined">auto_awesome</span></span>
    <span class="msg__bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>
  `;
  chatThread.appendChild(wrap);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return wrap;
}

async function sendChatMessage(query) {
  if (state.chatBusy) return;
  state.chatBusy = true;
  $('#sendBtn').disabled = true;

  renderMessage({ role: 'user', text: query });
  const typing = renderTyping();

  const { ok, status, data, networkError } = await api.post('/chat', { query });
  typing.remove();

  if (networkError) {
    renderMessage({ role: 'agent', text: "Can't reach the backend right now. Is the FastAPI server running?", isError: true });
  } else if (ok && data?.response) {
    renderMessage({ role: 'agent', text: data.result });
  } else if (status === 501) {
    renderMessage({ role: 'agent', text: reasonFrom(data, "That result type wasn't recognized."), isError: true });
  } else {
    renderMessage({ role: 'agent', text: reasonFrom(data, 'Something went wrong answering that.'), isError: true });
  }

  state.chatBusy = false;
  $('#sendBtn').disabled = false;
  chatInput.focus();
}

$('#composerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val) return;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendChatMessage(val);
});
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
});
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $('#composerForm').requestSubmit();
  }
});

/* =========================================================================
   LIBRARY
   ========================================================================= */
const docList = $('#docList');
const docSkeleton = $('#docSkeleton');
const libraryEmpty = $('#libraryEmpty');

function setLibraryLoading(isLoading) {
  docSkeleton.hidden = !isLoading;
}

function updateLibraryBadge() {
  const badge = $('#libraryBadge');
  if (state.documents.length > 0) {
    badge.hidden = false;
    badge.textContent = state.documents.length > 99 ? '99+' : String(state.documents.length);
  } else {
    badge.hidden = true;
  }
}

function renderTypeChips() {
  const row = $('#typeChipRow');
  const types = [...new Set(state.documents.map(fileTypeOf).filter(Boolean))];
  row.innerHTML = `<button class="chip${state.activeTypeFilter === '' ? ' is-selected' : ''}" data-filter-type="" type="button">All</button>`;
  types.forEach((t) => {
    const chip = document.createElement('button');
    chip.className = `chip${state.activeTypeFilter === t ? ' is-selected' : ''}`;
    chip.type = 'button';
    chip.dataset.filterType = t;
    chip.textContent = t;
    row.appendChild(chip);
  });
  $$('.chip', row).forEach((chip) => {
    attachRipple(chip);
    chip.addEventListener('click', () => {
      state.activeTypeFilter = chip.dataset.filterType;
      applyFilters();
    });
  });
}

function renderDocumentCard(doc) {
  const card = document.createElement('div');
  card.className = `doc-card${state.selectMode ? ' select-mode' : ''}${state.selected.has(doc.id) ? ' is-selected' : ''}`;
  card.dataset.id = doc.id;
  const type = fileTypeOf(doc);
  card.innerHTML = `
    <span class="doc-card__check">
      <input type="checkbox" class="doc-card__checkbox" ${state.selected.has(doc.id) ? 'checked' : ''} aria-label="Select document">
    </span>
    <span class="doc-card__icon"><span class="material-symbols-outlined">${iconForType(type)}</span></span>
    <div class="doc-card__body">
      <div class="doc-card__top">
        <span class="doc-card__name">${escapeHtml(fileNameOf(doc))}</span>
        <span class="doc-card__badge">${escapeHtml(type)}</span>
      </div>
      <p class="doc-card__text">${escapeHtml(truncate(doc.text, 160)) || '—'}</p>
      <p class="doc-card__id">ID ${escapeHtml(truncate(doc.id, 28))}</p>
      <div class="doc-card__actions">
        <button class="icon-btn icon-btn--sm" data-action="details" aria-label="View details" data-tooltip="Details"><span class="material-symbols-outlined">info</span></button>
        <button class="icon-btn icon-btn--sm" data-action="edit" aria-label="Edit content" data-tooltip="Edit"><span class="material-symbols-outlined">edit</span></button>
        <button class="icon-btn icon-btn--sm" data-action="delete" aria-label="Delete" data-tooltip="Delete"><span class="material-symbols-outlined">delete</span></button>
      </div>
    </div>
  `;

  card.querySelector('[data-action="details"]').addEventListener('click', () => openDetails(doc));
  card.querySelector('[data-action="edit"]').addEventListener('click', () => openEdit(doc));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDeleteOne(doc));
  card.querySelector('.doc-card__checkbox').addEventListener('change', () => toggleSelect(doc.id));
  card.addEventListener('click', (e) => {
    if (state.selectMode && !e.target.closest('.doc-card__actions')) toggleSelect(doc.id);
  });
  $$('.icon-btn', card).forEach(attachRipple);

  return card;
}

function renderDocuments(docs) {
  $$('.doc-card', docList).forEach((c) => c.remove());
  libraryEmpty.hidden = docs.length > 0;
  docs.forEach((doc) => docList.appendChild(renderDocumentCard(doc)));
}

async function loadDocuments() {
  setLibraryLoading(true);
  const { ok, data, networkError } = await api.get('/db-data');
  setLibraryLoading(false);

  if (networkError) {
    showSnackbar("Can't reach the backend.", 'error');
    return;
  }
  if (ok && data?.response) {
    state.documents = data.result || [];
  } else {
    state.documents = [];
    if (data && data.reason && data.reason !== 'No data is available to load' && !data.reason.includes('No documents found')) {
      showSnackbar(reasonFrom(data, 'Could not load the library.'), 'error');
    }
  }
  updateLibraryBadge();
  renderTypeChips();
  renderDocuments(state.documents);
}

async function applyFilters() {
  const fileName = $('#searchInput').value.trim();
  const source = $('#sourceFilter').value;
  const updateByUser = $('#editedFilter').value;
  const fileType = state.activeTypeFilter;

  renderTypeChips();

  const hasAnyFilter = fileName || source || updateByUser || fileType;
  if (!hasAnyFilter) {
    renderDocuments(state.documents);
    return;
  }

  setLibraryLoading(true);
  const { ok, data, networkError } = await api.post('/filter', {
    file_name: fileName || null,
    file_type: fileType || null,
    source: source || null,
    update_by_user: updateByUser || null,
  });
  setLibraryLoading(false);

  if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
  if (ok && data?.response) {
    renderDocuments(data.result || []);
  } else {
    renderDocuments([]);
    if (data?.reason && !data.reason.startsWith('No document')) showSnackbar(reasonFrom(data, 'Filter failed.'), 'error');
  }
}
const debouncedFilter = debounce(applyFilters, 350);
$('#searchInput').addEventListener('input', () => {
  $('#clearSearch').hidden = !$('#searchInput').value;
  debouncedFilter();
});
$('#clearSearch').addEventListener('click', () => {
  $('#searchInput').value = '';
  $('#clearSearch').hidden = true;
  applyFilters();
});
$('#sourceFilter').addEventListener('change', applyFilters);
$('#editedFilter').addEventListener('change', applyFilters);
$('#refreshLibrary').addEventListener('click', () => { attachRippleOnce($('#refreshLibrary')); loadDocuments(); });

/* ---- selection mode ---- */
function toggleSelect(id) {
  if (state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
  const card = docList.querySelector(`.doc-card[data-id="${CSS.escape(id)}"]`);
  if (card) {
    card.classList.toggle('is-selected', state.selected.has(id));
    card.querySelector('.doc-card__checkbox').checked = state.selected.has(id);
  }
  updateSelectionBar();
}
function updateSelectionBar() {
  const bar = $('#selectionBar');
  bar.hidden = !state.selectMode || state.selected.size === 0;
  $('#selectionCount').textContent = `${state.selected.size} selected`;
}
$('#selectModeToggle').addEventListener('click', () => {
  state.selectMode = !state.selectMode;
  state.selected.clear();
  $$('.doc-card', docList).forEach((c) => c.classList.toggle('select-mode', state.selectMode));
  $('#selectModeToggle').classList.toggle('is-active', state.selectMode);
  updateSelectionBar();
});
$('#selectionCancel').addEventListener('click', () => {
  state.selectMode = false;
  state.selected.clear();
  $$('.doc-card', docList).forEach((c) => c.classList.remove('select-mode', 'is-selected'));
  updateSelectionBar();
});
$('#selectionDelete').addEventListener('click', () => {
  if (state.selected.size === 0) return;
  openConfirm({
    title: `Delete ${state.selected.size} document${state.selected.size > 1 ? 's' : ''}?`,
    body: "This removes them from the vector database. It can't be undone.",
    onConfirm: async () => {
      const ids = [...state.selected];
      const { ok, data, networkError } = await api.del('/documents', { ids });
      if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
      if (ok && data?.response) {
        showSnackbar(data.result || 'Deleted.');
        state.selected.clear();
        state.selectMode = false;
        updateSelectionBar();
        loadDocuments();
      } else {
        showSnackbar(reasonFrom(data, 'Delete failed.'), 'error');
      }
    },
  });
});

/* ---- add document ---- */
$('#addDocFab').addEventListener('click', () => {
  $('#addDocPath').value = '';
  openSheet('addDocSheet');
  setTimeout(() => $('#addDocPath').focus(), 300);
});
$('#addDocCancel').addEventListener('click', () => closeSheet('addDocSheet'));
$('#addDocConfirm').addEventListener('click', async () => {
  const path = $('#addDocPath').value.trim();
  if (!path) { showSnackbar('Enter a file path or URL first.', 'error'); return; }

  const btn = $('#addDocConfirm');
  btn.disabled = true;

  // NOTE: /share-documents takes `path` as a bare query parameter in
  // main.py, not a JSON body — every other write route here does. Sending
  // it as JSON would silently fail, so this goes through the query string.
  const { ok, data, networkError } = await api.post('/share-documents', null, { path });
  btn.disabled = false;

  if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
  if (ok && data?.response) {
    showSnackbar(data.result || 'Source added.');
    closeSheet('addDocSheet');
    loadDocuments();
  } else {
    showSnackbar(reasonFrom(data, 'Could not add that source.'), 'error');
  }
});

/* ---- details ---- */
function openDetails(doc) {
  $('#detailsId').textContent = doc.id;
  $('#detailsText').textContent = doc.text || '—';
  const grid = $('#detailsMetadata');
  grid.innerHTML = '';
  const metadata = doc.metadata || {};
  const keys = Object.keys(metadata);
  if (keys.length === 0) {
    grid.innerHTML = '<p class="details-grid__val">No metadata on this document.</p>';
  } else {
    keys.forEach((key) => {
      const item = document.createElement('div');
      item.className = 'details-grid__item';
      item.innerHTML = `<div class="details-grid__key">${escapeHtml(key)}</div><div class="details-grid__val">${escapeHtml(metadata[key])}</div>`;
      grid.appendChild(item);
    });
  }
  openSheet('detailsSheet');
}
$('#detailsClose').addEventListener('click', () => closeSheet('detailsSheet'));

/* ---- edit ---- */
let editingDocId = null;
function openEdit(doc) {
  editingDocId = doc.id;
  $('#editContent').value = doc.text || '';
  openSheet('editSheet');
}
$('#editCancel').addEventListener('click', () => closeSheet('editSheet'));
$('#editConfirm').addEventListener('click', async () => {
  const updatedPageContent = $('#editContent').value;
  const btn = $('#editConfirm');
  btn.disabled = true;

  const { ok, data, networkError } = await api.patch('/update_document', {
    doc_id: editingDocId,
    updated_pageContent: updatedPageContent,
  });
  btn.disabled = false;

  if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
  if (ok && data?.response) {
    showSnackbar(data.result || 'Document updated.');
    closeSheet('editSheet');
    loadDocuments();
  } else {
    showSnackbar(reasonFrom(data, 'Update failed.'), 'error');
  }
});

/* ---- delete (single) ---- */
function confirmDeleteOne(doc) {
  openConfirm({
    title: 'Delete this document?',
    body: "This removes it from the vector database. It can't be undone.",
    onConfirm: async () => {
      const { ok, data, networkError } = await api.del('/documents', { ids: [doc.id] });
      if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
      if (ok && data?.response) {
        showSnackbar(data.result || 'Deleted.');
        loadDocuments();
      } else {
        showSnackbar(reasonFrom(data, 'Delete failed.'), 'error');
      }
    },
  });
}

/* ---- generic confirm dialog ---- */
let confirmHandler = null;
function openConfirm({ title, body, onConfirm }) {
  $('#confirmTitle').textContent = title;
  $('#confirmBody').textContent = body;
  confirmHandler = onConfirm;
  openDialog('confirmDialog');
}
$('#confirmCancel').addEventListener('click', () => closeDialog('confirmDialog'));
$('#confirmOk').addEventListener('click', async () => {
  closeDialog('confirmDialog');
  if (confirmHandler) await confirmHandler();
  confirmHandler = null;
});

/* =========================================================================
   SETTINGS
   ========================================================================= */
$$('input[name="api_provider"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    $('#baseUrlField').hidden = radio.value !== 'openCompatible';
  });
});

$('#toggleKeyVisibility').addEventListener('click', () => {
  const input = $('#apiKey');
  const btn = $('#toggleKeyVisibility');
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.material-symbols-outlined').textContent = showing ? 'visibility' : 'visibility_off';
});

$('#secretForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#saveSecretBtn');
  btn.disabled = true;

  const provider = $$('input[name="api_provider"]').find((r) => r.checked)?.value || 'google';
  const payload = {
    api_key: $('#apiKey').value.trim(),
    api_provider: provider,
    base_url: provider === 'openCompatible' ? ($('#baseUrl').value.trim() || null) : null,
    chat_model_name: $('#chatModelName').value.trim() || null,
    embd_model_name: $('#embdModelName').value.trim() || null,
  };

  const { ok, data, networkError } = await api.post('/create-secret', payload);
  btn.disabled = false;

  if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
  if (ok && data?.response) {
    showSnackbar('Connected — models loaded.');
    loadHealth();
  } else {
    showSnackbar(reasonFrom(data, 'Could not save that key.'), 'error');
  }
});

$('#removeSecretBtn').addEventListener('click', () => {
  openConfirm({
    title: 'Disconnect this provider?',
    body: 'The stored key is deleted from the server and the models unload immediately.',
    onConfirm: async () => {
      const { ok, data, networkError } = await api.del('/remove-secret');
      if (networkError) { showSnackbar("Can't reach the backend.", 'error'); return; }
      if (ok && data?.response) {
        showSnackbar('Disconnected.');
        $('#secretForm').reset();
        $('#baseUrlField').hidden = true;
        loadHealth();
      } else {
        showSnackbar(reasonFrom(data, 'Could not disconnect.'), 'error');
      }
    },
  });
});

/* =========================================================================
   INIT
   ========================================================================= */
function init() {
  initTheme();
  $$('.filled-btn, .tonal-btn, .outlined-btn, .text-btn, .fab').forEach(attachRipple);

  const startView = ['chat', 'library', 'settings'].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : 'chat';
  switchView(startView);
  loadHealth();

  // keep health status fresh without needing a manual refresh every time
  setInterval(loadHealth, 45000);
}

document.addEventListener('DOMContentLoaded', init);