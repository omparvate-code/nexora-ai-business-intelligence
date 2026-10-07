export type LanguageCode =
  | "en"
  | "hi"
  | "mr"
  | "bn"
  | "gu"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "ur"
  | "or"
  | "as";

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { code: "hi", name: "Hindi", nativeName: "\u0939\u093F\u0928\u094D\u0926\u0940", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "mr", name: "Marathi", nativeName: "\u092E\u0930\u093E\u0920\u0940", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "bn", name: "Bengali", nativeName: "\u09AC\u09BE\u0982\u09B2\u09BE", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "gu", name: "Gujarati", nativeName: "\u0A97\uAC1C\u0A9C\u0AC1\u0AB0\u0ABE\u0AA4\u0AC0", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "ta", name: "Tamil", nativeName: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "te", name: "Telugu", nativeName: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "kn", name: "Kannada", nativeName: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "ml", name: "Malayalam", nativeName: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "pa", name: "Punjabi", nativeName: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "ur", name: "Urdu", nativeName: "\u0627\u0631\u062F\u0648", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "or", name: "Odia", nativeName: "\u0B13\u0B21\u0B3C\u0B3F\u0B06", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
  { code: "as", name: "Assamese", nativeName: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE", flag: "\uD83C\uDDEE\uD83C\uDDE3" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "nexora_language";
