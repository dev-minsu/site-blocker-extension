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
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDays(days: number[]): string {
  if (days.length === 7) return '매일';
  if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return '월~금';
  if (JSON.stringify(days) === JSON.stringify([0, 6])) return '주말';
  return days.map((d) => DAY_LABELS[d]).join('·');
}

function renderRules(rules: BlockRule[]): void {
  const list = document.getElementById('rules-list') as HTMLDivElement;

  if (rules.length === 0) {
    list.innerHTML = '<div class="empty-state">아직 차단 규칙이 없습니다</div>';
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
        <button class="btn-delete" data-id="${rule.id}" aria-label="삭제">✕</button>
      </div>
    </div>
  `
    )
    .join('');

  // Event: toggle individual rule
  list.querySelectorAll<HTMLInputElement>('.rule-toggle').forEach((checkbox) => {
    checkbox.addEventListener('change', async () => {
      const id = checkbox.dataset['id'];
      if (!id) return;
      await toggleRule(id, checkbox.checked);
    });
  });

  // Event: delete rule
  list.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset['id'];
      if (!id) return;
      await deleteRule(id);
    });
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadData(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules', 'globalEnabled'], (data) => {
      resolve(data as StorageData);
    });
  });
}

async function saveRules(rules: BlockRule[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ rules }, resolve);
  });
}

async function toggleRule(id: string, enabled: boolean): Promise<void> {
  const data = await loadData();
  const rules = data.rules ?? [];
  const updated = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
  await saveRules(updated);
  renderRules(updated);
}

async function deleteRule(id: string): Promise<void> {
  const data = await loadData();
  const rules = (data.rules ?? []).filter((r) => r.id !== id);
  await saveRules(rules);
  renderRules(rules);
}

async function addRule(): Promise<void> {
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const startInput = document.getElementById('start-time') as HTMLInputElement;
  const endInput = document.getElementById('end-time') as HTMLInputElement;

  const urlPattern = urlInput.value.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (!urlPattern) {
    urlInput.focus();
    return;
  }

  const days: number[] = [];
  document.querySelectorAll<HTMLInputElement>('.day-check').forEach((cb) => {
    if (cb.checked) days.push(parseInt(cb.value, 10));
  });

  if (days.length === 0) {
    alert('최소 하나의 요일을 선택해주세요.');
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

  // Reset form
  urlInput.value = '';
}

async function init(): Promise<void> {
  const data = await loadData();
  const rules = data.rules ?? [];
  const globalEnabled = data.globalEnabled ?? true;

  renderRules(rules);

  // Global toggle
  const globalToggle = document.getElementById('global-toggle') as HTMLInputElement;
  globalToggle.checked = globalEnabled;

  globalToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ globalEnabled: globalToggle.checked });
  });

  // Add button
  const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
  addBtn.addEventListener('click', addRule);

  // Allow Enter key on URL input
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  urlInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') addRule();
  });
}

document.addEventListener('DOMContentLoaded', init);
