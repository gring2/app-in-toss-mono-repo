import type { KeywordsData } from './types/keyword.type';

const EMPTY_KEYWORDS_DATA: KeywordsData = {
  generated_at: '1970-01-01T00:00:00.000Z',
  keywords: {},
};

export class KeywordService {
  protected _keywordsData: KeywordsData = EMPTY_KEYWORDS_DATA;

  async init(): Promise<void> {
    this._keywordsData = EMPTY_KEYWORDS_DATA;
  }

  destroy(): void {
    // no-op: V1 runs fully local without remote keyword APIs
  }

  async fetchKeywords(): Promise<void> {
    this._keywordsData = EMPTY_KEYWORDS_DATA;
  }

  getSprite(_marbleName: string): CanvasImageSource | undefined {
    return undefined;
  }
}
