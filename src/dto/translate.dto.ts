export enum Language {
    ENGLISH = "en",
    SPANISH = "es",
    FRENCH = "fr",
    GERMAN = "de",
    ITALIAN = "it",
    PORTUGUESE_PORTUGAL = "pt-PT",
    PORTUGUESE_BRAZIL = "pt-BR",
    RUSSIAN = "ru",
    JAPANESE = "ja",
    CHINESE_CHINA = "zh-CN",
    CHINESE_TAIWAN = "zh-TW",
    KOREAN = "ko",
    ARABIC = "ar",
    HINDI = "hi",
    TURKISH = "tr",
    DUTCH = "nl",
    POLISH = "pl",
    UKRAINIAN = "uk",
    GREEK = "el",
    INDONESIAN = "id",
    SWEDISH = "sv",
    CZECH = "cs",
    FINNISH = "fi",
    ROMANIAN = "ro",
    NORWEGIAN = "no",
    BULGARIAN = "bg",
    SERBIAN = "sr",
    CROATIAN = "hr",
    BOSNIAN = "bs",
    SLOVENIAN = "sl",
}

export class TranslateResultDto {
    originalText: string;
    originalLanguage: Language;
    translations: {
        [key in Language]: string;
    }
}