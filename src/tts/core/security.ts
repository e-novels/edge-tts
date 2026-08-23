import {
  activeTrustedClientToken,
  activeChromiumVersion,
  updateTrustedClientToken,
  updateChromiumVersion
} from './constants'

let hasFetchedParams = false
let cachedClockSkew: number | null = null
let lastSkewFetchTime = 0

export async function fetchEdgeTTSParams(network?: ExtensionNetworkApi): Promise<void> {
  if (hasFetchedParams) return
  const url = 'https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/constants.py'
  try {
    let text = ''
    if (network) {
      text = await network.fetchText(url)
    } else if (typeof fetch !== 'undefined') {
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
      if (res.ok) text = await res.text()
    }

    if (text) {
      const tokenMatch = text.match(/TRUSTED_CLIENT_TOKEN\s*=\s*["']([A-Z0-9]+)["']/i)
      const versionMatch = text.match(/CHROMIUM_FULL_VERSION\s*=\s*["']([0-9.]+)["']/i)

      if (tokenMatch && tokenMatch[1]) {
        updateTrustedClientToken(tokenMatch[1])
      }
      if (versionMatch && versionMatch[1]) {
        updateChromiumVersion(versionMatch[1])
      }
      hasFetchedParams = true
    }
  } catch (error) {
    // Non-blocking fallback to default values
  }
}

export function parseHttpDate(dateStr: string): number {
  const match = dateStr.match(/^\s*[a-zA-Z]+,\s*(\d{1,2})\s*([a-zA-Z]+)\s*(\d{4})\s*(\d{2}):(\d{2}):(\d{2})\s*([a-zA-Z]+)/)
  if (!match) {
    const parsed = Date.parse(dateStr)
    return isNaN(parsed) ? Date.now() : parsed
  }

  const day = parseInt(match[1], 10)
  const monthStr = match[2].toLowerCase()
  const year = parseInt(match[3], 10)
  const hours = parseInt(match[4], 10)
  const minutes = parseInt(match[5], 10)
  const seconds = parseInt(match[6], 10)

  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  }
  const month = months[monthStr.substring(0, 3)] ?? 0

  return Date.UTC(year, month, day, hours, minutes, seconds)
}

export async function getClockSkew(network?: ExtensionNetworkApi): Promise<number> {
  await fetchEdgeTTSParams(network)
  const now = Date.now()
  if (cachedClockSkew !== null && (now - lastSkewFetchTime < 600000)) {
    return cachedClockSkew
  }

  try {
    const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${activeTrustedClientToken}`
    if (typeof fetch !== 'undefined') {
      const response = await fetch(url)
      const serverDateStr = response.headers.get('date') || response.headers.get('Date')
      if (serverDateStr) {
        const serverTime = parseHttpDate(serverDateStr)
        cachedClockSkew = serverTime - Date.now()
        lastSkewFetchTime = Date.now()
        return cachedClockSkew
      }
    }
  } catch (error) {
    // Ignore and return fallback
  }
  return cachedClockSkew ?? 0
}

async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)

  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  try {
    // Node environment fallback
    const nodeCrypto = require('node:crypto')
    return nodeCrypto.createHash('sha256').update(str).digest('hex').toUpperCase()
  } catch {
    // Minimal fallback
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(16).toUpperCase()
  }
}

export async function generateSecMsGec(skewMs: number = 0): Promise<string> {
  const now = new Date(Date.now() + skewMs)
  // Convert to Windows file time epoch (January 1, 1601) in seconds
  const ticks = Math.floor(now.getTime() / 1000) + 11644473600
  const timeout = ticks % 300

  // Concatenate rounded ticks + "0000000" + Trusted Client Token
  const inputStr = (ticks - timeout).toString() + '0000000' + activeTrustedClientToken
  return await sha256Hex(inputStr)
}

export function generateConnectionId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function generateMuid(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()
}

export function generateTimestamp(): string {
  return new Date().toISOString().replace('Z', '000Z')
}

