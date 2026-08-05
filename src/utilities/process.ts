import { getNovelApi } from './context'

export function getProcess(): ExtensionProcessApi {
  const api = getNovelApi()
  if (!api.process) {
    throw new Error('novel.process is only available on Electron Desktop.')
  }
  return api.process
}

export const processApi = {
  spawn(options: ExtensionProcessSpawnOptions): Promise<ExtensionProcessSpawnResult> {
    return getProcess().spawn(options)
  },
  kill(processId: string): Promise<boolean> {
    return getProcess().kill(processId)
  },
  writeLine(processId: string, line: string): Promise<void> {
    return getProcess().writeLine(processId, line)
  },
  onLine(processId: string, callback: (line: string) => void): () => void {
    return getProcess().onLine(processId, callback)
  }
}
