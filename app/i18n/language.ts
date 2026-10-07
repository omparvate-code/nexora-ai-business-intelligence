import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, LanguageCode,
} from "./config";
export function getStoredLanguage(): LanguageCode { if (typeof 
  window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const saved = localStorage.getItem( LANGUAGE_STORAGE_KEY ); if 
  (!saved) {
    return DEFAULT_LANGUAGE;
  }
  return saved as LanguageCode;
}
export function setStoredLanguage( language: LanguageCode ) { if 
  (typeof window === "undefined") {
    return;
  }
  localStorage.setItem( LANGUAGE_STORAGE_KEY, language ); 
  window.dispatchEvent(
    new Event("nexora-language-change") );
}


