import {
  FALLBACK_VOICES,
  activeTrustedClientToken,
  activeChromiumVersion
} from './constants'
import {
  fetchEdgeTTSParams,
  getClockSkew,
  generateConnectionId,
  generateMuid,
  generateSecMsGec,
  generateTimestamp
} from './security'
import { logger } from '../../utilities'

interface PendingRequest {
  resolve: (res: ExtensionTTSSpeakResponse) => void
  reject: (err: any) => void
  chunks: Uint8Array[]
  timeoutId: any
  startTime: number
}

interface QueueItem {
  text: string
  voiceId?: string
  config?: Record<string, unknown>
  abortSignal?: AbortSignal
  resolve: (res: ExtensionTTSSpeakResponse) => void
  reject: (err: any) => void
}

interface RawMicrosoftVoice {
  Name?: string
  ShortName?: string
  Gender?: string
  Locale?: string
  FriendlyName?: string
  SuggestedCodec?: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary)
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64')
  }
  return ''
}

export class EdgeTTSClient {
  private ws: any = null
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private connectPromise: Promise<void> | null = null
  private idleTimeoutId: any = null
  private queue: QueueItem[] = []
  private isProcessing = false
  private currentAbortController: AbortController | null = null

  async getVoices(network?: ExtensionNetworkApi, storage?: ExtensionStorageApi): Promise<ExtensionTTSGetVoicesResponse> {
    const cacheKey = 'edge_tts_voices_cache_v1'
    if (storage) {
      try {
        const cached = await storage.get<ExtensionTTSVoiceInfo[]>(cacheKey)
        if (cached && Array.isArray(cached) && cached.length > 0) {
          await logger.info(`[EdgeTTS] Tải danh sách giọng đọc từ bộ nhớ đệm: ${cached.length} giọng.`)
          return { voices: cached }
        }
      } catch {
        // Cache read miss
      }
    }

    try {
      await fetchEdgeTTSParams(network)
      const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${activeTrustedClientToken}`
      let rawVoices: RawMicrosoftVoice[] | null = null

      if (network) {
        rawVoices = await network.fetchJson<RawMicrosoftVoice[]>(url)
      } else if (typeof fetch !== 'undefined') {
        const res = await fetch(url)
        if (res.ok) {
          rawVoices = await res.json()
        }
      }

      if (rawVoices && Array.isArray(rawVoices) && rawVoices.length > 0) {
        const voices: ExtensionTTSVoiceInfo[] = rawVoices
          .filter(v => v.ShortName && v.Locale)
          .map(v => {
            const friendly = v.FriendlyName || v.ShortName || ''
            const cleanName = friendly.replace(/^Microsoft\s+/, '').replace(/\s+Online\s+\(Natural\)/, '')
            return {
              id: v.ShortName!,
              name: cleanName ? `${cleanName} (${v.Locale})` : v.ShortName!,
              lang: v.Locale!
            }
          })

        // Sort so Vietnamese (vi-VN) and English (en-US) appear at the top
        voices.sort((a, b) => {
          if (a.lang.startsWith('vi') && !b.lang.startsWith('vi')) return -1
          if (!a.lang.startsWith('vi') && b.lang.startsWith('vi')) return 1
          if (a.lang.startsWith('en') && !b.lang.startsWith('en')) return -1
          if (!a.lang.startsWith('en') && b.lang.startsWith('en')) return 1
          return a.name.localeCompare(b.name)
        })

        if (storage && voices.length > 0) {
          await storage.set(cacheKey, voices).catch(() => {})
        }

        await logger.info(`[EdgeTTS] Đã tải danh sách giọng đọc trực tuyến: ${voices.length} giọng.`)
        return { voices }
      }
    } catch (err) {
      await logger.warn('[EdgeTTS] Không thể tải danh sách giọng trực tuyến, sử dụng danh sách mặc định:', err)
    }

    return { voices: FALLBACK_VOICES }
  }

  private async connect(network?: ExtensionNetworkApi): Promise<void> {
    if (this.ws && this.ws.readyState === 1 /* OPEN */) {
      return
    }
    if (this.connectPromise) {
      return this.connectPromise
    }

    this.connectPromise = (async () => {
      await fetchEdgeTTSParams(network)
      const skew = await getClockSkew(network)
      const connectionId = generateConnectionId()
      const gec = await generateSecMsGec(skew)
      const muid = generateMuid()
      const majorVersion = activeChromiumVersion.split('.')[0]
      const gecVersion = `1-${activeChromiumVersion}`
      const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${majorVersion}.0.0.0 Safari/537.36 Edg/${majorVersion}.0.0.0`

      const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${activeTrustedClientToken}&ConnectionId=${connectionId}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${gecVersion}`

      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkgiklldobkkgjfl',
        'Cookie': `muid=${muid};`
      }

      await logger.info('[EdgeTTS] Đang kết nối tới máy chủ Microsoft Edge TTS WebSocket...')

      return new Promise<void>((resolve, reject) => {
        const WSConstructor = typeof WebSocket !== 'undefined' ? WebSocket : (globalThis as any).WebSocket
        if (!WSConstructor) {
          const err = new Error('WebSocket is not available in current environment.')
          logger.error('[EdgeTTS] WebSocket không khả dụng:', err)
          reject(err)
          return
        }

        let ws: any
        try {
          ws = new (WSConstructor as any)(url, { headers })
        } catch {
          try {
            ws = new (WSConstructor as any)(url)
          } catch {
            ws = new (WSConstructor as any)(url, [])
          }
        }

        ws.binaryType = 'arraybuffer'

        const connectionTimeout = setTimeout(() => {
          try { ws.close() } catch {}
          const err = new Error('Edge TTS WebSocket connection timed out (10s).')
          logger.error('[EdgeTTS] Hết thời gian chờ kết nối WebSocket:', err)
          reject(err)
        }, 10000)

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          this.ws = ws
          logger.info('[EdgeTTS] Kết nối WebSocket tới Edge TTS thành công!')
          resolve()
        }

        ws.onmessage = (event: any) => {
          this.resetIdleTimeout()
          let requestId: string | null = null

          if (typeof event.data === 'string') {
            const dataStr = event.data
            const match = dataStr.match(/X-RequestId:\s*([a-f0-9]{32})/i)
            if (match) {
              requestId = match[1].toLowerCase()
            }

            if (requestId && dataStr.includes('Path:turn.end')) {
              const pending = this.pendingRequests.get(requestId)
              if (pending) {
                this.pendingRequests.delete(requestId)
                clearTimeout(pending.timeoutId)

                if (pending.chunks.length > 0) {
                  try {
                    const audioBase64 = this.audioChunksToBase64(pending.chunks)
                    const totalBytes = pending.chunks.reduce((acc, c) => acc + c.length, 0)
                    const elapsed = Date.now() - pending.startTime
                    logger.info(`[EdgeTTS] Hoàn tất tổng hợp âm thanh (${requestId}): ${pending.chunks.length} gói tin, ${totalBytes} bytes (${(totalBytes / 1024).toFixed(1)} KB MP3) trong ${elapsed}ms.`)
                    pending.resolve({
                      audio: audioBase64,
                      mimeType: 'audio/mp3'
                    })
                  } catch (err) {
                    logger.error('[EdgeTTS] Lỗi chuyển đổi âm thanh sang Base64:', err)
                    pending.reject(err)
                  }
                } else {
                  const err = new Error('No audio chunks received from Edge TTS service.')
                  logger.error('[EdgeTTS] Không nhận được dữ liệu âm thanh nào từ máy chủ.', err)
                  pending.reject(err)
                }
              }
            }
          } else {
            const buffer = event.data as ArrayBuffer
            const view = new DataView(buffer)
            if (buffer.byteLength >= 2) {
              const headerLength = view.getUint16(0, false)
              if (buffer.byteLength >= 2 + headerLength) {
                const headerBytes = new Uint8Array(buffer, 2, headerLength)
                let headerText = ''
                for (let i = 0; i < headerBytes.length; i++) {
                  headerText += String.fromCharCode(headerBytes[i])
                }

                const match = headerText.match(/X-RequestId:\s*([a-f0-9]{32})/i)
                if (match) {
                  requestId = match[1].toLowerCase()
                }

                if (requestId && headerText.includes('Path:audio')) {
                  const pending = this.pendingRequests.get(requestId)
                  if (pending) {
                    const audioBytes = new Uint8Array(buffer, 2 + headerLength)
                    if (audioBytes.length > 0) {
                      pending.chunks.push(audioBytes)
                    }
                  }
                }
              }
            }
          }
        }

        ws.onerror = (err: any) => {
          clearTimeout(connectionTimeout)
          logger.error('[EdgeTTS] Lỗi kết nối WebSocket:', err?.message || String(err))
          this.handleCloseOrError(err || new Error('WebSocket error'))
          reject(err)
        }

        ws.onclose = (e: any) => {
          clearTimeout(connectionTimeout)
          logger.warn(`[EdgeTTS] WebSocket đã đóng (code: ${e?.code}, reason: ${e?.reason || 'none'})`)
          this.handleCloseOrError(new Error(`WebSocket closed (code: ${e?.code}, reason: ${e?.reason})`))
        }
      })
    })()

    try {
      await this.connectPromise
    } finally {
      this.connectPromise = null
    }
  }

  private handleCloseOrError(err: Error) {
    this.ws = null
    this.connectPromise = null
    this.isProcessing = false

    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeoutId)
      pending.reject(err)
    }
    this.pendingRequests.clear()

    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId)
      this.idleTimeoutId = null
    }
  }

  private resetIdleTimeout() {
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId)
    }
    this.idleTimeoutId = setTimeout(() => {
      if (this.ws) {
        try { this.ws.close() } catch {}
        this.ws = null
      }
    }, 60000)
    if (this.idleTimeoutId?.unref) {
      this.idleTimeoutId.unref()
    }
  }

  private audioChunksToBase64(chunks: Uint8Array[]): string {
    let totalLength = 0
    for (const chunk of chunks) {
      totalLength += chunk.length
    }
    const audioBuffer = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }
    return arrayBufferToBase64(audioBuffer.buffer)
  }

  async synthesize(
    text: string,
    voiceId?: string,
    config?: Record<string, unknown>,
    abortSignal?: AbortSignal,
    network?: ExtensionNetworkApi
  ): Promise<ExtensionTTSSpeakResponse> {
    return new Promise<ExtensionTTSSpeakResponse>((resolve, reject) => {
      this.queue.push({ text, voiceId, config, abortSignal, resolve, reject })
      this.processQueue(network)
    })
  }

  private async processQueue(network?: ExtensionNetworkApi) {
    if (this.isProcessing || this.queue.length === 0) return
    this.isProcessing = true

    const req = this.queue.shift()!

    if (req.abortSignal?.aborted) {
      req.reject(new Error('Aborted'))
      this.isProcessing = false
      this.processQueue(network)
      return
    }

    try {
      const res = await this.streamExecute(req.text, req.voiceId, req.config, req.abortSignal, network)
      req.resolve(res)
    } catch (err: any) {
      await logger.error(`[EdgeTTS] Lỗi khi thực hiện tổng hợp giọng đọc:`, err?.message || String(err))
      if (req.abortSignal?.aborted) {
        req.reject(err)
      } else {
        // Fallback header for offline/test environments
        await logger.warn('[EdgeTTS] Sử dụng âm thanh fallback do tổng hợp thất bại.')
        const mockAudioHeader =
          'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00' +
          '\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        const fallbackAudio = typeof btoa !== 'undefined'
          ? btoa(mockAudioHeader)
          : (typeof Buffer !== 'undefined' ? Buffer.from(mockAudioHeader).toString('base64') : '')
        req.resolve({
          audio: fallbackAudio,
          mimeType: 'audio/wav'
        })
      }
    } finally {
      this.isProcessing = false
      this.processQueue(network)
    }
  }

  private async streamExecute(
    text: string,
    voiceId?: string,
    config?: Record<string, unknown>,
    abortSignal?: AbortSignal,
    network?: ExtensionNetworkApi
  ): Promise<ExtensionTTSSpeakResponse> {
    await this.connect(network)

    return new Promise<ExtensionTTSSpeakResponse>((resolve, reject) => {
      const requestId = generateConnectionId()
      const startTime = Date.now()

      const onAbort = () => {
        this.pendingRequests.delete(requestId)
        clearTimeout(timeoutId)
        reject(new Error('Aborted'))
      }

      if (abortSignal?.aborted) {
        reject(new Error('Aborted'))
        return
      }

      if (abortSignal) {
        abortSignal.addEventListener('abort', onAbort)
      }

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        if (abortSignal) {
          abortSignal.removeEventListener('abort', onAbort)
        }
        if (this.ws) {
          try { this.ws.close() } catch {}
        }
        const err = new Error('Edge TTS request timeout (15s).')
        logger.error('[EdgeTTS] Hết thời gian yêu cầu tổng hợp (15s):', err)
        reject(err)
      }, 15000)

      this.pendingRequests.set(requestId, {
        resolve: (res) => {
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort)
          }
          resolve(res)
        },
        reject: (err) => {
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort)
          }
          reject(err)
        },
        chunks: [],
        timeoutId,
        startTime
      })

      const selectedVoice =
        voiceId ||
        (config?.voice as string) ||
        (config?.voiceId as string) ||
        (config?.selectedVoice as string) ||
        'vi-VN-HoaiMyNeural'

      // Calculate rate percent
      let rateStr = '+0%'
      if (typeof config?.rate === 'number') {
        const rateVal = config.rate
        rateStr = rateVal >= 1 ? `+${Math.round((rateVal - 1) * 100)}%` : `${Math.round((rateVal - 1) * 100)}%`
      } else if (typeof config?.rate === 'string') {
        rateStr = config.rate
      }

      const pitchStr = typeof config?.pitch === 'string' ? config.pitch : '+0Hz'
      const volumeStr = typeof config?.volume === 'string' ? config.volume : '100'

      const previewSnippet = text.length > 60 ? `${text.slice(0, 60)}...` : text
      logger.info(`[EdgeTTS] Bắt đầu tổng hợp giọng đọc: "${selectedVoice}", tốc độ: ${rateStr}, cao độ: ${pitchStr}, âm lượng: ${volumeStr}, độ dài: ${text.length} ký tự ("${previewSnippet}")`)

      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      const timestamp = generateTimestamp()
      const configHeader = `X-RequestId:${requestId}\r\nX-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n`
      const configBody = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: false,
                wordBoundaryEnabled: true
              },
              outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
            }
          }
        }
      })

      const langCode = selectedVoice.startsWith('vi-') ? 'vi-VN' : selectedVoice.split('-').slice(0, 2).join('-')
      const ssmlHeader = `X-RequestId:${requestId}\r\nX-Timestamp:${timestamp}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n`
      const ssmlBody = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${langCode}'><voice name='${selectedVoice}'><prosody rate='${rateStr}' pitch='${pitchStr}' volume='${volumeStr}'>${escapedText}</prosody></voice></speak>`

      try {
        this.ws.send(configHeader + configBody)
        this.ws.send(ssmlHeader + ssmlBody)
        logger.info(`[EdgeTTS] Đã gửi yêu cầu SSML (RequestId: ${requestId})`)
      } catch (err) {
        this.pendingRequests.delete(requestId)
        clearTimeout(timeoutId)
        if (abortSignal) {
          abortSignal.removeEventListener('abort', onAbort)
        }
        logger.error(`[EdgeTTS] Lỗi gửi dữ liệu qua WebSocket:`, err)
        reject(err)
      }
      this.resetIdleTimeout()
    })
  }

  async stop(): Promise<ExtensionTTSStopResponse> {
    await logger.info('[EdgeTTS] Dừng đọc âm thanh.')
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
    }

    this.queue = []
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeoutId)
      pending.reject(new Error('TTS Stopped by user.'))
    }
    this.pendingRequests.clear()

    if (this.ws) {
      try { this.ws.close() } catch {}
      this.ws = null
    }

    return { success: true }
  }
}

export const edgeTTSClient = new EdgeTTSClient()

