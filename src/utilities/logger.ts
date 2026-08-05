import { getNovelApi } from './context'

export const logger = {
  info(...values: ExtensionLogValue[]): Promise<void> {
    return getNovelApi().logger.info(...values)
  },
  warn(...values: ExtensionLogValue[]): Promise<void> {
    return getNovelApi().logger.warn(...values)
  },
  error(...values: ExtensionLogValue[]): Promise<void> {
    return getNovelApi().logger.error(...values)
  }
}
