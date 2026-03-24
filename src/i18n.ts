export type Lang = 'ko' | 'en';

export interface Messages {
  // popup
  appTitle: string;
  globalLabel: string;
  rulesSection: string;
  addSection: string;
  emptyState: string;
  urlLabel: string;
  urlPlaceholder: string;
  daysLabel: string;
  timeLabel: string;
  addBtn: string;
  deleteAriaLabel: string;
  editAriaLabel: string;
  saveBtn: string;
  cancelBtn: string;
  days: [string, string, string, string, string, string, string]; // 일~토
  alertSelectDay: string;
  // blocked
  blockedTitle: string;
  blockedSubtitle: string;
  scheduleLabel: string;
  countdownLabel: string;
  timeUnits: { hours: string; minutes: string; seconds: string };
  everyday: string;
  weekdays: string;
  weekend: string;
  motivations: string[];
}

const ko: Messages = {
  appTitle: '🚫 Site Blocker',
  globalLabel: '전체',
  rulesSection: '차단 규칙',
  addSection: '규칙 추가',
  emptyState: '아직 차단 규칙이 없습니다',
  urlLabel: '사이트 URL',
  urlPlaceholder: '예: youtube.com',
  daysLabel: '차단 요일',
  timeLabel: '차단 시간',
  addBtn: '+ 규칙 추가',
  deleteAriaLabel: '삭제',
  editAriaLabel: '편집',
  saveBtn: '저장',
  cancelBtn: '취소',
  days: ['일', '월', '화', '수', '목', '금', '토'],
  alertSelectDay: '최소 하나의 요일을 선택해주세요.',
  blockedTitle: '현재 이 사이트는 차단되어 있습니다',
  blockedSubtitle: '지금은 이 사이트에 접근할 수 없습니다.',
  scheduleLabel: '차단 스케줄',
  countdownLabel: '해제까지 남은 시간',
  timeUnits: { hours: '시간', minutes: '분', seconds: '초' },
  everyday: '매일',
  weekdays: '월~금',
  weekend: '주말',
  motivations: [
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
  ],
};

const en: Messages = {
  appTitle: '🚫 Site Blocker',
  globalLabel: 'All',
  rulesSection: 'Block Rules',
  addSection: 'Add Rule',
  emptyState: 'No block rules yet',
  urlLabel: 'Site URL',
  urlPlaceholder: 'e.g. youtube.com',
  daysLabel: 'Block Days',
  timeLabel: 'Block Time',
  addBtn: '+ Add Rule',
  deleteAriaLabel: 'Delete',
  editAriaLabel: 'Edit',
  saveBtn: 'Save',
  cancelBtn: 'Cancel',
  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  alertSelectDay: 'Please select at least one day.',
  blockedTitle: 'This site is currently blocked',
  blockedSubtitle: 'You cannot access this site right now.',
  scheduleLabel: 'Block Schedule',
  countdownLabel: 'Time Until Unblocked',
  timeUnits: { hours: 'hrs', minutes: 'min', seconds: 'sec' },
  everyday: 'Every day',
  weekdays: 'Mon–Fri',
  weekend: 'Weekend',
  motivations: [
    'This moment of focus is building your future self.',
    'The urge to procrastinate is a signal you\'re growing.',
    'One hour of deep focus can change your whole day.',
    'Resist now, be free later.',
    'Great results are born from deep concentration.',
    'The internet will still be there. This moment won\'t.',
    'Today\'s you is stronger than yesterday\'s.',
    'Focus is the most powerful productivity tool you have.',
    'Every small resistance builds a stronger habit.',
    'Your brain can\'t multitask. Give it one thing.',
  ],
};

const MESSAGES: Record<Lang, Messages> = { ko, en };

export function detectLang(stored?: string): Lang {
  if (stored === 'ko' || stored === 'en') return stored;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

export function getMessages(lang: Lang): Messages {
  return MESSAGES[lang];
}
