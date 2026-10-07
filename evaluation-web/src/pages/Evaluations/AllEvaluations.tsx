import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAllEvaluations } from '../../services/evaluationService';
import { getStoredUser } from '../../services/loginService';
import type { AllEvaluationsType } from '../../types/AllEvaluations.type';
import { Leads } from '../../components/Leads/Leads';
import { EvaluationModal } from '../../components/Modal/EvaluationModal/EvaluationModal';

export function AllEvaluations() {
    const [evaluations, setEvaluations] = useState<AllEvaluationsType[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<AllEvaluationsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const contextLeaderId = useOutletContext<number | undefined>();
    const leader = getStoredUser();
    const leaderId = contextLeaderId ?? leader?.id ?? 1;

    async function loadEvaluations() {
        try {
            setIsLoading(true);
            const data = await getAllEvaluations(leaderId);
            setEvaluations(data);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadEvaluations();
    }, [leaderId]);

    const safeEvaluations = (Array.isArray(evaluations) ? evaluations : []).filter(
        (e) => (e.lead_id ?? e.id) !== leaderId
    );

    return (
        <div>
            {isLoading ? (
                <p>Carregando avaliações...</p>
            ) : safeEvaluations.length === 0 ? (
                <p>Nenhuma avaliação encontrada para os seus liderados.</p>
            ) : (
                <ul style={{ padding: 0, margin: 0 }}>
                    {safeEvaluations.map((evaluation, index) => (
                        <Leads
                            key={`${evaluation.id ?? 'pending'}-${evaluation.lead_id}-${evaluation.status}-${index}`}
                            leadId={evaluation.lead_id ?? evaluation.id}
                            name={evaluation.lead_name}
                            leaderName={evaluation.leader_name}
                            status={evaluation.status as 'pending' | 'completed'}
                            date={evaluation.date ?? undefined}
                            onClick={() => setSelectedEvaluation(evaluation)}
                        />
                    ))}
                </ul>
            )}

            {selectedEvaluation !== null && (
                <EvaluationModal
                    leader_id={leaderId}
                    leadId={(selectedEvaluation.lead_id ?? selectedEvaluation.id) ?? 0}
                    leadName={selectedEvaluation.lead_name}
                    status={selectedEvaluation.status}
                    date={selectedEvaluation.date ?? undefined}
                    initialAnswers={selectedEvaluation.answers}
                    onClose={() => setSelectedEvaluation(null)}
                    onEvaluationSubmitted={() => {
                        setSelectedEvaluation(null);
                        loadEvaluations();
                    }}
                />
            )}
        </div>
    );
}