export interface InterviewQuestionDTO {
    id: string;
    questionText: string;
    answerText?: string;
    feedback?: string;
    score?: number;
    difficulty?: string;
    orderNo: number;
}

export interface InterviewSession {
    id: string;
    title: string;
    position: string;
    jobDescription?: string;
    interviewDate?: string;
    status: 'SETUP' | 'IN_PROGRESS' | 'COMPLETED';
    overallFeedback?: string;
    overallScore?: number;
    createdAt: string;
    questions: InterviewQuestionDTO[];
}

export interface CreateInterviewSessionRequest {
    title: string;
    position: string;
    jobDescription?: string;
    interviewDate?: string;
}

export interface UpdateInterviewSessionRequest {
    title?: string;
    position?: string;
    jobDescription?: string;
    interviewDate?: string;
}

export interface UpdateInterviewQuestionsRequest {
    questions: {
        questionText: string;
        difficulty?: string;
        orderNo: number;
    }[];
}

export interface SubmitAnswerRequest {
    questionId: string;
    answerText: string;
}

export interface ReorderQuestionsRequest {
    orders: {
        id: string;
        orderNo: number;
    }[];
}
