import { create } from 'zustand';
import type { AnalysisQuestion, EntityBlock, SpatialRelationship } from '../types/query';
import type { StepProgress, PipelineResult } from '../engine/executor';

function defaultEntityBlock(type: EntityBlock['type']): EntityBlock {
  return { type };
}

function defaultQuestion(): AnalysisQuestion {
  return {
    blockA: defaultEntityBlock('samples'),
    relationship: { type: 'near', hops: 1 },
    blockC: defaultEntityBlock('facilities'),
  };
}

interface QueryStore {
  question: AnalysisQuestion;
  stepProgress: StepProgress[];
  pipelineResult: PipelineResult | null;
  isRunning: boolean;

  setBlockA: (block: EntityBlock) => void;
  setBlockC: (block: EntityBlock) => void;
  setRelationship: (rel: SpatialRelationship) => void;
  setQuestion: (q: AnalysisQuestion) => void;
  resetQuestion: () => void;

  setIsRunning: (running: boolean) => void;
  addStepProgress: (progress: StepProgress) => void;
  clearProgress: () => void;
  setPipelineResult: (result: PipelineResult | null) => void;
}

export const useQueryStore = create<QueryStore>((set) => ({
  question: defaultQuestion(),
  stepProgress: [],
  pipelineResult: null,
  isRunning: false,

  setBlockA: (block) => set((s) => ({ question: { ...s.question, blockA: block } })),
  setBlockC: (block) => set((s) => ({ question: { ...s.question, blockC: block } })),
  setRelationship: (rel) => set((s) => ({ question: { ...s.question, relationship: rel } })),
  setQuestion: (question) => set({ question }),
  resetQuestion: () => set({ question: defaultQuestion() }),

  setIsRunning: (isRunning) => set({ isRunning }),
  addStepProgress: (progress) =>
    set((s) => {
      const updated = [...s.stepProgress];
      updated[progress.stepIndex] = progress;
      return { stepProgress: updated };
    }),
  clearProgress: () => set({ stepProgress: [], pipelineResult: null }),
  setPipelineResult: (pipelineResult) => set({ pipelineResult }),
}));
