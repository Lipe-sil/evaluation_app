export type EvaluationAnswerType = {
    answer_id?: number;
    question_id: number;
    question_text?: string;
    grade: number;
    weight?: number;
};

export type HistoryEvaluationType = {
    id?: number;
    leader_id: number;
    leader_name: string;
    lead_id: number;
    lead_name: string;
    status?: string;
    date: string;
    answers: EvaluationAnswerType[];
    hierarchy_depth?: number;
    is_highest_hierarchy?: boolean;
    is_most_recent?: boolean;
};
