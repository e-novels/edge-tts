import { CloudBridge } from './cloudMode/bridge'
import { logger } from '../utilities'

export async function activateTTS(novel: NovelExtensionApi): Promise<void> {
  if (!novel.tts) return

  const bridge = new CloudBridge(novel)
  await novel.tts.register({
    getVoices: async () => {
      await logger.info('[EdgeTTS] Đang lấy danh sách giọng đọc...')
      const res = await bridge.getVoices()
      await logger.info(`[EdgeTTS] Trả về danh sách gồm ${res.voices?.length || 0} giọng đọc.`)
      return res
    },
    speak: async (params: ExtensionTTSSpeakRequest) => {
      await logger.info(`[EdgeTTS] Nhận yêu cầu đọc văn bản (voiceId: ${params.voiceId || 'mặc định'}, độ dài: ${params.text?.length || 0} ký tự)...`)
      const res = await bridge.speak(params)
      await logger.info(`[EdgeTTS] Hoàn tất yêu cầu đọc văn bản. Kích thước audio base64: ${res.audio?.length || 0} ký tự.`)
      return res
    },
    stop: async () => {
      await logger.info('[EdgeTTS] Nhận yêu cầu dừng phát giọng đọc.')
      return await bridge.stop()
    }
  })

  if (novel.settings) {
    await novel.settings.register({
      previewVoice: async (fieldValues: Record<string, unknown>) => {
        const voiceId = typeof fieldValues.voice === 'string' && fieldValues.voice ? fieldValues.voice : undefined
        const previewText =
          typeof fieldValues.previewText === 'string' && fieldValues.previewText.trim()
            ? fieldValues.previewText.trim()
            : 'Xin chào! Đây là giọng đọc thử nghiệm của Microsoft Edge TTS trên E-Novel.'

        await logger.info(`[EdgeTTS] Nhận yêu cầu nghe thử giọng đọc: voice="${voiceId || 'vi-VN-HoaiMyNeural'}", nội dung="${previewText}"`)

        try {
          const result = await bridge.speak({
            text: previewText,
            voiceId
          })

          if (!result.audio || result.audio.length <= 100) {
            await logger.error('[EdgeTTS] Nghe thử thất bại: Không nhận được dữ liệu âm thanh hợp lệ từ Edge TTS.')
            return {
              success: false,
              message: 'Không nhận được dữ liệu âm thanh từ máy chủ Microsoft Edge TTS. Vui lòng kiểm tra kết nối mạng.'
            }
          }

          const audioSizeKb = (result.audio.length * 3 / 4 / 1024).toFixed(1)
          await logger.info(`[EdgeTTS] Nghe thử giọng đọc thành công: ${audioSizeKb} KB (${result.mimeType || 'audio/mp3'}).`)

          return {
            success: true,
            message: `Phát thử âm thanh thành công (${voiceId || 'vi-VN-HoaiMyNeural'} - ${audioSizeKb} KB)`,
            audio: result.audio,
            mimeType: result.mimeType || 'audio/mp3'
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err)
          await logger.error(`[EdgeTTS] Lỗi nghe thử giọng đọc:`, errMsg)
          return {
            success: false,
            message: `Lỗi phát thử âm thanh: ${errMsg}`
          }
        }
      }
    })
  }
}

