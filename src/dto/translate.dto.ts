import { ApiProperty } from "@nestjs/swagger";

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
    @ApiProperty({ 
        type: "object",
        example: Object.keys(Language).reduce((acc, lang) => {
            acc[Language[lang as Language]] = "";
            return acc;
        }, {} as {[key in Language]: string}),
        description: "It contains the translations of the original text in different languages as key-value pairs. The key is the language code and the value is the translated text."
    })
    translations: Record<Language, string>;
}