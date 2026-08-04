const TEMPLATE_THEME: Partial<Record<ThemeVariableName, string>> = {
  'color-bg-base': '#f4f7f9',
  'color-bg-primary': '#ffffff',
  'color-bg-secondary': '#e7edf1',
  'color-text-primary': '#1f2933',
  'color-text-secondary': '#52606d',
  'color-border-default': '#bcccdc',
  'color-brand': '#126782',
  'color-brand-default': '#126782',
  'color-brand-hover': '#0c4a60',
  'color-brand-active': '#083b4c',
  'color-brand-text': '#ffffff',
  'color-accent-default': '#b45309',
  'color-success-fg': '#237a57',
  'color-warning-fg': '#9c6b12',
  'color-danger-fg': '#b42318',
  'color-info-fg': '#126782'
}

export async function activateTheme(novel: NovelExtensionApi): Promise<void> {
  if (!novel.ui) throw new Error('This theme requires the ui.theme permission.')
  await novel.ui.applyTheme(TEMPLATE_THEME)
}