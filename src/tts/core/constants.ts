export let activeTrustedClientToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
export let activeChromiumVersion = '143.0.3650.75'

export function updateTrustedClientToken(token: string) {
  activeTrustedClientToken = token
}

export function updateChromiumVersion(version: string) {
  activeChromiumVersion = version
}

export const FALLBACK_VOICES: ExtensionTTSVoiceInfo[] = [
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ) - Tiếng Việt', lang: 'vi-VN' },
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam) - Tiếng Việt', lang: 'vi-VN' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Female) - English (US)', lang: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (Male) - English (US)', lang: 'en-US' },
  { id: 'en-US-AriaNeural', name: 'Aria (Female) - English (US)', lang: 'en-US' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (Female) - Japanese', lang: 'ja-JP' },
  { id: 'ja-JP-KeitaNeural', name: 'Keita (Male) - Japanese', lang: 'ja-JP' },
  { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (Female) - Chinese', lang: 'zh-CN' },
  { id: 'zh-CN-YunxiNeural', name: 'Yunxi (Male) - Chinese', lang: 'zh-CN' },
  { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi (Female) - Korean', lang: 'ko-KR' },
  { id: 'ko-KR-InJoonNeural', name: 'InJoon (Male) - Korean', lang: 'ko-KR' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (Female) - French', lang: 'fr-FR' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (Female) - German', lang: 'de-DE' }
]
