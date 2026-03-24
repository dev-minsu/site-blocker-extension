import { detectLang, getMessages, type Lang, type Messages } from './i18n';

export {};

interface BlockRule {
  id: string;
  urlPattern: string;
  days: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface StorageData {
  rules?: BlockRule[];
  globalEnabled?: boolean;
  lang?: string;
}

// ── State ────────────────────────────────────────────────────────────────────
let currentLang: Lang = 'ko';
let t: Messages = getMessages(currentLang);

// ── i18n helpers ─────────────────────────────────────────────────────────────
function applyI18n(): void {
  const appTitle = document.getElementById('app-title');
  if (appTitle) appTitle.textContent = t.appTitle;

  const globalLabel = document.getElementById('global-label');
  if (globalLabel) globalLabel.textContent = t.globalLabel;

  const rulesSection = document.getElementById('rules-section-title');
  if (rulesSection) rulesSection.textContent = t.rulesSection;

  const addSection = document.getElementById('add-section-title');
  if (addSection) addSection.textContent = t.addSection;

  const urlLabel = document.getElementById('url-label');
  if (urlLabel) urlLabel.textContent = t.urlLabel;

  const urlInput = document.getElementById('url-input') as HTMLInputElement | null;
  if (urlInput) urlInput.placeholder = t.urlPlaceholder;

  const daysLabel = document.getElementById('days-label');
  if (daysLabel) daysLabel.textContent = t.daysLabel;

  const timeLabel = document.getElementById('time-label');
  if (timeLabel) timeLabel.textContent = t.timeLabel;

  const addBtn = document.getElementById('add-btn');
  if (addBtn) addBtn.textContent = t.addBtn;

  // Update day labels in add form
  t.days.forEach((label, i) => {
    const el = document.getElementById(`dl${i}`);
    if (el) el.textContent = label;
  });

  // Update lang toggle button
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = currentLang === 'ko' ? '🇺🇸' : '🇰🇷';
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatDays(days: number[]): string {
  if (days.length === 0 || days.length === 7) return t.everyday;
  const sorted = [...days].sort((a, b) => a - b);
  if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) return t.weekdays;
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) return t.weekend;
  return sorted.map((d) => t.days[d]).join('·');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderRules(rules: BlockRule[]): void {
  const list = document.getElementById('rules-list') as HTMLDivElement;

  if (rules.length === 0) {
    list.innerHTML = `<div class="empty-state">${t.emptyState}</div>`;
    return;
  }

  list.innerHTML = rules
    .map(
      (rule) => `
    <div class="rule-item ${rule.enabled ? '' : 'disabled'}" data-id="${rule.id}">
      <div class="rule-info">
        <div class="rule-site">${escapeHtml(rule.urlPattern)}</div>
        <div class="rule-badges">
          <span class="badge">${formatDays(rule.days)}</span>
          <span class="badge time">${rule.startTime} ~ ${rule.endTime}</span>
        </div>
      </div>
      <div class="rule-actions">
        <label class="toggle-sm">
          <input type="checkbox" class="rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''} />
          <span class="slider-sm"></span>
        </label>
        <button class="btn-edit" data-id="${rule.id}" aria-label="${t.editAriaLabel}">✏️</button>
        <button class="btn-delete" data-id="${rule.id}" aria-label="${t.deleteAriaLabel}">✕</button>
      </div>
    </div>
  `
    )
    .join('');

  // Events
  list.querySelectorAll<HTMLInputElement>('.rule-toggle').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const id = cb.dataset['id'];
      if (id) await toggleRule(id, cb.checked);
    });
  });

  list.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset['id'];
      if (id) openEditModal(id, rules);
    });
  });

  list.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset['id'];
      if (id) await deleteRule(id);
    });
  });
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function openEditModal(id: string, rules: BlockRule[]): void {
  const rule = rules.find((r) => r.id === id);
  if (!rule) return;

  // Remove existing modal
  document.getElementById('edit-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">${t.editAriaLabel}</span>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">${t.urlLabel}</label>
          <input
            type="text"
            id="edit-url"
            class="form-input"
            value="${escapeHtml(rule.urlPattern)}"
            readonly
            style="background:#f3f4f6;cursor:not-allowed"
          />
        </div>
        <div class="form-group">
          <label class="form-label">${t.daysLabel}</label>
          <div class="days-grid">
            ${t.days
              .map(
                (label, i) => `
              <input type="checkbox" class="day-check edit-day" id="ed${i}" value="${i}" ${rule.days.includes(i) ? 'checked' : ''} />
              <label class="day-label" for="ed${i}">${label}</label>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t.timeLabel}</label>
          <div class="time-row">
            <input type="time" id="edit-start" class="form-input" value="${rule.startTime}" />
            <input type="time" id="edit-end" class="form-input" value="${rule.endTime}" />
          </div>
        </div>
        <div class="modal-actions">
          <button id="edit-cancel" class="btn-cancel">${t.cancelBtn}</button>
          <button id="edit-save" class="btn-save" data-id="${rule.id}">${t.saveBtn}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('edit-cancel')?.addEventListener('click', () => modal.remove());

  document.getElementById('edit-save')?.addEventListener('click', async () => {
    const days: number[] = [];
    modal.querySelectorAll<HTMLInputElement>('.edit-day').forEach((cb) => {
      if (cb.checked) days.push(parseInt(cb.value, 10));
    });
    if (days.length === 0) {
      alert(t.alertSelectDay);
      return;
    }
    const startInput = document.getElementById('edit-start') as HTMLInputElement;
    const endInput = document.getElementById('edit-end') as HTMLInputElement;

    await updateRule(id, {
      days,
      startTime: startInput.value,
      endTime: endInput.value,
    });
    modal.remove();
  });
}

// ── Storage ───────────────────────────────────────────────────────────────────
async function loadData(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules', 'globalEnabled', 'lang'], (data) => {
      resolve(data as StorageData);
    });
  });
}

async function saveRules(rules: BlockRule[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ rules }, resolve);
  });
}

// ── Rule Actions ──────────────────────────────────────────────────────────────
async function toggleRule(id: string, enabled: boolean): Promise<void> {
  const data = await loadData();
  const rules = (data.rules ?? []).map((r) => (r.id === id ? { ...r, enabled } : r));
  await saveRules(rules);
  renderRules(rules);
}

async function deleteRule(id: string): Promise<void> {
  const data = await loadData();
  const rules = (data.rules ?? []).filter((r) => r.id !== id);
  await saveRules(rules);
  renderRules(rules);
}

async function updateRule(
  id: string,
  patch: Partial<Pick<BlockRule, 'days' | 'startTime' | 'endTime'>>
): Promise<void> {
  const data = await loadData();
  const rules = (data.rules ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r));
  await saveRules(rules);
  renderRules(rules);
}

async function addRule(): Promise<void> {
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const startInput = document.getElementById('start-time') as HTMLInputElement;
  const endInput = document.getElementById('end-time') as HTMLInputElement;

  const urlPattern = urlInput.value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
  if (!urlPattern) {
    urlInput.focus();
    return;
  }

  const days: number[] = [];
  document.querySelectorAll<HTMLInputElement>('.day-check:not(.edit-day)').forEach((cb) => {
    if (cb.checked) days.push(parseInt(cb.value, 10));
  });

  if (days.length === 0) {
    alert(t.alertSelectDay);
    return;
  }

  const newRule: BlockRule = {
    id: crypto.randomUUID(),
    urlPattern,
    days,
    startTime: startInput.value,
    endTime: endInput.value,
    enabled: true,
  };

  const data = await loadData();
  const rules = [...(data.rules ?? []), newRule];
  await saveRules(rules);
  renderRules(rules);
  urlInput.value = '';
}

// ── Lang Toggle ───────────────────────────────────────────────────────────────
async function switchLang(): Promise<void> {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  t = getMessages(currentLang);
  chrome.storage.sync.set({ lang: currentLang });

  // Update html lang attr
  document.documentElement.lang = currentLang;

  applyI18n();

  // Re-render rules with new language
  const data = await loadData();
  renderRules(data.rules ?? []);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init(): Promise<void> {
  const data = await loadData();

  // Resolve language
  currentLang = detectLang(data.lang);
  t = getMessages(currentLang);
  document.documentElement.lang = currentLang;
  applyI18n();

  // Render rules
  renderRules(data.rules ?? []);

  // Global toggle
  const globalToggle = document.getElementById('global-toggle') as HTMLInputElement;
  globalToggle.checked = data.globalEnabled ?? true;
  globalToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ globalEnabled: globalToggle.checked });
  });

  // Add button
  document.getElementById('add-btn')?.addEventListener('click', addRule);

  // Enter on URL input + blur normalization
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  urlInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') addRule();
  });
  urlInput.addEventListener('blur', () => {
    urlInput.value = urlInput.value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '');
  });

  // Lang toggle
  document.getElementById('lang-btn')?.addEventListener('click', switchLang);
}

document.addEventListener('DOMContentLoaded', init);
