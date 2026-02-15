import { useCallback } from 'react';
import { useQueryStore } from '../store/queryStore';
import { planPipeline } from '../engine/planner';
import { executePipeline } from '../engine/executor';

export function useQueryPipeline() {
  const {
    question,
    isRunning,
    stepProgress,
    pipelineResult,
    setIsRunning,
    addStepProgress,
    clearProgress,
    setPipelineResult,
  } = useQueryStore();

  const runPipeline = useCallback(async () => {
    clearProgress();
    setIsRunning(true);

    try {
      const steps = planPipeline(question);
      const result = await executePipeline(steps, question, addStepProgress);
      setPipelineResult(result);
    } catch (err) {
      setPipelineResult({
        status: 'error',
        failedAtStep: -1,
        message: err instanceof Error ? err.message : String(err),
        error: err instanceof Error ? err : new Error(String(err)),
      });
    } finally {
      setIsRunning(false);
    }
  }, [question, clearProgress, setIsRunning, addStepProgress, setPipelineResult]);

  return { runPipeline, isRunning, stepProgress, pipelineResult };
}
