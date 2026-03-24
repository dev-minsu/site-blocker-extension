import { detectLang, getMessages, type Lang, type Messages } from './i18n';

export {};

// ── State ─────────────────────────────────────────────────────────────────────
let currentLang: Lang = 'ko';
let t: Messages = getMessages(currentLang);

// ── Params ────────────────────────────────────────────────────────────────────
interface BlockedParams {
  site: string;
  start: string;
  end: string;
  days: number[];
  originalUrl: string; // full URL to return to after block ends
}

function parseParams(): BlockedParams {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site') ?? '';
  const start = params.get('start') ?? '00:00';
  const end = params.get('end') ?? '24:00';
  const daysStr = params.get('days') ?? '';
  const days = daysStr
    ? daysStr
        .split(',')
        .map((d) => parseInt(d, 10))
        .filter((d) => !isNaN(d))
    : [];
  const originalUrl = params.get('url') ?? (site ? `https://${site}` : '');

  return { site, start, end, days, originalUrl };
}

// ── Schedule Formatter ────────────────────────────────────────────────────────
function formatSchedule(days: number[], start: string, end: string): string {
  let dayStr: string;

  if (days.length === 0 || days.length === 7) {
    dayStr = t.everyday;
  } else {
    const sorted = [...days].sort((a, b) => a - b);

    if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) {
      dayStr = t.weekdays;
    } else if (JSON.stringify(sorted) === JSON.stringify([0, 6])) {
      dayStr = t.weekend;
    } else if (sorted.length >= 2) {
      const isConsecutive = sorted.every(
        (d, i) => i === 0 || d === (sorted[i - 1] as number) + 1
      );
      if (isConsecutive) {
        dayStr = `${t.days[sorted[0] as number]}~${t.days[sorted[sorted.length - 1] as number]}`;
      } else {
        dayStr = sorted.map((d) => t.days[d]).join('·');
      }
    } else {
      dayStr = sorted.map((d) => t.days[d]).join('·');
    }
  }

  return `${dayStr} ${start} – ${end}`;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

/**
 * Returns seconds remaining until endTime today.
 * Returns 0 if endTime has already passed — prevents the old bug where
 * refreshing the blocked page after the block ended showed 23:59:00 because
 * getEndDateTime() was pushing the target to tomorrow.
 */
function getSecondsUntilEnd(endTime: string): number {
  const now = new Date();
  const [hours, minutes] = endTime.split(':').map(Number);
  const endMinutes = (hours as number) * 60 + (minutes as number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const diffMinutes = endMinutes - nowMinutes;

  if (diffMinutes <= 0) return 0; // block already over
  return diffMinutes * 60 - now.getSeconds();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function updateCountdown(
  remainingSeconds: number,
  originalUrl: string,
  intervalId: ReturnType<typeof setInterval>
): void {
  const diff = Math.max(0, remainingSeconds);

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  (document.getElementById('hours') as HTMLElement).textContent = pad(h);
  (document.getElementById('minutes') as HTMLElement).textContent = pad(m);
  (document.getElementById('seconds') as HTMLElement).textContent = pad(s);

  if (diff === 0) {
    clearInterval(intervalId);
    if (originalUrl) {
      const returnUrl = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;
      window.location.href = returnUrl;
    }
  }
}

// ── i18n Apply ────────────────────────────────────────────────────────────────
function applyI18n(params: BlockedParams): void {
  document.documentElement.lang = currentLang;

  const titleEl = document.getElementById('blocked-title');
  if (titleEl) titleEl.textContent = t.blockedTitle;

  const subtitleEl = document.getElementById('blocked-subtitle');
  if (subtitleEl) subtitleEl.textContent = t.blockedSubtitle;

  const scheduleLabel = document.getElementById('schedule-label');
  if (scheduleLabel) scheduleLabel.textContent = t.scheduleLabel;

  const countdownLabel = document.getElementById('countdown-label');
  if (countdownLabel) countdownLabel.textContent = t.countdownLabel;

  const scheduleEl = document.getElementById('schedule-value');
  if (scheduleEl) scheduleEl.textContent = formatSchedule(params.days, params.start, params.end);

  const hoursUnit = document.getElementById('hours-unit');
  if (hoursUnit) hoursUnit.textContent = t.timeUnits.hours;

  const minutesUnit = document.getElementById('minutes-unit');
  if (minutesUnit) minutesUnit.textContent = t.timeUnits.minutes;

  const secondsUnit = document.getElementById('seconds-unit');
  if (secondsUnit) secondsUnit.textContent = t.timeUnits.seconds;

  const motivationEl = document.getElementById('motivation');
  if (motivationEl) {
    const randomIndex = Math.floor(Math.random() * t.motivations.length);
    motivationEl.textContent = t.motivations[randomIndex] as string;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init(): void {
  const params = parseParams();

  // Detect language from storage or browser
  chrome.storage.sync.get(['lang'], (data) => {
    currentLang = detectLang((data as { lang?: string })['lang']);
    t = getMessages(currentLang);

    // Set site name
    const siteNameEl = document.getElementById('site-name') as HTMLElement;
    const displaySite = params.site || (currentLang === 'ko' ? '알 수 없는 사이트' : 'Unknown site');
    siteNameEl.textContent = displaySite;
    document.title = `${displaySite} — ${t.blockedTitle}`;

    applyI18n(params);

    // Start countdown + auto-redirect when block ends.
    // Tick-based: compute remaining seconds once, then decrement each second.
    // This avoids the "tomorrow" bug from Date-based getEndDateTime().
    let remaining = getSecondsUntilEnd(params.end);
    const intervalId = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      updateCountdown(remaining, params.originalUrl, intervalId);
    }, 1000);
    // Render immediately (before the first tick)
    updateCountdown(remaining, params.originalUrl, intervalId);
  });
}

document.addEventListener('DOMContentLoaded', init);
