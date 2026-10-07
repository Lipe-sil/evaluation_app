import type { EvaluationAnswerType } from "./HistoryEvaluation.type";

export type AllEvaluationsType = {
    id: number | null;
    leader_id: number;
    leader_name: string;
    lead_id: number;
    lead_name: string;
    status: 'pending' | 'completed' | string;
    date?: string | null;
    answers?: EvaluationAnswerType[];
};