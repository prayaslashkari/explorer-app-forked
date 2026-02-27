import { ResultsMap } from '../Map/ResultsMap';
import { useQueryStore } from '../../store/queryStore';
import { useMapLayers } from '../../hooks/useMapLayers';

export function MainContent() {
  const pipelineResult = useQueryStore((s) => s.pipelineResult);
  const layers = useMapLayers(pipelineResult);

  return (
    <main className="app-main">
      <div className="map-container">
        <ResultsMap layers={layers} />
      </div>
    </main>
  );
}
