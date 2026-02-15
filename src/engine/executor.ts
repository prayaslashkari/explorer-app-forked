import type { AnalysisQuestion } from '../types/query';
import type { SparqlRow } from '../types/sparql';
import type { PipelineStep, PipelineContext } from './planner';
import { executeSparql } from './sparqlClient';
import { shortenS2URI } from '../utils/s2cells';

export interface PipelineSuccess {
  status: 'success';
  data: Record<string, SparqlRow[]>;
}

export interface PipelineEmpty {
  status: 'empty';
  failedAtStep: number;
  message: string;
}

export interface PipelineError {
  status: 'error';
  failedAtStep: number;
  message: string;
  error: Error;
}

export type PipelineResult = PipelineSuccess | PipelineEmpty | PipelineError;

export interface StepProgress {
  stepIndex: number;
  totalSteps: number;
  description: string;
  status: 'running' | 'done' | 'failed' | 'skipped';
  resultCount?: number;
}

const S2_PRODUCING_STEPS = new Set([
  'GET_S2_FOR_ANCHOR',
  'FILTER_S2_TO_REGION',
  'EXPAND_S2_NEAR',
  'TRACE_DOWNSTREAM',
  'TRACE_UPSTREAM',
  'FILTER_S2_POST_SPATIAL',
]);

export async function executePipeline(
  steps: PipelineStep[],
  question: AnalysisQuestion,
  onProgress: (progress: StepProgress) => void
): Promise<PipelineResult> {
  const context: PipelineContext = { question, s2Cells: [], results: {} };

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onProgress({
      stepIndex: i,
      totalSteps: steps.length,
      description: step.description,
      status: 'running',
    });

    try {
      const query = step.buildQuery(context);
      const results = await executeSparql(step.endpoint, query);

      // If this step produces S2 cells, update context
      if (S2_PRODUCING_STEPS.has(step.type) && results.length > 0 && results[0].s2cell) {
        context.s2Cells = results.map((r) => shortenS2URI(r.s2cell));
      }

      context.results[step.type] = results;

      onProgress({
        stepIndex: i,
        totalSteps: steps.length,
        description: step.description,
        status: 'done',
        resultCount: results.length,
      });

      // Early exit if an S2-producing step yields no results
      if (S2_PRODUCING_STEPS.has(step.type) && context.s2Cells.length === 0) {
        return {
          status: 'empty',
          failedAtStep: i,
          message: `No results at step: ${step.description}`,
        };
      }
    } catch (err) {
      onProgress({
        stepIndex: i,
        totalSteps: steps.length,
        description: step.description,
        status: 'failed',
      });

      return {
        status: 'error',
        failedAtStep: i,
        message: `Error at step: ${step.description}`,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  return { status: 'success', data: context.results };
}
