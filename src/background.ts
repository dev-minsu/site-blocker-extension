import { BlockRule, StorageData } from './types';

let cachedRules: BlockRule[] = [];
let globalEnabled = true;

// ── Storage ───────────────────────────────────────────────────────────────────

function loadFromStorage(): void {
  chrome.storage.sync.get(['rules', 'globalEnabled'], (result) => {
    cachedRules = (result['rules'] as BlockRule[]) ?? [];
    globalEnabled = (result['globalEnabled'] as boolean) ?? true;
  });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes['rules']) {
    cachedRules = changes['rules'].newValue as BlockRule[];
  }
  if (changes['globalEnabled']) {
    globalEnabled = changes['globalEnabled'].newValue as boolean;
  }
});

// ── Time helpers ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isBlockedNow(rule: BlockRule): boolean {
  if (!rule.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun ... 6=Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!rule.days.includes(currentDay)) return false;

  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);

  return currentMinutes >= start && currentMinutes < end;
}

function normalizePattern(p: string): string {
  return p.toLowerCase().replace(/^www\./, '').replace(/\/+$/, '').trim();
}

function matchesUrl(urlPattern: string, url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const normalized = normalizePattern(hostname);
    const pattern = normalizePattern(urlPattern);
    return normalized === pattern || normalized.endsWith('.' + pattern);
  } catch {
    return false;
  }
}

function findBlockingRule(url: string): BlockRule | null {
  if (!globalEnabled) return null;
  for (const rule of cachedRules) {
    if (matchesUrl(rule.urlPattern, url) && isBlockedNow(rule)) {
      return rule;
    }
  }
  return null;
}

function buildBlockedUrl(tabId: number, rule: BlockRule, originalUrl: string): string {
  const extensionUrl = chrome.runtime.getURL('dist/blocked.html'); // Chrome ext root = project root, dist/ prefix needed
  let site = '';
  try {
    site = new URL(originalUrl).hostname.replace(/^www\./, '');
  } catch {
    site = rule.urlPattern;
  }
  const params = new URLSearchParams({
    site,
    start: rule.startTime,
    end: rule.endTime,
    days: rule.days.join(','),
  });
  return `${extensionUrl}?${params.toString()}`;
}

// ── Navigation listener ───────────────────────────────────────────────────────

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // main frame only
  const { url, tabId } = details;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  const rule = findBlockingRule(url);
  if (rule) {
    const blockedUrl = buildBlockedUrl(tabId, rule, url);
    chrome.tabs.update(tabId, { url: blockedUrl });
  }
});

// Also catch commits (handles redirects)
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  const { url, tabId } = details;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  const rule = findBlockingRule(url);
  if (rule) {
    const blockedUrl = buildBlockedUrl(tabId, rule, url);
    chrome.tabs.update(tabId, { url: blockedUrl });
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────

loadFromStorage();
