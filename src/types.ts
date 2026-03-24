export interface BlockRule {
  id: string;
  urlPattern: string; // e.g. "youtube.com", "instagram.com"
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  enabled: boolean;
}

export type Lang = 'ko' | 'en';

export interface StorageData {
  rules: BlockRule[];
  globalEnabled: boolean;
  lang: Lang;
}
