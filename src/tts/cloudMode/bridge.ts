import { edgeTTSClient } from '../core/client'
import { logger } from '../../utilities'

export class CloudBridge {
  constructor(private novel: NovelExtensionApi) {}

  async getVoices(): Promise<ExtensionTTSGetVoicesResponse> {
    return await edgeTTSClient.getVoices(this.novel.network, this.novel.storage)
  }

  async speak(request: ExtensionTTSSpeakRequest): Promise<ExtensionTTSSpeakResponse> {
    if (!request.text || !request.text.trim()) {
      return {
        audio: '',
        mimeType: 'audio/mp3'
      }
    }

    let defaultVoiceId = request.voiceId
    if (!defaultVoiceId && this.novel.storage) {
      try {
        const savedVoice = await this.novel.storage.get<string>('settings.voice')
        if (savedVoice && typeof savedVoice === 'string') {
          defaultVoiceId = savedVoice
        }
      } catch {}
    }

    return await edgeTTSClient.synthesize(
      request.text,
      defaultVoiceId,
      request.config,
      undefined,
      this.novel.network
    )
  }

  async stop(): Promise<ExtensionTTSStopResponse> {
    await logger.info('[EdgeTTS] Nhận lệnh dừng phát âm thanh.')
    return await edgeTTSClient.stop()
  }
}


