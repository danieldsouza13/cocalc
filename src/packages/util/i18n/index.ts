/*
 *  This file is part of CoCalc: Copyright © 2024 Sagemath, Inc.
 *  License: MS-RSL – see LICENSE.md for details
 */


// ATTN: these languages have to match the frontend/package.json script "i18n:download",
//       be valid for Antd (<AntdConfigProvider localize.../>),
//       and also harmonize with localize::loadLocaleData
export const LOCALE = [
    "en", // that's the default, i.e. user never explicitly selected a language
    "es",
    "de",
    "zh",
    "ru",
    "fr",
    "it",
    "ja",
    "hi",
    "pt",
    "ko",
    "pl",
    "tr",
    "he",
    "hu",
    "ar",
  ] as const;

  export type Locale = (typeof LOCALE)[number];

  export const NAMES: { [key in Locale]: string } = {
    en: "English",
    es: "Spanish",
    de: "German",
    zh: "Chinese",
    ru: "Russian",
    fr: "French",
    it: "Italian",
    ja: "Japanese",
    hi: "Hindi",
    pt: "Portuguese",
    ko: "Korean",
    pl: "Polish",
    tr: "Turkish",
    he: "Hebrew",
    hu: "Hungarian",
    ar: "Arabic",
  } as const;

  export const DEFAULT_LOCALE: Locale = "en";

  // user's browser is not english, but user wants to keep english
  // this is only for the account's other_settings and maps to "en"
  export const KEEP_EN_LOCALE = "en-keep";

  export const OTHER_SETTINGS_LOCALE_KEY = "i18n";
