import { getNovelApi } from './context'

export function getProgress(): ExtensionProgressApi {
  const api = getNovelApi()
  if (!api.progress) {
    throw new Error('Progress API is not available on novel instance.')
  }
  return api.progress
}

export const progress = {
  report(data: ExtensionProgressReportData): Promise<void> {
    return getProgress().report(data)
  }
}
