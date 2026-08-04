export class CloudBridge {
  constructor(private novel: NovelExtensionApi) { }

  async getVoices(): Promise<ExtensionTTSGetVoicesResponse> {
    return {
      voices: [
        { id: 'vbee-hn-female', name: 'Vbee Hanoi Female', lang: 'vi-VN' },
        { id: 'vbee-sg-male', name: 'Vbee Saigon Male', lang: 'vi-VN' }
      ]
    }
  }

  async speak(request: ExtensionTTSSpeakRequest): Promise<ExtensionTTSSpeakResponse> {
    // Cloud API extensions execute novel.network fetch request
    // Example: Vbee, ElevenLabs, Google Cloud TTS
    const mockAudioHeader =
      'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00' +
      '\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'

    return {
      audio: btoa(mockAudioHeader),
      mimeType: 'audio/wav'
    }
  }

  async stop(): Promise<ExtensionTTSStopResponse> {
    return { success: true }
  }
}
