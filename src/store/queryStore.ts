import { create } from 'zustand';
import type { AnalysisQuestion, EntityBlock, SpatialRelationship } from '../types/query';
import type { StepProgress, PipelineResult } from '../engine/executor';

export type AppView = 'dashboard' | 'editor';

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
  currentView: AppView;
  activeQueryId: string | null;
  question: AnalysisQuestion;
  stepProgress: StepProgress[];
  pipelineResult: PipelineResult | null;
  isRunning: boolean;

  navigateTo: (view: AppView) => void;
  loadPrebuiltQuery: (id: string, question: AnalysisQuestion) => void;
  goToDashboard: () => void;

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
  currentView: 'dashboard',
  activeQueryId: null,
  question: defaultQuestion(),
  stepProgress: [],
  pipelineResult: null,
  isRunning: false,

  navigateTo: (currentView) => set({ currentView }),
  loadPrebuiltQuery: (id, question) =>
    set({
      activeQueryId: id,
      question,
      currentView: 'editor',
      stepProgress: [],
      pipelineResult: null,
    }),
  goToDashboard: () =>
    set({
      currentView: 'dashboard',
      activeQueryId: null,
      stepProgress: [],
      pipelineResult: null,
    }),

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
