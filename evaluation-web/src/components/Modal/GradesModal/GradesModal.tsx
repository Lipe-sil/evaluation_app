import { useEffect, useMemo, useState } from "react";
import { getEmployeeAllGrade } from "../../../services/employeeService";
import type { EvaluationAnswerType, HistoryEvaluationType } from "../../../types/HistoryEvaluation.type";
import { Grade } from "../../Employee/Grade";
import { EvaluationModal } from "../EvaluationModal/EvaluationModal";
import "./GradesModal.css";

export interface GradesModalProps {
    leadId: number;
    leadName?: string;
    viewerId?: number;
    hierarchyLeaderIds?: number[];
    onClose: () => void;
}

function calculateWeightedScore(answers: EvaluationAnswerType[] = []): number {
    if (!answers || answers.length === 0) return 0;
    const total = answers.reduce((acc, ans) => {
        const weight = ans.weight ?? 0;
        return acc + (ans.grade / 4) * weight;
    }, 0);
    return Math.round(total);
}

export function GradesModal({
    leadId,
    leadName,
    viewerId,
    hierarchyLeaderIds,
    onClose,
}: GradesModalProps) {
    const [allEvaluations, setAllEvaluations] = useState<HistoryEvaluationType[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<HistoryEvaluationType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadGrades() {
            try {
                setIsLoading(true);
                if (viewerId !== undefined && leadId === viewerId) {
                    if (isMounted) setAllEvaluations([]);
                    return;
                }
                const data = await getEmployeeAllGrade(String(leadId), leadName, viewerId);
                if (isMounted) {
                    const filtered = (data || []).filter((ev) => {
                        if (viewerId !== undefined && ev.lead_id === viewerId) return false;
                        if (
                            hierarchyLeaderIds &&
                            hierarchyLeaderIds.length > 0 &&
                            !hierarchyLeaderIds.includes(ev.leader_id)
                        ) {
                            return false;
                        }
                        return true;
                    });
                    setAllEvaluations(filtered);
                }
            } catch (error) {
                console.error("Error loading employee all grades:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadGrades();
        return () => {
            isMounted = false;
        };
    }, [leadId, leadName, viewerId, hierarchyLeaderIds]);

    const getHierarchyRank = (evaluation: HistoryEvaluationType): number => {
        if (typeof evaluation.hierarchy_depth === "number") {
            return evaluation.hierarchy_depth;
        }
        if (hierarchyLeaderIds && hierarchyLeaderIds.length > 0) {
            const idx = hierarchyLeaderIds.indexOf(evaluation.leader_id);
            if (idx !== -1) return idx;
        }
        return evaluation.leader_id;
    };

    const mostRecentEvaluation = useMemo(() => {
        if (allEvaluations.length === 0) return null;
        const flagged = allEvaluations.find((ev) => ev.is_most_recent);
        if (flagged) return flagged;
        return [...allEvaluations].sort((a, b) =>
            String(b.date || "").localeCompare(String(a.date || ""))
        )[0];
    }, [allEvaluations]);

    const highestHierarchyEvaluation = useMemo(() => {
        if (allEvaluations.length === 0) return null;
        const flagged = allEvaluations.find((ev) => ev.is_highest_hierarchy);
        if (flagged) return flagged;
        return [...allEvaluations].sort((a, b) => {
            const rankDiff = getHierarchyRank(a) - getHierarchyRank(b);
            if (rankDiff !== 0) return rankDiff;
            return String(b.date || "").localeCompare(String(a.date || ""));
        })[0];
    }, [allEvaluations, hierarchyLeaderIds]);

    return (
        <div className="grades-modal-overlay" onClick={onClose}>
            <div className="grades-modal" onClick={(e) => e.stopPropagation()}>
                <div className="grades-modal-header">
                    <div className="grades-modal-title-area">
                        <div className="grades-modal-id-row">
                            <span className="grades-modal-id-badge">Avaliado ID #{leadId}</span>
                            <h2 className="grades-modal-title">
                                {leadName || `Funcionário #${leadId}`}
                            </h2>
                        </div>
                        <span className="grades-modal-subtitle">
                            Avaliação mais recente, respostas da maior hierarquia e histórico de avaliações
                        </span>
                    </div>
                    <button
                        className="grades-modal-close"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        &times;
                    </button>
                </div>

                <div className="grades-modal-body">
                    {isLoading ? (
                        <p className="grades-modal-loading">Carregando avaliações...</p>
                    ) : allEvaluations.length === 0 ? (
                        <p className="grades-modal-empty">
                            Nenhuma avaliação encontrada para este subordinado.
                        </p>
                    ) : (
                        <>
                            {mostRecentEvaluation && (
                                <div className="grades-highlight-section">
                                    <div className="grades-section-header">
                                        <span className="grades-section-title">
                                            Avaliação Mais Recente
                                        </span>
                                        <span className="grades-section-meta">
                                            {mostRecentEvaluation.date}
                                        </span>
                                    </div>
                                    <div className="employee-item highlight-recent">
                                        <Grade
                                            lead_id={mostRecentEvaluation.lead_id ?? leadId}
                                            leader_name={mostRecentEvaluation.leader_name}
                                            lead_name={mostRecentEvaluation.lead_name || leadName || ""}
                                            date={mostRecentEvaluation.date}
                                            score={calculateWeightedScore(mostRecentEvaluation.answers)}
                                            badges={[{ label: "Mais Recente", variant: "recent" }]}
                                            onClick={() => setSelectedEvaluation(mostRecentEvaluation)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEvaluation(mostRecentEvaluation)}
                                            className="open-button"
                                        >
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            )}

                            {highestHierarchyEvaluation && (
                                <div className="grades-hierarchy-answers-box">
                                    <div className="grades-section-header">
                                        <span className="grades-section-title">
                                            Respostas Cadastradas (Maior Hierarquia)
                                        </span>
                                        <span className="grades-hierarchy-leader-pill">
                                            Líder: {highestHierarchyEvaluation.leader_name} (ID #
                                            {highestHierarchyEvaluation.leader_id}) • Nota:{" "}
                                            {calculateWeightedScore(highestHierarchyEvaluation.answers)}/100
                                        </span>
                                    </div>
                                    <div className="grades-answers-grid">
                                        {(highestHierarchyEvaluation.answers || []).map((ans, i) => (
                                            <div key={ans.answer_id ?? i} className="grades-answer-row">
                                                <div className="grades-answer-question">
                                                    <span className="grades-answer-qtext">
                                                        {ans.question_text || `Questão #${ans.question_id}`}
                                                    </span>
                                                    {ans.weight !== undefined && (
                                                        <span className="grades-answer-weight">
                                                            Peso: {ans.weight}%
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="grades-answer-grade">
                                                    Nota: {ans.grade}/4
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grades-history-section">
                                <div className="grades-section-header">
                                    <span className="grades-section-title">
                                        Histórico de Avaliações ({allEvaluations.length})
                                    </span>
                                </div>
                                {allEvaluations.map((evaluation, index) => {
                                    const badges: { label: string; variant?: "hierarchy" | "recent" }[] = [];
                                    if (
                                        highestHierarchyEvaluation &&
                                        (evaluation.id ?? -1) === (highestHierarchyEvaluation.id ?? -2)
                                    ) {
                                        badges.push({ label: "Maior Hierarquia", variant: "hierarchy" });
                                    }
                                    if (
                                        mostRecentEvaluation &&
                                        (evaluation.id ?? -1) === (mostRecentEvaluation.id ?? -2)
                                    ) {
                                        badges.push({ label: "Mais Recente", variant: "recent" });
                                    }
                                    return (
                                        <div key={evaluation.id ?? index} className="employee-item">
                                            <Grade
                                                lead_id={evaluation.lead_id ?? leadId}
                                                leader_name={evaluation.leader_name}
                                                lead_name={evaluation.lead_name || leadName || ""}
                                                date={evaluation.date}
                                                score={calculateWeightedScore(evaluation.answers)}
                                                badges={badges}
                                                onClick={() => setSelectedEvaluation(evaluation)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEvaluation(evaluation)}
                                                className="open-button"
                                            >
                                                Ver
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="grades-modal-footer">
                    <button
                        type="button"
                        className="grades-modal-close-btn"
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>

            {selectedEvaluation !== null && (
                <EvaluationModal
                    leader_id={selectedEvaluation.leader_id}
                    leadId={selectedEvaluation.lead_id}
                    leadName={selectedEvaluation.lead_name}
                    status="completed"
                    date={selectedEvaluation.date}
                    initialAnswers={selectedEvaluation.answers}
                    onClose={() => setSelectedEvaluation(null)}
                />
            )}
        </div>
    );
}