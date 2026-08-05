import { getNovelApi } from './context'

export function getSettings(): ExtensionSettingsApi {
  return getNovelApi().settings
}

export const settings = {
  register(
    handlers: Record<
      string,
      (values: Record<string, unknown>) => ExtensionSettingsActionResult | Promise<ExtensionSettingsActionResult>
    >
  ): Promise<void> {
    return getSettings().register(handlers)
  }
}
