// src/i18n/languages.ts
export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag?: string; // 可選：國旗 emoji 或圖片路徑
}

export const languages: Language[] = [
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    // 你可以繼續加更多語言...
];

export const defaultLanguage = 'zh-TW';