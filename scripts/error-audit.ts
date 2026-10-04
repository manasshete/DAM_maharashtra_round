import fs from 'fs';
import path from 'path';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';

const devFeaturesStr = fs.readFileSync(path.join(__dirname, '..', 'data', 'eval', 'development.jsonl'), 'utf-8');
const devRawStr = fs.readFileSync(path.join(__dirname, '..', 'data', 'eval', 'raw_development.jsonl'), 'utf-8');
const modelData = fs.readFileSync(path.join(__dirname, '..', 'public', 'eval', 'misconception_model_v1.json'), 'utf-8');

const model = new NaiveBayesClassifier();
model.load(modelData);

const devFeatures = devFeaturesStr.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const devRaw = devRawStr.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

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

for (let i = 0; i < devFeatures.length; i++) {
  const featObj = devFeatures[i];
  const rawObj = devRaw[i];
  
  if (featObj.id !== rawObj.id) {
    throw new Error("ID mismatch");
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

console.log(`Total Errors on Dev: ${errors.length} / ${devFeatures.length}`);
console.log("\n| Example | True label | Predicted label | Important features | Code & Reasoning |");
console.log("|---|---|---|---|---|");

for (const e of errors) {
  console.log(`| ${e.id} | ${e.trueLabel} | ${e.predictedLabel} | ${e.features} | \`${e.code}\` <br/> *"${e.reasoning}"* |`);
}
