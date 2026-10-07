import { useEffect, useState } from 'react';
import { GetNextEvaluationDate, getQuestions } from '../../../services/questionService';
import { getEvaluationsHistory, PostEvaluation } from '../../../services/evaluationService';
import type { QuestionType } from '../../../types/Question.type';
import type { EvaluationAnswerType } from '../../../types/HistoryEvaluation.type';
import type { AnswerType } from '../../../types/PostEvaluation.type';
import './EvaluationModal.css';

export interface EvaluationModalProps {
    leader_id: number;
    leadId: number;
    leadName?: string;
    status?: 'pending' | 'completed' | string;
    date?: string;
    initialAnswers?: EvaluationAnswerType[] | AnswerType[];
    onClose: () => void;
    onEvaluationSubmitted?: () => void;
}

export function EvaluationModal({
    leader_id,
    leadId,
    leadName,
    status = 'pending',
    date,
    initialAnswers,
    onClose,
    onEvaluationSubmitted,
}: EvaluationModalProps) {
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [answers, setAnswers] = useState<AnswerType[]>([]);
    const [evaluationDate, setEvaluationDate] = useState<string | undefined>(date);
    const [nextEvaluationDate, setNextEvaluationDate] = useState<string | undefined>(date);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isCompleted = status === 'completed';

    useEffect(() => {
        let isMounted = true;

        async function loadModalData() {
            try {
                const questionsData = await getQuestions();
                if (!isMounted) return;
                setQuestions(questionsData);

                if (isCompleted) {
                    if (initialAnswers && initialAnswers.length > 0) {
                        setAnswers(
                            questionsData.map((question) => {
                                const matched = initialAnswers.find(
                                    (ans) => ans.question_id === question.id
                                );
                                return {
                                    question_id: question.id,
                                    grade: matched ? matched.grade : 1,
                                };
                            })
                        );
                    } else {
                        // Fallback: look for completed evaluation in history
                        const history = await getEvaluationsHistory(leader_id);
                        if (!isMounted) return;
                        const leadHistory = history.find(
                            (item) => item.lead_id === leadId
                        );
                        if (leadHistory) {
                            if (leadHistory.date && !evaluationDate) {
                                setEvaluationDate(leadHistory.date);
                            }
                            setAnswers(
                                questionsData.map((question) => {
                                    const matched = leadHistory.answers.find(
                                        (ans) => ans.question_id === question.id
                                    );
                                    return {
                                        question_id: question.id,
                                        grade: matched ? matched.grade : 1,
                                    };
                                })
                            );
                        } else {
                            setAnswers(
                                questionsData.map((question) => ({
                                    question_id: question.id,
                                    grade: 1,
                                }))
                            );
                        }
                    }
                } else {
                    setAnswers(
                        questionsData.map((question) => ({
                            question_id: question.id,
                            grade: 1,
                        }))
                    );
                }
            } catch (error) {
                console.error('Error loading evaluation modal data:', error);
            }
        }

        loadModalData();

        async function loadNextEvaluationDate() {
            const nextEvaluationDate = await GetNextEvaluationDate();
            setNextEvaluationDate(nextEvaluationDate);
        }

        loadNextEvaluationDate();

        return () => {
            isMounted = false;
        };
    }, [isCompleted, initialAnswers, leader_id, leadId, evaluationDate]);

    const handleGradeChange = (
        questionId: number,
        grade: number
    ) => {
        if (isCompleted) return;

        // Scale is 1 to 4
        const safeGrade = isNaN(grade) ? 1 : Math.min(4, Math.max(1, grade));
        setAnswers((currentAnswers) =>
            currentAnswers.map((answer) =>
                answer.question_id === questionId
                    ? { ...answer, grade: safeGrade }
                    : answer
            )
        );
    };

    const onSubmit = async () => {
        if (isCompleted) return;

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            await PostEvaluation({
                leader_id,
                lead_id: leadId,
                answers,
            });

            if (onEvaluationSubmitted) {
                onEvaluationSubmitted();
            }
            onClose();
        } catch (error: any) {
            console.error('Error posting evaluation:', error);
            setErrorMessage(error?.message || 'Erro ao enviar a avaliação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const totalScore =
        answers.length > 0 && questions.length > 0
            ? questions.reduce((sum, q) => {
                const ans = answers.find(
                    (a) => a.question_id === q.id
                );
                const grade = ans?.grade ?? 1;
                const weight = q.weight ?? 0;
                return sum + (grade / 4) * weight;
            }, 0)
            : 0;

    const weightedScore = Number(totalScore.toFixed(2)).toString();

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-title-area">
                        <h2>
                            Avaliação {leadName ? `- ${leadName}` : ''}
                        </h2>
                        <span
                            className={`modal-status-badge ${isCompleted ? 'lead-completed' : 'lead-pending'
                                }`}
                        >
                            {isCompleted
                                ? 'Avaliação concluída'
                                : 'Avaliar agora'}
                        </span>
                    </div>

                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        &times;
                    </button>
                </div>

                {isCompleted ? (
                    <div className="completed-summary-card">
                        <div className="summary-left">
                            <span className="summary-label">Status da Avaliação</span>
                            <p className="summary-status-text">
                                Concluída {evaluationDate ? `em ${evaluationDate}` : ''}
                            </p>
                            <span className="summary-note">
                                Próxima avaliação disponível em {nextEvaluationDate}.
                            </span>
                        </div>
                        <div className="summary-right">
                            <span className="summary-score-label">Nota Final (Ponderada)</span>
                            <div className="summary-score-badge">
                                <span className="score-number">{weightedScore}</span>
                                <span className="score-max">/ 100</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}

                <div className="questions-list">
                    {questions.map((question, index) => {
                        const answer = answers.find(
                            (ans) => ans.question_id === question.id
                        );
                        const grade = answer?.grade ?? 1;

                        return (
                            <div
                                key={question.id}
                                className={`question-item ${isCompleted ? 'readonly' : ''}`}
                            >
                                <div className="question-info">
                                    <div className="question-title-row">
                                        <span className="question-index">#{index + 1}</span>
                                        <p className="question-text">
                                            {question.question_text}
                                        </p>
                                    </div>
                                    {question.weight !== undefined && (
                                        <span className="question-weight-badge">
                                            Peso: <strong>{question.weight}%</strong>
                                        </span>
                                    )}
                                </div>

                                {isCompleted ? (
                                    <div
                                        className="question-grade-completed"
                                        title="Nota atribuída"
                                    >
                                        <span className="grade-pill-label">Nota:</span>
                                        <span className="question-grade">
                                            {grade} <small>/ 4</small>
                                        </span>

                                    </div>
                                ) : (
                                    <div className="question-grade-input-container">
                                        <div className="grade-buttons-group">
                                            {[1, 2, 3, 4].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    className={`grade-button ${grade === value ? 'active' : ''
                                                        }`}
                                                    onClick={() =>
                                                        handleGradeChange(
                                                            question.id,
                                                            value
                                                        )
                                                    }
                                                    aria-label={`Nota ${value}`}
                                                >
                                                    {value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {errorMessage && (
                    <p className="modal-error-message">{errorMessage}</p>
                )}

                <div className="modal-footer">
                    {isCompleted ? (
                        <button
                            type="button"
                            className="modal-btn modal-btn-secondary"
                            onClick={onClose}
                        >
                            Fechar
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="modal-btn modal-btn-secondary"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="modal-btn modal-btn-primary"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar avaliação'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}