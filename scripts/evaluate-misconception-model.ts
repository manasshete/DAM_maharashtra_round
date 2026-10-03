import * as fs from 'fs';
import * as path from 'path';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { FeatureVector } from '../lib/diagnosis/model/MisconceptionModel';

async function evaluateModel() {
  const artifactPath = path.join(__dirname, '../data/eval/misconception_model_v1.json');
  if (!fs.existsSync(artifactPath)) {
    console.error("Model artifact not found. Run train-misconception-model first.");
    process.exit(1);
  }

  const modelData = fs.readFileSync(artifactPath, 'utf-8');
  const classifier = new NaiveBayesClassifier();
  classifier.load(modelData);

  const testDataPath = path.join(__dirname, '../data/eval/held-out.jsonl');
  const lines = fs.readFileSync(testDataPath, 'utf-8').split('\n').filter(Boolean);
  
  let correct = 0;
  let total = 0;
  
  const truePositives: Record<string, number> = {};
  const falsePositives: Record<string, number> = {};
  const falseNegatives: Record<string, number> = {};

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const features: FeatureVector = parsed.features;
      const trueLabel: string = parsed.label;

      const result = classifier.predict(features);
      const predictedLabel = result.prediction;

      total++;
      if (predictedLabel === trueLabel) {
        correct++;
        truePositives[trueLabel] = (truePositives[trueLabel] || 0) + 1;
      } else {
        falsePositives[predictedLabel] = (falsePositives[predictedLabel] || 0) + 1;
        falseNegatives[trueLabel] = (falseNegatives[trueLabel] || 0) + 1;
      }
    } catch (e) {
      console.warn("Skipping invalid line:", line);
    }
  }

  console.log(`Evaluated ${total} examples.`);
  
  const accuracy = (correct / total) * 100;
  console.log(`Overall Accuracy: ${accuracy.toFixed(2)}%`);

  // Calculate Macro-F1
  const labels = Array.from(new Set([
    ...Object.keys(truePositives), 
    ...Object.keys(falsePositives), 
    ...Object.keys(falseNegatives)
  ]));

  let macroF1Sum = 0;
  let validClasses = 0;

  console.log('\nPer-class Metrics:');
  for (const label of labels) {
    const tp = truePositives[label] || 0;
    const fp = falsePositives[label] || 0;
    const fn = falseNegatives[label] || 0;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    if (tp + fn > 0) { // Only consider classes present in the true test set for macro average
      macroF1Sum += f1;
      validClasses++;
    }

    console.log(`- ${label}: Precision=${precision.toFixed(2)}, Recall=${recall.toFixed(2)}, F1=${f1.toFixed(2)}`);
  }

  const macroF1 = validClasses > 0 ? macroF1Sum / validClasses : 0;
  console.log(`\nMacro-F1 Score: ${macroF1.toFixed(4)}`);

  // --- DIFFERENTIAL DIAGNOSIS EVALUATION ---
  console.log('\n--- DIFFERENTIAL DIAGNOSIS EVALUATION ---');
  const diffModule = await import('../lib/diagnosis/differential');
  const runDifferentialDiagnosis = diffModule.runDifferentialDiagnosis;
  const qModule = await import('../data/questions/M02');
  const M02_QUESTION = qModule.M02_QUESTION;

  let abstained = 0;
  let diagnosedCorrectly = 0;
  let diagnosedIncorrectly = 0;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const features: FeatureVector = parsed.features;
      const trueLabel: string = parsed.label;

      const diffDiag = await runDifferentialDiagnosis({
        features,
        model: classifier,
        question: M02_QUESTION
      });

      if (diffDiag.status === 'ABSTAIN') {
        abstained++;
      } else if (diffDiag.status === 'DIAGNOSED') {
        if (diffDiag.candidateId === trueLabel) {
          diagnosedCorrectly++;
        } else {
          diagnosedIncorrectly++;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log(`Total samples: ${total}`);
  console.log(`Abstained due to insufficient evidence or guardrails: ${abstained} (${((abstained/total)*100).toFixed(2)}%)`);
  console.log(`Diagnosed Correctly: ${diagnosedCorrectly} (${((diagnosedCorrectly/total)*100).toFixed(2)}%)`);
  console.log(`Diagnosed Incorrectly: ${diagnosedIncorrectly} (${((diagnosedIncorrectly/total)*100).toFixed(2)}%)`);
  console.log(`Evidence-Sufficiency Rate (Diagnosed Correctly / Total Diagnosed): ${diagnosedCorrectly + diagnosedIncorrectly > 0 ? ((diagnosedCorrectly / (diagnosedCorrectly + diagnosedIncorrectly)) * 100).toFixed(2) : 0}%`);

}

evaluateModel().catch(console.error);
