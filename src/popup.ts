interface BlockRule {
  id: string;
  urlPattern: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface StorageData {
  rules: BlockRule[];
  globalEnabled: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Storage helpers ────────────────────────────────────────────────────────────

async function loadData(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules', 'globalEnabled'], (result) => {
      resolve({
        rules: (result['rules'] as BlockRule[]) ?? [],
        globalEnabled: (result['globalEnabled'] as boolean) ?? true,
      });
    });
  });
}

async function saveRules(rules: BlockRule[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ rules }, resolve);
  });
}

async function saveGlobalEnabled(enabled: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ globalEnabled: enabled }, resolve);
  });
}

// ── DOM helpers ────────────────────────────────────────────────────────────────

function formatDays(days: number[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days';

  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const sorted = [...days].sort();

  if (weekdays.every((d) => sorted.includes(d)) && sorted.length === 5) return 'Weekdays';
  if (weekend.every((d) => sorted.includes(d)) && sorted.length === 2) return 'Weekends';

  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

function formatTime(start: string, end: string): string {
  return `${start} – ${end}`;
}

function createRuleElement(rule: BlockRule, onToggle: (id: string, enabled: boolean) => void, onDelete: (id: string) => void): HTMLElement {
  const item = document.createElement('div');
  item.className = `rule-item${rule.enabled ? '' : ' disabled'}`;
  item.dataset['id'] = rule.id;

  item.innerHTML = `
    <div class="rule-info">
      <div class="rule-url" title="${escapeHtml(rule.urlPattern)}">${escapeHtml(rule.urlPattern)}</div>
      <div class="rule-meta">
        <span class="rule-days">${escapeHtml(formatDays(rule.days))}</span>
        <span class="rule-time">${escapeHtml(formatTime(rule.startTime, rule.endTime))}</span>
      </div>
    </div>
    <div class="rule-actions">
      <label class="rule-toggle" title="${rule.enabled ? 'Disable' : 'Enable'}">
        <input type="checkbox" ${rule.enabled ? 'checked' : ''} />
        <span class="rule-toggle-slider"></span>
      </label>
      <button class="btn-delete" title="Delete rule">✕</button>
    </div>
  `;

  const toggleInput = item.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  toggleInput.addEventListener('change', () => {
    onToggle(rule.id, toggleInput.checked);
  });

  const deleteBtn = item.querySelector<HTMLButtonElement>('.btn-delete')!;
  deleteBtn.addEventListener('click', () => {
    onDelete(rule.id);
  });

  return item;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── App state ─────────────────────────────────────────────────────────────────

let rules: BlockRule[] = [];

function renderRules(): void {
  const list = document.getElementById('rules-list')!;
  const emptyState = document.getElementById('empty-state')!;
  const countEl = document.getElementById('rules-count')!;

  // Remove existing rule items (keep empty state node)
  const existing = list.querySelectorAll('.rule-item');
  existing.forEach((el) => el.remove());

  countEl.textContent = `${rules.length} rule${rules.length !== 1 ? 's' : ''}`;

  if (rules.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  rules.forEach((rule) => {
    const el = createRuleElement(rule, handleToggleRule, handleDeleteRule);
    list.appendChild(el);
  });
}

async function handleToggleRule(id: string, enabled: boolean): Promise<void> {
  rules = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
  renderRules();
  await saveRules(rules);
}

async function handleDeleteRule(id: string): Promise<void> {
  rules = rules.filter((r) => r.id !== id);
  renderRules();
  await saveRules(rules);
}

// ── Form logic ────────────────────────────────────────────────────────────────

function getSelectedDays(): number[] {
  const checkboxes = document.querySelectorAll<HTMLInputElement>('.day-check');
  const days: number[] = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) days.push(Number(cb.value));
  });
  return days;
}

function validateUrl(pattern: string): boolean {
  return pattern.trim().length > 0;
}

function showUrlError(visible: boolean): void {
  const el = document.getElementById('url-error')!;
  el.classList.toggle('visible', visible);
}

async function handleAddRule(): Promise<void> {
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const startInput = document.getElementById('start-time') as HTMLInputElement;
  const endInput = document.getElementById('end-time') as HTMLInputElement;
  const btnAdd = document.getElementById('btn-add') as HTMLButtonElement;

  const urlPattern = urlInput.value.trim();

  if (!validateUrl(urlPattern)) {
    showUrlError(true);
    urlInput.focus();
    return;
  }

  showUrlError(false);

  const newRule: BlockRule = {
    id: crypto.randomUUID(),
    urlPattern,
    days: getSelectedDays(),
    startTime: startInput.value || '09:00',
    endTime: endInput.value || '18:00',
    enabled: true,
  };

  rules = [...rules, newRule];
  renderRules();
  await saveRules(rules);

  // Reset URL field, keep days/time settings for convenience
  urlInput.value = '';
  btnAdd.textContent = '✓ Added!';
  btnAdd.disabled = true;
  setTimeout(() => {
    btnAdd.textContent = '+ Add Rule';
    btnAdd.disabled = false;
  }, 1000);
}

// ── Global toggle ─────────────────────────────────────────────────────────────

function updateGlobalLabel(enabled: boolean): void {
  const label = document.getElementById('global-status-label')!;
  label.textContent = enabled ? 'ON' : 'OFF';
  label.style.color = enabled ? '#34c759' : '#ff4d4d';
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const data = await loadData();
  rules = data.rules;

  // Global toggle
  const globalToggle = document.getElementById('global-toggle') as HTMLInputElement;
  globalToggle.checked = data.globalEnabled;
  updateGlobalLabel(data.globalEnabled);

  globalToggle.addEventListener('change', async () => {
    updateGlobalLabel(globalToggle.checked);
    await saveGlobalEnabled(globalToggle.checked);
  });

  // Rules
  renderRules();

  // URL input — clear error on type
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  urlInput.addEventListener('input', () => showUrlError(false));
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddRule();
  });

  // Add button
  const btnAdd = document.getElementById('btn-add') as HTMLButtonElement;
  btnAdd.addEventListener('click', handleAddRule);
}

document.addEventListener('DOMContentLoaded', init);

export {};
