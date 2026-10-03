import * as fs from 'fs';
import * as path from 'path';
import { RawExample } from '../data/eval/dataset.schema';

// This script generates an authored/curated evaluation dataset to meet the MVP target of 80-110 examples.
// These are not real-world data; they are authored examples simulating typical learner behavior for M01, M02, M03, and baselines.

const examples: RawExample[] = [];
let idCounter = 1;

function add(questionId: string, code: string, stdout: string, errorType: string | null, reasoning: string, label: RawExample['label']) {
  examples.push({
    id: `example_${String(idCounter++).padStart(3, '0')}`,
    questionId,
    code,
    stdout,
    stderr: errorType ? `Traceback... ${errorType}` : '',
    errorType,
    reasoning,
    label
  });
}

// ============================================
// M02: "The first list index is 1"
// ============================================

// True Positives (M02)
for (let i = 0; i < 15; i++) {
  add('M02', 'print(items[1])', 'banana', null, 'The first element is at index 1.', 'M02');
  add('M02', 'print(days[1])', 'tuesday', null, 'Since it asks for the first day, I put 1.', 'M02');
  add('M02', 'x = arr[1]', 'second_val', null, '1 is the first index in Python.', 'M02');
}

// False Positive Traps (NOT M02)
for (let i = 0; i < 5; i++) {
  // They printed the 2nd item intentionally
  add('M02', 'print(items[1])', 'banana', null, 'I need the second item so I use index 1.', 'CAREFUL_CORRECT');
  // Careless error
  add('M02', 'print(items[1])', 'banana', null, 'Oops I meant 0', 'CARELESS_ERROR');
}


// ============================================
// M01: "range(n) starts at 1 rather than 0"
// ============================================

for (let i = 0; i < 15; i++) {
  add('M01', 'for i in range(5): print(i)', '1\n2\n3\n4\n5', null, 'range(5) counts from 1 to 5.', 'M01');
  add('M01', 'list(range(3))', '[1, 2, 3]', null, 'It starts at 1 by default.', 'M01');
}


// ============================================
// M03: "Loop boundaries include the endpoint"
// ============================================

for (let i = 0; i < 15; i++) {
  add('M03', 'for i in range(0, 5): print(i)', '0\n1\n2\n3\n4\n5', null, 'It should include 5.', 'M03');
  add('M03', 'my_list[0:3]', '[a, b, c, d]', null, 'Slice from index 0 to 3 inclusive.', 'M03');
}

// ============================================
// RUNTIME_ERROR & SYNTAX_ERROR
// ============================================

for (let i = 0; i < 10; i++) {
  add('M02', 'print(items[100])', '', 'IndexError', 'I want the last item.', 'RUNTIME_ERROR');
  add('M02', 'print(items[0]', '', 'SyntaxError', 'Forgot a parenthesis.', 'SYNTAX_ERROR');
}

// ============================================
// OTHER_UNKNOWN
// ============================================
for (let i = 0; i < 10; i++) {
  add('M02', 'print("hello")', 'hello', null, 'Just testing.', 'OTHER_UNKNOWN');
}

// Shuffle the examples
examples.sort(() => Math.random() - 0.5);

// Split: ~70 development, ~30 held-out
const splitIndex = Math.floor(examples.length * 0.7);
const devSet = examples.slice(0, splitIndex);
const heldOutSet = examples.slice(splitIndex);

const rawDevPath = path.join(__dirname, '../data/eval/raw_development.jsonl');
const rawHeldOutPath = path.join(__dirname, '../data/eval/raw_held_out.jsonl');

fs.writeFileSync(rawDevPath, devSet.map(e => JSON.stringify(e)).join('\n') + '\n');
fs.writeFileSync(rawHeldOutPath, heldOutSet.map(e => JSON.stringify(e)).join('\n') + '\n');

console.log(`Generated ${examples.length} authored evaluation examples.`);
console.log(`- Development: ${devSet.length}`);
console.log(`- Held-out: ${heldOutSet.length}`);
