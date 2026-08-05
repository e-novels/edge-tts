import { getNovelApi } from './context'

export const env = {
  get version(): string {
    return getNovelApi().version
  },
  get platform(): string {
    return getNovelApi().platform
  },
  get extensionId(): string {
    return getNovelApi().extension.id
  },
  get manifest(): Record<string, any> | undefined {
    return getNovelApi().extension.manifest
  }
}
