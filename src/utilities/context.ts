let activeApi: NovelExtensionApi | null = null

export function initExtensionApi(api: NovelExtensionApi): void {
  activeApi = api
}

export function isNovelApiInitialized(): boolean {
  return activeApi !== null
}

export function getNovelApi(): NovelExtensionApi {
  if (!activeApi) {
    throw new Error(
      'Extension API context is not initialized. Make sure initExtensionApi(novel) is called inside activate().'
    )
  }
  return activeApi
}

export function resetExtensionApiForTest(): void {
  activeApi = null
}
