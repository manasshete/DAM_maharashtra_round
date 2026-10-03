import { M02_INTERVENTION, InterventionSpec } from "../../data/interventions/M02";

export class InterventionEngine {
  private interventions: Record<string, InterventionSpec> = {
    "M02": M02_INTERVENTION
  };

  public getIntervention(misconceptionId: string, level: number = 1): string {
    const spec = this.interventions[misconceptionId];
    if (!spec) {
      return "I noticed something might be off with your logic, but I don't have a specific hint for it yet.";
    }

    const requestedLevel = spec.levels.find(l => l.level === level);
    if (requestedLevel) {
      return requestedLevel.content;
    }

    // Default to the highest available level if requested level doesn't exist
    return spec.levels[spec.levels.length - 1].content;
  }
}
