import { z } from 'zod';

export const RawExampleSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  code: z.string(),
  stdout: z.string(),
  stderr: z.string(),
  errorType: z.string().nullable(),
  reasoning: z.string(),
  diagnosticResponse: z.string().optional(),
  label: z.enum(['M01', 'M02', 'M03', 'OTHER_UNKNOWN', 'CAREFUL_CORRECT', 'CARELESS_ERROR', 'SYNTAX_ERROR', 'RUNTIME_ERROR'])
});

export type RawExample = z.infer<typeof RawExampleSchema>;
