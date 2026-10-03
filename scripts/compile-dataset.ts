import * as fs from 'fs';
import * as path from 'path';
import { extractFeatures } from '../lib/evidence/extractor';
import { RawExampleSchema, RawExample } from '../data/eval/dataset.schema';
import { M02_QUESTION } from '../data/questions/M02';

// Add M01 and M03 mocks or actual questions later
const QUESTIONS: Record<string, any> = {
  'M02': M02_QUESTION
};

function parsePythonASTMock(code: string) {
  // A simple mock parser to pull out index subscripts for the feature extractor
  // This replaces real Pyodide output during dataset generation
  const astEvidence = [];
  if (code.includes('[1]')) {
    astEvidence.push({ nodeType: 'Subscript', source: 'index=1' });
  }
  if (code.includes('[0]')) {
    astEvidence.push({ nodeType: 'Subscript', source: 'index=0' });
  }
  return astEvidence;
}

function compileDataset(inputFile: string, outputFile: string) {
  if (!fs.existsSync(inputFile)) {
    console.log(`Input file ${inputFile} does not exist. Skipping.`);
    return;
  }

  const lines = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
  const outLines = [];

  let compiledCount = 0;
  for (const line of lines) {
    try {
      const raw: RawExample = RawExampleSchema.parse(JSON.parse(line));
      const question = QUESTIONS[raw.questionId] || M02_QUESTION;
      
      const astEvidence = parsePythonASTMock(raw.code);

      const features = extractFeatures({
        execution: {
          status: raw.errorType ? 'ERROR' : 'SUCCESS',
          stdout: raw.stdout,
          stderr: raw.stderr,
          errorType: raw.errorType || undefined,
          astEvidence
        },
        reasoning: raw.reasoning,
        diagnosticResponse: raw.diagnosticResponse,
        question
      });

      outLines.push(JSON.stringify({
        id: raw.id,
        features,
        label: raw.label
      }));
      compiledCount++;
    } catch (e) {
      console.warn(`Skipping invalid line: ${line}`);
    }
  }

  fs.writeFileSync(outputFile, outLines.join('\n') + '\n', 'utf-8');
  console.log(`Compiled ${compiledCount} examples to ${outputFile}`);
}

const rawDevPath = path.join(__dirname, '../data/eval/raw_development.jsonl');
const devOutPath = path.join(__dirname, '../data/eval/development.jsonl');
compileDataset(rawDevPath, devOutPath);

const rawHeldOutPath = path.join(__dirname, '../data/eval/raw_held_out.jsonl');
const heldOutOutPath = path.join(__dirname, '../data/eval/held-out.jsonl');
compileDataset(rawHeldOutPath, heldOutOutPath);
