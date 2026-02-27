import { useEffect, useCallback } from 'react';
import { useQueryStore } from '../../store/queryStore';
import { useQueryPipeline } from '../../hooks/useQueryPipeline';
import { QueryEditorContent } from './QueryEditorContent';
import { PipelineTimeline } from '../Pipeline/PipelineTimeline';
import { PipelineError } from '../Pipeline/PipelineError';

export function EditModal() {
  const isOpen = useQueryStore((s) => s.isEditModalOpen);
  const closeEditModal = useQueryStore((s) => s.closeEditModal);
  const discardEditModal = useQueryStore((s) => s.discardEditModal);
  const stepProgress = useQueryStore((s) => s.stepProgress);
  const pipelineResult = useQueryStore((s) => s.pipelineResult);
  const { runPipeline, isRunning } = useQueryPipeline();

  const handleDiscard = useCallback(() => {
    if (!isRunning) discardEditModal();
  }, [isRunning, discardEditModal]);

  const handleApply = useCallback(async () => {
    await runPipeline();
  }, [runPipeline]);

  // Auto-close on successful pipeline completion
  useEffect(() => {
    if (pipelineResult?.status === 'success' && !isRunning && isOpen) {
      const timer = setTimeout(() => closeEditModal(), 800);
      return () => clearTimeout(timer);
    }
  }, [pipelineResult, isRunning, isOpen, closeEditModal]);

  // Escape key to discard
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRunning) discardEditModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isRunning, discardEditModal]);

  if (!isOpen) return null;

  const showTimeline = stepProgress.length > 0 || isRunning;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !isRunning) discardEditModal();
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Analysis Question</h2>
          <button className="modal-close" onClick={handleDiscard} disabled={isRunning}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {showTimeline ? (
            <>
              <PipelineTimeline steps={stepProgress} isRunning={isRunning} />
              <PipelineError result={pipelineResult} />
            </>
          ) : (
            <QueryEditorContent />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleDiscard} disabled={isRunning}>
            Discard Changes
          </button>
          <button className="btn-primary" onClick={handleApply} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
