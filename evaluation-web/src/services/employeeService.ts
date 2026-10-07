import type { EmployeeGrade } from "../types/EmployeeGrade.type";
import type { HistoryEvaluationType } from "../types/HistoryEvaluation.type";
import { API_BASE_URL } from "../config/api";

const MOCK_EMPLOYEE_GRADE: EmployeeGrade[] = [
    {
        id: 1,
        lead_name: "Felipe",
        lead_id: 1,
        leader_name: "Manoel",
        leader_id: 1,
        grade: 100
    },
    {
        id: 2,
        lead_name: "Ana",
        lead_id: 2,
        leader_name: "Manoel",
        leader_id: 1,
        grade: 100
    },
    {
        id: 3,
        lead_name: "Pedro",
        lead_id: 3,
        leader_name: "Manoel",
        leader_id: 1,
        grade: 100
    },
    {
        id: 4,
        lead_name: "Jorge",
        lead_id: 4,
        leader_name: "Manoel",
        leader_id: 1,
        grade: 100
    },
    {
        id: 5,
        lead_name: "Caio",
        lead_id: 5,
        leader_name: "Manoel",
        leader_id: 1,
        grade: 100
    }
]

const MOCK_EMPLOYEE_ALL_GRADE: HistoryEvaluationType[] = [
    {
        id: 1,
        leader_id: 1,
        leader_name: "Manoel",
        lead_id: 1,
        lead_name: "Felipe",
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
        leader_id: 2,
        leader_name: "Mariana",
        lead_id: 1,
        lead_name: "Felipe",
        date: "2026-09-18 11:10:00",
        answers: [
            {
                answer_id: 7,
                question_id: 1,
                question_text: "Results Delivery",
                grade: 3,
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
                grade: 3,
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
                grade: 3,
                weight: 10
            }
        ]
    },
    {
        id: 3,
        leader_id: 3,
        leader_name: "Carlos",
        lead_id: 1,
        lead_name: "Felipe",
        date: "2026-08-05 09:45:00",
        answers: [
            {
                answer_id: 13,
                question_id: 1,
                question_text: "Results Delivery",
                grade: 4,
                weight: 25
            },
            {
                answer_id: 14,
                question_id: 2,
                question_text: "Execution and Work Quality",
                grade: 3,
                weight: 20
            },
            {
                answer_id: 15,
                question_id: 3,
                question_text: "Learning and Development Ability",
                grade: 3,
                weight: 20
            },
            {
                answer_id: 16,
                question_id: 4,
                question_text: "Problem Solving and Critical Thinking",
                grade: 4,
                weight: 15
            },
            {
                answer_id: 17,
                question_id: 5,
                question_text: "Collaboration, Influence and Leadership",
                grade: 3,
                weight: 10
            },
            {
                answer_id: 18,
                question_id: 6,
                question_text: "Strategic Vision and Growth Potential",
                grade: 4,
                weight: 10
            }
        ]
    }
]



/**
 * Fetch list of employees/leads under a leader.
 * Calls GET /leader/{leader_id}/leads/array
 */
export async function getLeaderEmployees(leaderId: string | number = 1): Promise<EmployeeGrade[]> {
    const id = leaderId || 1;
    try {
        const response = await fetch(`${API_BASE_URL}/leader/${id}/leads/array`, {
            method: 'GET',
        });

        if (!response.ok) {
            console.warn(`Failed to fetch leads for leader ${id}, using mock data`);
            return MOCK_EMPLOYEE_GRADE;
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => ({
                id: item.id,
                lead_id: item.lead_id ?? item.id,
                lead_name: item.lead_name ?? item.name ?? '',
                leader_name: item.leader_name ?? '',
                leader_id: item.leader_id ?? Number(id),
                grade: item.grade ?? 100,
            }));
        }

        return Array.isArray(data) ? data : MOCK_EMPLOYEE_GRADE;
    } catch (error) {
        console.warn('Error fetching leader employees, fallback to mock:', error);
        return MOCK_EMPLOYEE_GRADE;
    }
}

// Alias for backward compatibility
export const getEmployeeGrade = getLeaderEmployees;

/**
 * Fetch all evaluations received by a specific employee.
 * Calls GET /evaluation/employee/{employee_id}
 */
export async function getEmployeeAllGrade(
    employeeCode: string | number,
    leadName?: string,
    viewerId?: number
): Promise<HistoryEvaluationType[]> {
    try {
        const query = viewerId !== undefined ? `?viewer_id=${viewerId}` : '';
        const response = await fetch(`${API_BASE_URL}/evaluation/employee/${employeeCode}${query}`, {
            method: 'GET',
        });

        if (response.status === 403) {
            return [];
        }

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                return data;
            }
        }

        console.warn(`Failed to fetch evaluations for employee ${employeeCode}, using fallback mock data`);
        return MOCK_EMPLOYEE_ALL_GRADE.map((item, idx) => ({
            ...item,
            id: item.id ?? idx + 1,
            lead_id: Number(employeeCode) || item.lead_id,
            lead_name: leadName || item.lead_name,
        }));
    } catch (error) {
        console.warn('Error fetching employee evaluations, fallback to mock:', error);
        return MOCK_EMPLOYEE_ALL_GRADE.map((item, idx) => ({
            ...item,
            id: item.id ?? idx + 1,
            lead_id: Number(employeeCode) || item.lead_id,
            lead_name: leadName || item.lead_name,
        }));
    }
}