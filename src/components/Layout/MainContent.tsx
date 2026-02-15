import { ResultsMap } from '../Map/ResultsMap';
import { PipelineStatus } from '../Pipeline/PipelineStatus';
import { PipelineError } from '../Pipeline/PipelineError';
import { useQueryStore } from '../../store/queryStore';
import { useMapLayers } from '../../hooks/useMapLayers';

export function MainContent() {
  const { stepProgress, isRunning, pipelineResult } = useQueryStore();
  const layers = useMapLayers(pipelineResult);

  const resultSummary =
    pipelineResult?.status === 'success'
      ? `${layers.samples.length} samples, ${layers.facilities.length} facilities, ${layers.waterBodies.length} water bodies`
      : null;

  return (
    <main className="app-main">
      <div className="map-container">
        <ResultsMap layers={layers} />
      </div>

      <div className="results-panel">
        <PipelineStatus steps={stepProgress} isRunning={isRunning} />
        <PipelineError result={pipelineResult} />

        {resultSummary && (
          <div className="result-summary">
            <strong>Results:</strong> {resultSummary}
          </div>
        )}
      </div>
    </main>
  );
}
