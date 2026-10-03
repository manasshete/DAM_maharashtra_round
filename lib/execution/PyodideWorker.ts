import { CodeVerifier, ExecutionResult, TestCase } from './CodeVerifier';

export class PyodideWorkerCodeVerifier implements CodeVerifier {
  private worker: Worker | null = null;
  private workerReady: Promise<void>;
  private isTerminated = false;

  constructor() {
    this.workerReady = this.initWorker();
  }

  private initWorker(): Promise<void> {
    return new Promise((resolve) => {
      // Setup the web worker
      this.worker = new Worker('/pyodide-worker.js');
      this.worker.onmessage = (e) => {
        if (e.data.type === 'READY') {
          resolve();
        }
      };
    });
  }

  async verify(input: {
    code: string;
    tests: TestCase[];
    timeoutMs: number;
  }): Promise<ExecutionResult> {
    await this.workerReady;
    
    if (this.isTerminated || !this.worker) {
      this.isTerminated = false;
      this.workerReady = this.initWorker();
      await this.workerReady;
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      const onMessage = (e: MessageEvent) => {
        if (e.data.type === 'EXECUTION_RESULT') {
          clearTimeout(timeoutId);
          this.worker?.removeEventListener('message', onMessage);
          resolve(e.data.payload);
        }
      };
      
      this.worker?.addEventListener('message', onMessage);

      // Timeout termination
      timeoutId = setTimeout(() => {
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
          this.isTerminated = true;
          resolve({
            status: "TIMEOUT",
            stdout: "",
            stderr: "Execution timed out.",
            errorType: "TimeoutError",
            errorLine: null,
            traceEvents: [],
            astEvidence: []
          });
        }
      }, input.timeoutMs);

      this.worker?.postMessage({
        command: 'RUN_CODE',
        payload: {
          code: input.code,
          tests: input.tests
        }
      });
    });
  }
}
