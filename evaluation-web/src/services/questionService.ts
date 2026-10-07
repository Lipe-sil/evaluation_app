import type { QuestionType } from "../types/Question.type";

import { API_BASE_URL } from "../config/api";

const DEFAULT_QUESTIONS: QuestionType[] = [
    {
        id: 1,
        question_text: "Results Delivery",
        weight: 25,
    },
    {
        id: 2,
        question_text: "Execution and Work Quality",
        weight: 20,
    },
    {
        id: 3,
        question_text: "Learning and Development Ability",
        weight: 20,
    },
    {
        id: 4,
        question_text: "Problem Solving and Critical Thinking",
        weight: 15,
    },
    {
        id: 5,
        question_text: "Collaboration, Influence and Leadership",
        weight: 10,
    },
    {
        id: 6,
        question_text: "Strategic Vision and Growth Potential",
        weight: 10,
    },
];

export async function getQuestions(): Promise<QuestionType[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/questions`);
        if (!response.ok) {
            throw new Error(`Failed to fetch questions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.warn("Backend unavailable, using default questions:", error);
        return DEFAULT_QUESTIONS;
    }
}

export async function GetNextEvaluationDate(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluation/next-evaluation-date`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch next evaluation date: ${response.statusText}`);
        }
        const data = await response.json();
        return data.next_evaluation_date;
    } catch (error) {
        console.warn("Backend unavailable, calculating fallback next evaluation date:", error);
        // Fallback: calculate next Monday
        const now = new Date();
        const daysUntilMonday = ((1 + 7 - now.getDay()) % 7) || 7;
        const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
        return nextMonday.toISOString().split("T")[0];
    }
}
