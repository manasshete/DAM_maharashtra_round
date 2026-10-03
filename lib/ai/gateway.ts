import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Diagnosis } from "../../contracts/schemas";

// This is strictly used for interpreting free-form text into features when needed,
// OR converting structured diagnosis into a friendly explanation.
// The LLM is NEVER used to invent misconception IDs.

const ExplanationSchema = z.object({
  friendlyExplanation: z.string().describe("A student-friendly explanation of the diagnosis."),
});

export async function explainDiagnosis(diagnosis: Diagnosis): Promise<string> {
  if (diagnosis.status === "ABSTAIN") {
    return "I need a bit more information to understand what went wrong.";
  }
  
  if (!diagnosis.candidateId) {
    return "There was an issue running your code.";
  }

  // LLM only translates the structured diagnosis into text
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: ExplanationSchema,
    system: "You are a helpful tutor. Translate the given diagnostic evidence into a gentle, helpful explanation. Do not give the answer away.",
    prompt: `The student has been diagnosed with misconception ID: ${diagnosis.candidateId}. 
    Internal system reason: ${diagnosis.explanation}
    Please provide a friendly 1-2 sentence explanation to the student.`
  });

  return result.object.friendlyExplanation;
}

// We can also have a gateway function to extract reasoning features from free-text
// if simple regex isn't enough, but for MVP we use deterministic regex.
