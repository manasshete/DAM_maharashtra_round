import * as fs from 'fs';
import * as path from 'path';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { FeatureVector } from '../lib/diagnosis/model/MisconceptionModel';

async function trainModel() {
  const devDataPath = path.join(__dirname, '../data/eval/development.jsonl');
  const lines = fs.readFileSync(devDataPath, 'utf-8').split('\n').filter(Boolean);
  
  const featuresList: FeatureVector[] = [];
  const labels: string[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      featuresList.push(parsed.features);
      labels.push(parsed.label);
    } catch (e) {
      console.warn("Skipping invalid line:", line);
    }
  }

  console.log(`Loaded ${featuresList.length} training examples.`);

  const classifier = new NaiveBayesClassifier();
  classifier.train(featuresList, labels);

  const modelData = classifier.save();
  const artifactPath = path.join(__dirname, '../data/eval/misconception_model_v1.json');
  fs.writeFileSync(artifactPath, modelData, 'utf-8');

  const publicArtifactPath = path.join(__dirname, '../public/eval/misconception_model_v1.json');
  fs.writeFileSync(publicArtifactPath, modelData, 'utf-8');

  console.log(`Model trained and saved to ${artifactPath} and ${publicArtifactPath}`);
}

trainModel().catch(console.error);
