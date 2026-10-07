import type { AllEvaluationsType } from "../types/AllEvaluations.type";
import type { HistoryEvaluationType } from "../types/HistoryEvaluation.type";
import type { PendingEvaluationType } from "../types/PendingEvaluation.type";
import type { PostEvaluationType } from "../types/PostEvaluation.type";
import { API_BASE_URL } from "../config/api";

const MOCK_ALL_EVALUATIONS: AllEvaluationsType[] = [
    {
        id: 1,
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 2,
        lead_name: "Bob Sinclair",
        status: "completed",
        date: "2026-10-04 14:24:26",
        answers: [
            {
                answer_id: 1,
                question_id: 1,
                question_text: "Results Delivery",
                grade: 4,
                weight: 25
            },
            {
                answer_id: 2,
                question_id: 2,
                question_text: "Execution and Work Quality",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 3,
                question_id: 3,
                question_text: "Learning and Development Ability",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 4,
                question_id: 4,
                question_text: "Problem Solving and Critical Thinking",
                grade: 4,
                weight: 15
            },
            {
                answer_id: 5,
                question_id: 5,
                question_text: "Collaboration, Influence and Leadership",
                grade: 4,
                weight: 10
            },
            {
                answer_id: 6,
                question_id: 6,
                question_text: "Strategic Vision and Growth Potential",
                grade: 4,
                weight: 10
            }
        ]
    },
    {
        id: 2,
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 3,
        lead_name: "Carol Nguyen",
        status: "pending"
    }
];

const MOCK_HISTORY_EVALUATIONS: HistoryEvaluationType[] = [
    {
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 3,
        lead_name: "Carol Nguyen",
        date: "2026-10-04 16:29:16",
        answers: [
            {
                answer_id: 7,
                question_id: 1,
                question_text: "Results Delivery",
                grade: 4,
                weight: 25
            },
            {
                answer_id: 8,
                question_id: 2,
                question_text: "Execution and Work Quality",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 9,
                question_id: 3,
                question_text: "Learning and Development Ability",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 10,
                question_id: 4,
                question_text: "Problem Solving and Critical Thinking",
                grade: 4,
                weight: 15
            },
            {
                answer_id: 11,
                question_id: 5,
                question_text: "Collaboration, Influence and Leadership",
                grade: 4,
                weight: 10
            },
            {
                answer_id: 12,
                question_id: 6,
                question_text: "Strategic Vision and Growth Potential",
                grade: 4,
                weight: 10
            }
        ]
    },
    {
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 2,
        lead_name: "Bob Sinclair",
        date: "2026-10-04 14:24:26",
        answers: [
            {
                answer_id: 1,
                question_id: 1,
                question_text: "Results Delivery",
                grade: 4,
                weight: 25
            },
            {
                answer_id: 2,
                question_id: 2,
                question_text: "Execution and Work Quality",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 3,
                question_id: 3,
                question_text: "Learning and Development Ability",
                grade: 4,
                weight: 20
            },
            {
                answer_id: 4,
                question_id: 4,
                question_text: "Problem Solving and Critical Thinking",
                grade: 4,
                weight: 15
            },
            {
                answer_id: 5,
                question_id: 5,
                question_text: "Collaboration, Influence and Leadership",
                grade: 4,
                weight: 10
            },
            {
                answer_id: 6,
                question_id: 6,
                question_text: "Strategic Vision and Growth Potential",
                grade: 4,
                weight: 10
            }
        ]
    }
];

const MOCK_PENDING_EVALUATIONS: PendingEvaluationType[] = [
    {
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 2,
        lead_name: "Bob Sinclair",
        status: "pending",
    },
    {
        leader_id: 1,
        leader_name: "Alice Hartman",
        lead_id: 3,
        lead_name: "Charlie Davis",
        status: "pending",
    }
];

export async function getAllEvaluations(leaderId: number = 1): Promise<AllEvaluationsType[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/all?leader_id=${leaderId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch all evaluations: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn('Backend unavailable, using mock data for getAllEvaluations:', error);
        return MOCK_ALL_EVALUATIONS;
    }
}

export async function getEvaluationsHistory(leaderId: number = 1): Promise<HistoryEvaluationType[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/history?leader_id=${leaderId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch history evaluations: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn('Backend unavailable, using mock data for getEvaluationsHistory:', error);
        return MOCK_HISTORY_EVALUATIONS;
    }
}

function normalizePendingEvaluations(data: any, defaultLeaderId: number = 1): PendingEvaluationType[] {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data;
    }

    // Backend returns hierarchy tree: { id, name, status, leads: [...] }
    const result: PendingEvaluationType[] = [];
    const rootLeaderId = data.id ?? defaultLeaderId;
    const rootLeaderName = data.name ?? '';

    function flattenNode(node: any) {
        if (!node) return;

        if (Array.isArray(node.leads)) {
            for (const child of node.leads) {
                if (child.status === 'pending' || !child.status) {
                    result.push({
                        id: child.evaluation_id ?? null,
                        leader_id: rootLeaderId,
                        leader_name: rootLeaderName,
                        lead_id: child.id,
                        lead_name: child.name,
                        status: 'pending',
                        date: null,
                        answers: [],
                    });
                }
                flattenNode(child);
            }
        }
    }

    flattenNode(data);
    return result;
}

export async function getEvaluationPending(leaderId: number = 1): Promise<PendingEvaluationType[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/pending?leader_id=${leaderId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch pending evaluations: ${response.statusText}`);
        }
        const data = await response.json();
        return normalizePendingEvaluations(data, leaderId);
    } catch (error) {
        console.warn('Backend unavailable, using mock data for getEvaluationPending:', error);
        return MOCK_PENDING_EVALUATIONS;
    }
}

export interface EvaluationHistoryFilterParams {
    leader_id: number;
    order?: 'DATE' | 'LAST';
    date_from?: string | null;
    date_to?: string | null;
}

export async function getEvaluationsHistoryFiltered(
    params: EvaluationHistoryFilterParams
): Promise<HistoryEvaluationType[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch filtered history: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Backend unavailable, using mock data for getEvaluationsHistoryFiltered:', error);
        return MOCK_HISTORY_EVALUATIONS;
    }
}

export async function PostEvaluation(data: PostEvaluationType): Promise<any> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/evaluation/submit`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }
        );
        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.detail || `Error submitting evaluation: ${response.statusText}`);
        }
        return await response.json();
    } catch (error: any) {
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
            throw error;
        }
        console.warn('Backend server unavailable, simulated POST evaluation success:', error);

        const pendingIdx = MOCK_PENDING_EVALUATIONS.findIndex((p) => p.lead_id === data.lead_id);
        if (pendingIdx !== -1) {
            const removed = MOCK_PENDING_EVALUATIONS.splice(pendingIdx, 1)[0];

            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

            const allItem = MOCK_ALL_EVALUATIONS.find((a) => a.lead_id === data.lead_id);
            if (allItem) {
                allItem.status = 'completed';
                allItem.date = nowStr;
                allItem.answers = data.answers.map((a, i) => ({
                    answer_id: 100 + i,
                    question_id: a.question_id,
                    grade: a.grade,
                }));
            }

            MOCK_HISTORY_EVALUATIONS.unshift({
                id: Date.now(),
                leader_id: data.leader_id,
                leader_name: removed.leader_name,
                lead_id: data.lead_id,
                lead_name: removed.lead_name,
                date: nowStr,
                answers: data.answers.map((a, i) => ({
                    answer_id: 100 + i,
                    question_id: a.question_id,
                    grade: a.grade,
                })),
            });
        }

        return 'success';
    }
}
