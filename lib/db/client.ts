import { createClient, SupabaseClient } from '@supabase/supabase-js';

// If env vars are missing, we default to DEMO_MODE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEMO_MODE = !supabaseUrl || !supabaseKey;

let supabase: SupabaseClient | null = null;
if (!DEMO_MODE) {
  supabase = createClient(supabaseUrl!, supabaseKey!);
}

// In-memory store for DEMO_MODE
const memoryDb = {
  attempts: [] as any[],
  evidence: [] as any[],
  diagnoses: [] as any[],
  interventions: [] as any[],
  reassessments: [] as any[],
  misconceptions: new Map<string, any>()
};

export async function persistAttempt(attempt: any) {
  if (DEMO_MODE) {
    memoryDb.attempts.push(attempt);
    return;
  }
  await supabase!.from('attempts').insert(attempt);
}

export async function persistEvidence(evidence: any) {
  if (DEMO_MODE) {
    memoryDb.evidence.push(evidence);
    return;
  }
  await supabase!.from('evidence').insert(evidence);
}

export async function persistDiagnosis(diagnosis: any) {
  if (DEMO_MODE) {
    memoryDb.diagnoses.push(diagnosis);
    return;
  }
  await supabase!.from('diagnoses').insert(diagnosis);
}

export async function persistIntervention(intervention: any) {
  if (DEMO_MODE) {
    memoryDb.interventions.push(intervention);
    return;
  }
  await supabase!.from('interventions').insert(intervention);
}

export async function saveLearnerState(learnerId: string, state: any) {
  if (DEMO_MODE) {
    memoryDb.misconceptions.set(learnerId + "_" + state.misconceptionId, state);
    return;
  }
  
  await supabase!.from('learner_states').upsert({
    learner_id: learnerId,
    misconception_id: state.misconceptionId,
    status: state.status,
    immediate_evidence: state.immediateEvidence,
    transfer_evidence: state.transferEvidence,
    reasoning_evidence: state.reasoningEvidence,
    updated_at: new Date().toISOString()
  });
}

export async function loadLearnerState(learnerId: string, misconceptionId: string) {
  if (DEMO_MODE) {
    return memoryDb.misconceptions.get(learnerId + "_" + misconceptionId) || null;
  }
  
  const { data } = await supabase!.from('learner_states')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('misconception_id', misconceptionId)
    .single();
    
  if (data) {
    return {
      misconceptionId: data.misconception_id,
      status: data.status,
      immediateEvidence: data.immediate_evidence,
      transferEvidence: data.transfer_evidence,
      reasoningEvidence: data.reasoning_evidence
    };
  }
  return null;
}
