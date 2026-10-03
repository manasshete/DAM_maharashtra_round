import { FeatureVector, MisconceptionModel, PredictionResult } from './MisconceptionModel';

export class NaiveBayesClassifier implements MisconceptionModel {
  private classCounts: Record<string, number> = {};
  private featureCounts: Record<string, Record<string, number>> = {};
  private vocabulary: Set<string> = new Set();
  private totalSamples = 0;

  train(featuresList: FeatureVector[], labels: string[]): void {
    if (featuresList.length !== labels.length) {
      throw new Error("Features and labels must have the same length.");
    }
    
    this.classCounts = {};
    this.featureCounts = {};
    this.vocabulary = new Set();
    this.totalSamples = labels.length;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const features = featuresList[i];
      
      this.classCounts[label] = (this.classCounts[label] || 0) + 1;
      
      if (!this.featureCounts[label]) {
        this.featureCounts[label] = {};
      }
      
      for (const [feature, value] of Object.entries(features)) {
        if (value > 0) { 
          this.featureCounts[label][feature] = (this.featureCounts[label][feature] || 0) + 1;
          this.vocabulary.add(feature);
        }
      }
    }
  }

  predict(features: FeatureVector): PredictionResult {
    if (this.totalSamples === 0) {
      throw new Error("Model is not trained.");
    }

    const logProbs: Record<string, number> = {};
    const vocabSize = this.vocabulary.size;
    
    let maxLogProb = -Infinity;
    let bestClass = 'OTHER';

    for (const [label, count] of Object.entries(this.classCounts)) {
      logProbs[label] = Math.log(count / this.totalSamples);
      
      const labelFeatureCounts = this.featureCounts[label];
      const totalFeaturesForLabel = Object.values(labelFeatureCounts).reduce((a, b) => a + b, 0);

      for (const [feature, value] of Object.entries(features)) {
        if (value > 0 && this.vocabulary.has(feature)) {
          const countFeatureGivenLabel = labelFeatureCounts[feature] || 0;
          const probFeatureGivenLabel = (countFeatureGivenLabel + 1) / (totalFeaturesForLabel + vocabSize);
          logProbs[label] += Math.log(probFeatureGivenLabel);
        }
      }

      if (logProbs[label] > maxLogProb) {
        maxLogProb = logProbs[label];
        bestClass = label;
      }
    }

    let probSum = 0;
    const probabilities: Record<string, number> = {};
    for (const label of Object.keys(logProbs)) {
      const prob = Math.exp(logProbs[label] - maxLogProb);
      probabilities[label] = prob;
      probSum += prob;
    }
    
    for (const label of Object.keys(probabilities)) {
      probabilities[label] /= probSum;
    }

    return {
      prediction: bestClass,
      probabilities
    };
  }

  save(): string {
    return JSON.stringify({
      classCounts: this.classCounts,
      featureCounts: this.featureCounts,
      vocabulary: Array.from(this.vocabulary),
      totalSamples: this.totalSamples
    });
  }

  load(data: string): void {
    const parsed = JSON.parse(data);
    this.classCounts = parsed.classCounts;
    this.featureCounts = parsed.featureCounts;
    this.vocabulary = new Set(parsed.vocabulary);
    this.totalSamples = parsed.totalSamples;
  }
}
