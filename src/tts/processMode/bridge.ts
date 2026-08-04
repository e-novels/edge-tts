interface QueueItem {
  id: string
  method: string
  params: unknown
  resolve: (res: any) => void
  reject: (err: Error) => void
}

export class ProcessBridge {
  private processId: string | null = null
  private queue: QueueItem[] = []
  private isProcessing = false
  private pendingMap = new Map<string, QueueItem>()

  constructor(private novel: NovelExtensionApi) {}

  async startProcess(executable: string): Promise<void> {
    if (this.novel.platform !== 'win32' && this.novel.platform !== 'darwin' && this.novel.platform !== 'linux') {
      throw new Error('Python stdio mode is only available on Electron Desktop.')
    }
    if (!this.novel.process) {
      throw new Error('novel.process is only available on Electron Desktop.')
    }

    const ext = this.novel.platform === 'win32' ? '.exe' : ''
    const spawnRes = await this.novel.process.spawn({ executable: executable + ext })
    if (!spawnRes.success) {
      throw new Error(`Failed to launch executable: ${executable}`)
    }
    this.processId = spawnRes.processId

    this.novel.process.onLine(this.processId, (line: string) => {
      this.handleStdoutLine(line)
    })
  }

  private handleStdoutLine(line: string): void {
    if (!line.trim()) return
    try {
      const data = JSON.parse(line)
      const { id, result, error } = data
      const item = this.pendingMap.get(id)
      if (item) {
        this.pendingMap.delete(id)
        if (error) item.reject(new Error(error))
        else item.resolve(result)
      }
    } catch (err) {
      this.novel.logger.error('Invalid JSON line from Python process:', line)
    }
  }

  async sendCommand(method: string, params: unknown): Promise<any> {
    if (!this.processId) {
      throw new Error('Process bridge is not running')
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const item: QueueItem = { id, method, params, resolve, reject }
      this.queue.push(item)
      this.processNext()
    })
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return
    if (!this.novel.process || !this.processId) return
    this.isProcessing = true

    const item = this.queue.shift()!
    this.pendingMap.set(item.id, item)

    const jsonStr = JSON.stringify({ id: item.id, method: item.method, params: item.params })
    try {
      await this.novel.process.writeLine(this.processId, jsonStr)
    } catch (err: any) {
      this.pendingMap.delete(item.id)
      item.reject(err)
    } finally {
      this.isProcessing = false
      setImmediate(() => this.processNext())
    }
  }

  async stop(): Promise<void> {
    if (this.processId && this.novel.process) {
      await this.novel.process.kill(this.processId)
      this.processId = null
    }
  }
}
