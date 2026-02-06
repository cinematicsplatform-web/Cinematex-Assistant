import { AppSettings } from '../types';

const SETTINGS_KEY = 'cinematex_settings';

const DEFAULT_IGNORED = [
  'EgyBest', 'ArabSeed', 'Cima4u', 'MyCima', 'WeCima', 'Akwam', 'Shahid4u', 
  'Cima Now CoM', 'CimaNow', 'www.', '.com', '.net', '.org'
];

const DEFAULT_SETTINGS: AppSettings = {
  uqloadApiKey: '150390klo47yxemdrsky1o',
  filenamePrefix: 'Cinematix_',
  ignoredKeywords: DEFAULT_IGNORED
};

export const getSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      ignoredKeywords: Array.isArray(parsed.ignoredKeywords) ? parsed.ignoredKeywords : DEFAULT_IGNORED
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};