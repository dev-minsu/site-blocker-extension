const MOTIVATIONS: string[] = [
  '지금 이 순간의 집중이 미래의 나를 만듭니다.',
  '딴짓하고 싶은 마음, 그게 바로 성장의 신호입니다.',
  '한 시간의 집중이 하루를 바꿉니다.',
  '지금 참으면 나중에 자유롭습니다.',
  '위대한 결과는 깊은 집중에서 태어납니다.',
  '인터넷은 나중에도 있습니다. 지금 이 기회는 지금뿐입니다.',
  '오늘의 나는 어제의 나보다 강합니다.',
  '집중은 가장 강력한 생산성 도구입니다.',
  '작은 저항을 이겨내는 것이 습관을 만듭니다.',
  '뇌는 멀티태스킹이 불가능합니다. 하나에 집중하세요.',
];

const DAY_LABELS: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

function parseParams(): {
  site: string;
  start: string;
  end: string;
  days: number[];
} {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site') ?? '알 수 없는 사이트';
  const start = params.get('start') ?? '00:00';
  const end = params.get('end') ?? '24:00';
  const daysStr = params.get('days') ?? '';
  const days = daysStr
    ? daysStr
        .split(',')
        .map((d) => parseInt(d, 10))
        .filter((d) => !isNaN(d))
    : [];

  return { site, start, end, days };
}

function formatSchedule(days: number[], start: string, end: string): string {
  let dayStr: string;

  if (days.length === 0) {
    dayStr = '매일';
  } else if (days.length === 7) {
    dayStr = '매일';
  } else if (
    days.length === 5 &&
    days.includes(1) &&
    days.includes(2) &&
    days.includes(3) &&
    days.includes(4) &&
    days.includes(5)
  ) {
    dayStr = '월~금';
  } else if (days.length === 2 && days.includes(0) && days.includes(6)) {
    dayStr = '주말';
  } else if (days.length >= 2) {
    const sorted = [...days].sort((a, b) => a - b);
    // Check if consecutive
    const isConsecutive = sorted.every(
      (d, i) => i === 0 || d === (sorted[i - 1] as number) + 1
    );
    if (isConsecutive) {
      dayStr = `${DAY_LABELS[sorted[0] as number]}~${DAY_LABELS[sorted[sorted.length - 1] as number]}`;
    } else {
      dayStr = sorted.map((d) => DAY_LABELS[d]).join('·');
    }
  } else {
    dayStr = days.map((d) => DAY_LABELS[d]).join('·');
  }

  return `${dayStr} ${start}–${end}`;
}

function getEndDateTime(endTime: string): Date {
  const now = new Date();
  const [hours, minutes] = endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(hours as number, minutes as number, 0, 0);

  // If end time has already passed today, it ends tomorrow
  if (end <= now) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function updateCountdown(endDate: Date): void {
  const now = new Date();
  let diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));

  const hoursEl = document.getElementById('hours') as HTMLElement;
  const minutesEl = document.getElementById('minutes') as HTMLElement;
  const secondsEl = document.getElementById('seconds') as HTMLElement;

  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = diff - m * 60;

  hoursEl.textContent = pad(h);
  minutesEl.textContent = pad(m);
  secondsEl.textContent = pad(s);
}

function init(): void {
  const { site, start, end, days } = parseParams();

  // Set site name
  const siteNameEl = document.getElementById('site-name') as HTMLElement;
  siteNameEl.textContent = site;
  document.title = `${site} — 접근 차단됨`;

  // Set schedule
  const scheduleEl = document.getElementById('schedule-value') as HTMLElement;
  scheduleEl.textContent = formatSchedule(days, start, end);

  // Set random motivation
  const motivationEl = document.getElementById('motivation') as HTMLElement;
  const randomIndex = Math.floor(Math.random() * MOTIVATIONS.length);
  motivationEl.textContent = MOTIVATIONS[randomIndex] as string;

  // Start countdown
  const endDate = getEndDateTime(end);
  updateCountdown(endDate);
  setInterval(() => updateCountdown(endDate), 1000);
}

document.addEventListener('DOMContentLoaded', init);
