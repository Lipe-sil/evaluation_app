
export type AnswerType = {
    question_id: number;
    grade: number;
}

export type PostEvaluationType = {
    leader_id: number;
    lead_id: number;
    answers: AnswerType[];
};