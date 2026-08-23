import { getNovelApi } from './context'

export const logger = {
  async info(...values: ExtensionLogValue[]): Promise<void> {
    try {
      console.log(...values)
      const api = getNovelApi()
      if (api?.logger?.info) {
        await api.logger.info(...values)
      }
    } catch {}
  },
  async warn(...values: ExtensionLogValue[]): Promise<void> {
    try {
      console.warn(...values)
      const api = getNovelApi()
      if (api?.logger?.warn) {
        await api.logger.warn(...values)
      }
    } catch {}
  },
  async error(...values: ExtensionLogValue[]): Promise<void> {
    try {
      console.error(...values)
      const api = getNovelApi()
      if (api?.logger?.error) {
        await api.logger.error(...values)
      }
    } catch {}
  }
}

