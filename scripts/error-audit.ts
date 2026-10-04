import fs from 'fs';
import path from 'path';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';

function auditSplit(name: string, featuresFile: string, rawFile: string, model: NaiveBayesClassifier) {
  const featuresStr = fs.readFileSync(featuresFile, 'utf-8');
  const rawStr = fs.readFileSync(rawFile, 'utf-8');

  const features = featuresStr.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  const raw = rawStr.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  interface ErrorRow {
    id: string;
    questionId: string;
    code: string;
    reasoning: string;
    trueLabel: string;
    predictedLabel: string;
    features: string;
  }

  const errors: ErrorRow[] = [];

  for (let i = 0; i < features.length; i++) {
    const featObj = features[i];
    const rawObj = raw[i];
    
    if (featObj.id !== rawObj.id) {
      throw new Error(`ID mismatch at index ${i}: ${featObj.id} vs ${rawObj.id}`);
    }

    const res = model.predict(featObj.features);
    const predicted = res.prediction;

    if (predicted !== featObj.label) {
      errors.push({
        id: rawObj.id,
        questionId: rawObj.questionId,
        code: rawObj.code,
        reasoning: rawObj.reasoning,
        trueLabel: featObj.label,
        predictedLabel: predicted,
        features: Object.keys(featObj.features).join(', ')
      });
    }
  }

  console.log(`\n=== ${name} Error Audit ===`);
  console.log(`Total Errors: ${errors.length} / ${features.length} (${((features.length - errors.length) / features.length * 100).toFixed(2)}% Accuracy)`);
  
  if (errors.length > 0) {
    console.log("\n| Example | True label | Predicted label | Important features | Code & Reasoning |");
    console.log("|---|---|---|---|---|");
    for (const e of errors) {
      console.log(`| ${e.id} | ${e.trueLabel} | ${e.predictedLabel} | ${e.features} | \`${e.code}\` <br/> *"${e.reasoning}"* |`);
    }
  }
}

const modelData = fs.readFileSync(path.join(__dirname, '..', 'data', 'eval', 'misconception_model_v1.json'), 'utf-8');
const model = new NaiveBayesClassifier();
model.load(modelData);

auditSplit(
  'Development Set',
  path.join(__dirname, '..', 'data', 'eval', 'development.jsonl'),
  path.join(__dirname, '..', 'data', 'eval', 'raw_development.jsonl'),
  model
);

auditSplit(
  'Held-Out Set',
  path.join(__dirname, '..', 'data', 'eval', 'held-out.jsonl'),
  path.join(__dirname, '..', 'data', 'eval', 'raw_held_out.jsonl'),
  model
);
