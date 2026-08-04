interface TranslateRequest {
  paragraphs: string[]
  sourceLang?: string
  targetLang?: string
  config?: Record<string, unknown>
}

interface TranslateResponse {
  translatedParagraphs: string[]
}

interface TranslatorGetLanguagesResponse {
  sourceLanguages: string[]
  targetLanguages: string[]
}

interface ExtensionTranslatorApi {
  register(handlers: {
    translate(request: TranslateRequest): ExtensionMaybePromise<TranslateResponse>
    getLanguages?(): ExtensionMaybePromise<TranslatorGetLanguagesResponse>
  }): Promise<void>
}
