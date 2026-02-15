import type { AnalysisQuestion } from '../../types/query';
import { generateQuestion } from '../../utils/questionGenerator';

interface QuestionPreviewProps {
  question: AnalysisQuestion;
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
  const text = generateQuestion(question);

  return (
    <div className="question-preview">
      <div className="question-label">Analysis Question</div>
      <div className="question-text">{text}</div>
    </div>
  );
}
