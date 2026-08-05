import { getNovelApi } from './context'

export function getStorage(): ExtensionStorageApi {
  const api = getNovelApi()
  if (!api.storage) {
    throw new Error('This extension requires the storage permission.')
  }
  return api.storage
}

export const storage = {
  get<T = unknown>(key: string): Promise<T | File | null> {
    return getStorage().get<T>(key)
  },
  set(key: string, value: unknown): Promise<void> {
    return getStorage().set(key, value)
  },
  remove(key: string): Promise<void> {
    return getStorage().remove(key)
  },
  createAssetUrl(relativePath: string): Promise<string | null> {
    return getStorage().createAssetUrl(relativePath)
  }
}
