import type { StepProgress } from '../../engine/executor';

interface PipelineStatusProps {
  steps: StepProgress[];
  isRunning: boolean;
}

function statusIcon(status: StepProgress['status']): string {
  switch (status) {
    case 'done':
      return '\u2705';
    case 'running':
      return '\uD83D\uDD04';
    case 'failed':
      return '\u274C';
    case 'skipped':
      return '\u23ED\uFE0F';
    default:
      return '\u2B1C';
  }
}

export function PipelineStatus({ steps, isRunning }: PipelineStatusProps) {
  if (steps.length === 0 && !isRunning) return null;

  return (
    <div className="pipeline-status">
      <h3>Pipeline Progress</h3>
      <ul className="pipeline-steps">
        {steps.map((step, i) => (
          <li key={i} className={`pipeline-step step-${step.status}`}>
            <span className="step-icon">{statusIcon(step.status)}</span>
            <span className="step-desc">
              Step {i + 1}/{step.totalSteps}: {step.description}
            </span>
            {step.resultCount !== undefined && step.status === 'done' && (
              <span className="step-count">({step.resultCount} results)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
