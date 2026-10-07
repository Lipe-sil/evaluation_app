export type PendingEvaluationType = {
    id?: number | null;
    leader_id: number;
    leader_name: string;
    lead_id: number;
    lead_name: string;
    status: 'pending' | string;
    date?: string | null;
    answers?: any[];
};
