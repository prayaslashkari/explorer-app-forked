import { useQueryStore } from '../../store/queryStore';
import { QuestionPreview } from './QuestionPreview';
import { EntityBlock } from './EntityBlock';
import { RelationshipSelector } from './RelationshipSelector';

export function QueryEditorContent() {
  const { question, setBlockA, setBlockC, setRelationship } = useQueryStore();

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
    </div>
  );
}
