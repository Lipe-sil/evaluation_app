import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEvaluationPending } from '../../services/evaluationService';
import { getStoredUser } from '../../services/loginService';
import type { PendingEvaluationType } from '../../types/PendingEvaluation.type';
import { Leads } from '../../components/Leads/Leads';
import { EvaluationModal } from '../../components/Modal/EvaluationModal/EvaluationModal';

export function PendingEvaluations() {
    const [evaluations, setEvaluations] = useState<PendingEvaluationType[]>([]);
    const [selectedLead, setSelectedLead] = useState<PendingEvaluationType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const contextLeaderId = useOutletContext<number | undefined>();
    const leader = getStoredUser();
    const leaderId = contextLeaderId ?? leader?.id ?? 1;

    async function loadEvaluations() {
        try {
            setIsLoading(true);
            const data = await getEvaluationPending(leaderId);
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
                <p>Carregando avaliações pendentes...</p>
            ) : safeEvaluations.length === 0 ? (
                <p>Nenhuma avaliação pendente encontrada.</p>
            ) : (
                <ul style={{ padding: 0, margin: 0 }}>
                    {safeEvaluations.map((evaluation, index) => (
                        <Leads
                            key={evaluation.id ?? `${evaluation.lead_id}-${index}`}
                            leadId={evaluation.lead_id ?? evaluation.id}
                            name={evaluation.lead_name}
                            leaderName={evaluation.leader_name}
                            status="pending"
                            onClick={() => setSelectedLead(evaluation)}
                        />
                    ))}
                </ul>
            )}

            {selectedLead !== null && (
                <EvaluationModal
                    leader_id={leaderId}
                    leadId={selectedLead.lead_id ?? selectedLead.id ?? 0}
                    leadName={selectedLead.lead_name}
                    status="pending"
                    onClose={() => setSelectedLead(null)}
                    onEvaluationSubmitted={() => {
                        setSelectedLead(null);
                        loadEvaluations();
                    }}
                />
            )}
        </div>
    );
}