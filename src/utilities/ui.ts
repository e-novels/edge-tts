import { getNovelApi } from './context'

export const ui = {
  applyTheme(variables: Partial<Record<ThemeVariableName, string>>): Promise<void> {
    const api = getNovelApi()
    if (!api.ui) {
      throw new Error('This theme requires the ui.theme permission.')
    }
    return api.ui.applyTheme(variables)
  }
}
