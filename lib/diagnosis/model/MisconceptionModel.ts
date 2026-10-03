export interface FeatureVector {
  [featureName: string]: number;
}

export interface PredictionResult {
  prediction: string;
  probabilities: Record<string, number>;
}

export interface MisconceptionModel {
  train(features: FeatureVector[], labels: string[]): void;
  predict(features: FeatureVector): PredictionResult;
  save(): string; 
  load(data: string): void;
}
