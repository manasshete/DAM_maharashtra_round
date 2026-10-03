// Pyodide Web Worker implementation
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let pyodideReadyPromise;

async function loadPyodideEnvironment() {
  self.pyodide = await loadPyodide({
    // indexURL: '/pyodide/', // Switch to self-hosted for production
  });
  
  // Custom Python logic for AST parsing and execution
  await self.pyodide.runPythonAsync(`
import ast
import sys
import io

def parse_ast_evidence(code_str):
    evidence = []
    try:
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            if isinstance(node, ast.Subscript):
                if isinstance(node.slice, ast.Constant):
                    evidence.append({
                        "nodeType": "Subscript",
                        "source": "index=" + str(node.slice.value),
                        "line": getattr(node, 'lineno', -1)
                    })
    except Exception as e:
        pass
    return evidence

def execute_code(code_str):
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    
    status = "SUCCESS"
    error_type = None
    error_line = None
    
    try:
        exec(code_str, {})
    except Exception as e:
        status = "ERROR"
        error_type = type(e).__name__
        import traceback
        tb = e.__traceback__
        while tb.tb_next:
            tb = tb.tb_next
        error_line = tb.tb_lineno
        sys.stderr.write(str(e))
        
    stdout = sys.stdout.getvalue()
    stderr = sys.stderr.getvalue()
    
    sys.stdout = old_stdout
    sys.stderr = old_stderr
    
    return {
        "status": status,
        "stdout": stdout,
        "stderr": stderr,
        "errorType": error_type,
        "errorLine": error_line
    }
  `);
  
  postMessage({ type: 'READY' });
}

pyodideReadyPromise = loadPyodideEnvironment();

self.onmessage = async (e) => {
  await pyodideReadyPromise;
  
  if (e.data.command === 'RUN_CODE') {
    const { code } = e.data.payload;
    
    try {
      // 1. Get AST Evidence
      const parseAst = self.pyodide.globals.get('parse_ast_evidence');
      const pyAstEvidence = parseAst(code);
      const astEvidence = pyAstEvidence.toJs();
      pyAstEvidence.destroy();
      
      // 2. Execute Code
      const executeFn = self.pyodide.globals.get('execute_code');
      const pyResult = executeFn(code);
      const result = pyResult.toJs({ dict_converter: Object.fromEntries });
      pyResult.destroy();
      
      postMessage({
        type: 'EXECUTION_RESULT',
        payload: {
          ...result,
          traceEvents: [],
          astEvidence: astEvidence
        }
      });
    } catch (err) {
      postMessage({
        type: 'EXECUTION_RESULT',
        payload: {
          status: 'ERROR',
          stdout: '',
          stderr: String(err),
          errorType: 'WorkerError',
          errorLine: null,
          traceEvents: [],
          astEvidence: []
        }
      });
    }
  }
};
