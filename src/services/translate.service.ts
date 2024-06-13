import { Translate } from '@google-cloud/translate/build/src/v2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language, TranslateResultDto } from 'src/dto/translate.dto';

@Injectable()
export class TranslateService {
  private translate: Translate;
  constructor(
    private readonly configService: ConfigService
  ) {
    this.translate = new Translate({
      key: configService.get<string>('GOOGLE_API_KEY'),
    })
  }

  async detectLanguage(text: string): Promise<string> {
    const [detection] = await this.translate.detect(text);
    return detection.language;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const [translation] = await this.translate.translate(text, targetLanguage);
    return translation;
  }

  async translateTextToAllLanguages(text: string): Promise<TranslateResultDto> {
    const language = await this.detectLanguage(text);
    const languages = Object.keys(Language)

    const response: TranslateResultDto = {
      originalText: text,
      originalLanguage: language as Language,
      translations: languages.reduce((acc, lang) => {
        if(lang !== language) {
          acc[Language[lang]] = "";
        }else{
          acc[Language[lang]] = text
        }
        return acc;
      }, {} as {[key in Language]: string})
    }
    await Promise.all(languages.map(async lang => {
      if(lang !== language) {
        response.translations[Language[lang]] = await this.translateText(text, Language[lang]);
      }
    }))
    return response;
  }
}
