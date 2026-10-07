import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEvaluationsHistory } from '../../services/evaluationService';
import { getStoredUser } from '../../services/loginService';
import type { HistoryEvaluationType } from '../../types/HistoryEvaluation.type';
import { Leads } from '../../components/Leads/Leads';
import { EvaluationModal } from '../../components/Modal/EvaluationModal/EvaluationModal';

export function HistoryEvaluations() {
    const [history, setHistory] = useState<HistoryEvaluationType[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<HistoryEvaluationType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const contextLeaderId = useOutletContext<number | undefined>();
    const leader = getStoredUser();
    const leaderId = contextLeaderId ?? leader?.id ?? 1;

    async function loadHistory() {
        try {
            setIsLoading(true);
            const data = await getEvaluationsHistory(leaderId);
            setHistory(data);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadHistory();
    }, [leaderId]);

    const safeHistory = (Array.isArray(history) ? history : []).filter(
        (e) => e.lead_id !== leaderId
    );

    return (
        <div>
            {isLoading ? (
                <p>Carregando histórico de avaliações...</p>
            ) : safeHistory.length === 0 ? (
                <p>Nenhuma avaliação concluída encontrada.</p>
            ) : (
                <ul style={{ padding: 0, margin: 0 }}>
                    {safeHistory.map((evaluation, index) => (
                        <Leads
                            key={evaluation.id ?? `${evaluation.lead_id}-${index}`}
                            leadId={evaluation.lead_id}
                            name={evaluation.lead_name}
                            leaderName={evaluation.leader_name}
                            status="completed"
                            date={evaluation.date}
                            onClick={() => setSelectedEvaluation(evaluation)}
                        />
                    ))}
                </ul>
            )}

            {selectedEvaluation !== null && (
                <EvaluationModal
                    leader_id={leaderId}
                    leadId={selectedEvaluation.lead_id}
                    leadName={selectedEvaluation.lead_name}
                    status="completed"
                    date={selectedEvaluation.date}
                    initialAnswers={selectedEvaluation.answers}
                    onClose={() => setSelectedEvaluation(null)}
                    onEvaluationSubmitted={() => {
                        setSelectedEvaluation(null);
                        loadHistory();
                    }}
                />
            )}
        </div>
    );
}