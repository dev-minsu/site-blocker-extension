const MOTIVATIONS: string[] = [
  '지금 이 순간에 집중하세요. 당신은 더 중요한 일을 하고 있습니다.',
  '딥 워크는 슈퍼파워입니다. 지금 그 힘을 키우고 있어요.',
  '작은 집중이 쌓여 큰 성과가 됩니다.',
  '방해 없는 한 시간이 분산된 하루보다 값집니다.',
  '미래의 나에게 감사받을 선택을 하고 있습니다.',
  '지금 참는 것이 나중의 자유를 만듭니다.',
  '목표에 집중하세요. 모든 것은 그 후에 있습니다.',
];

const DAY_NAMES: string[] = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseDays(daysParam: string): number[] {
  return daysParam.split(',').map((d) => parseInt(d.trim(), 10)).filter((d) => !isNaN(d));
}

function formatDays(days: number[]): string {
  if (days.length === 0) return '';

  // Common shorthand patterns
  const sorted = [...days].sort((a, b) => a - b);

  if (sorted.join(',') === '1,2,3,4,5') return '월~금';
  if (sorted.join(',') === '0,6') return '주말';
  if (sorted.join(',') === '0,1,2,3,4,5,6') return '매일';

  // Check for consecutive range
  let isRange = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) { isRange = false; break; }
  }
  if (isRange && sorted.length > 2) {
    return `${DAY_NAMES[sorted[0]]}~${DAY_NAMES[sorted[sorted.length - 1]]}`;
  }

  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

/** Returns seconds until end time today, or seconds until next block starts */
function getSecondsUntilUnblock(
  endHour: number,
  endMinute: number,
  days: number[],
): number {
  const now = new Date();
  const currentDay = now.getDay();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const endSeconds = endHour * 3600 + endMinute * 60;

  // If today is a blocked day and we haven't passed end time yet
  if (days.includes(currentDay) && currentSeconds < endSeconds) {
    return endSeconds - currentSeconds;
  }

  // Find next blocked day
  for (let delta = 1; delta <= 7; delta++) {
    const nextDay = (currentDay + delta) % 7;
    if (days.includes(nextDay)) {
      // Seconds until end of that day's block
      const secondsToMidnight = 86400 - currentSeconds;
      const secondsInFutureDays = (delta - 1) * 86400;
      return secondsToMidnight + secondsInFutureDays + endSeconds;
    }
  }

  return 0;
}

function updateCountdown(endHour: number, endMinute: number, days: number[]): void {
  const totalSeconds = getSecondsUntilUnblock(endHour, endMinute, days);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const hoursEl = document.getElementById('cdHours');
  const minutesEl = document.getElementById('cdMinutes');
  const secondsEl = document.getElementById('cdSeconds');

  if (hoursEl) hoursEl.textContent = pad(h);
  if (minutesEl) minutesEl.textContent = pad(m);
  if (secondsEl) secondsEl.textContent = pad(s);
}

function init(): void {
  const params = new URLSearchParams(window.location.search);

  const site = params.get('site') ?? '사이트';
  const startParam = params.get('start') ?? '09:00';
  const endParam = params.get('end') ?? '18:00';
  const daysParam = params.get('days') ?? '1,2,3,4,5';

  // Parse times
  const [startHour, startMinute] = startParam.split(':').map(Number);
  const [endHour, endMinute] = endParam.split(':').map(Number);
  const days = parseDays(daysParam);

  // Site name
  const siteEl = document.getElementById('siteName');
  if (siteEl) siteEl.textContent = site;

  // Schedule text
  const scheduleEl = document.getElementById('scheduleText');
  if (scheduleEl) {
    const dayStr = formatDays(days);
    scheduleEl.textContent = `${dayStr} ${pad(startHour)}:${pad(startMinute)} - ${pad(endHour)}:${pad(endMinute)}`;
  }

  // Random motivation
  const motivationEl = document.getElementById('motivationText');
  if (motivationEl) {
    const idx = Math.floor(Math.random() * MOTIVATIONS.length);
    motivationEl.textContent = MOTIVATIONS[idx];
  }

  // Start countdown
  updateCountdown(endHour, endMinute, days);
  setInterval(() => updateCountdown(endHour, endMinute, days), 1000);
}

document.addEventListener('DOMContentLoaded', init);

export {};
