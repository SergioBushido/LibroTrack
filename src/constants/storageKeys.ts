export const STORAGE_KEYS = {
  BOOKS: 'lecturas_books',
  GOAL: 'lecturas_reto_goal',
  THEME: 'lecturas_theme_mode',
  BOOKS_SORT: 'lecturas_books_sort',
  REMINDER_SETTINGS: 'lecturas_reminder_settings',
  CLOUD_META: 'lecturas_cloud_backup_meta',
  CLOUD_TOKEN: 'librotrack_github_gist_token',
} as const;

export const DEFAULT_READING_GOAL = 20;

export const parseReadingGoal = (
  raw: string | null | undefined,
  fallback: number = DEFAULT_READING_GOAL,
): number => {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return fallback;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};
