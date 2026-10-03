export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TraceEvent {
  line: number;
  event: string;
  locals: Record<string, any>;
}

export interface AstEvidence {
  nodeType: string;
  source: string;
  line: number;
}

export interface ExecutionResult {
  status: "SUCCESS" | "ERROR" | "TIMEOUT";
  stdout: string;
  stderr: string;
  errorType: string | null;
  errorLine: number | null;
  traceEvents: TraceEvent[];
  astEvidence: AstEvidence[];
}

export interface CodeVerifier {
  verify(input: {
    code: string;
    tests: TestCase[];
    timeoutMs: number;
  }): Promise<ExecutionResult>;
}
