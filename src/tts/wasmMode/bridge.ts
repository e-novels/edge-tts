export class WasmBridge {
  private isInitialized = false

  constructor(private novel: NovelExtensionApi) { }

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    // Option 1: Load ONNX/WASM binary model file from extension directory as a File object
    // const modelFile = (await this.novel.storage?.get('models/voice-model.onnx')) as File
    // const arrayBuffer = await modelFile.arrayBuffer()
    //
    // Option 2: Get a streaming virtual asset URL (novel-ext://... or blob:...)
    // const modelUrl = await this.novel.storage?.createAssetUrl('models/voice-model.onnx')
    // const response = await fetch(modelUrl!)
    // const arrayBuffer = await response.arrayBuffer()
    this.isInitialized = true
  }

  async getVoices(): Promise<ExtensionTTSGetVoicesResponse> {
    return {
      voices: [
        { id: 'wasm-onnx-vn', name: 'WASM ONNX Voice (Vietnamese)', lang: 'vi-VN' }
      ]
    }
  }

  async speak(request: ExtensionTTSSpeakRequest): Promise<ExtensionTTSSpeakResponse> {
    await this.initialize()

    // ONNX / WASM in-sandbox inference
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

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i)
    }
    return buffer
  }
}
