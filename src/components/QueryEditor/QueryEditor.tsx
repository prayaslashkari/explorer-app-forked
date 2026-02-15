import { useQueryStore } from '../../store/queryStore';
import { QuestionPreview } from './QuestionPreview';
import { EntityBlock } from './EntityBlock';
import { RelationshipSelector } from './RelationshipSelector';
import { useQueryPipeline } from '../../hooks/useQueryPipeline';

export function QueryEditor() {
  const { question, setBlockA, setBlockC, setRelationship, resetQuestion } = useQueryStore();
  const { runPipeline, isRunning } = useQueryPipeline();

  return (
    <div className="query-editor">
      <QuestionPreview question={question} />

      <EntityBlock
        label="Features or Observations (A)"
        value={question.blockA}
        onChange={setBlockA}
      />

      <RelationshipSelector value={question.relationship} onChange={setRelationship} />

      <EntityBlock
        label="Features or Observations (C)"
        value={question.blockC}
        onChange={setBlockC}
      />

      <div className="query-actions">
        <button className="btn-secondary" onClick={resetQuestion} disabled={isRunning}>
          Reset
        </button>
        <button className="btn-primary" onClick={runPipeline} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Query'}
        </button>
      </div>
    </div>
  );
}
