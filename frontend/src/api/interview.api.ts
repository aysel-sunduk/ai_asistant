import apiClient from './client';
import type {
    InterviewSession,
    CreateInterviewSessionRequest,
    UpdateInterviewSessionRequest,
    UpdateInterviewQuestionsRequest,
    ReorderQuestionsRequest,
    SubmitAnswerRequest
} from '../models/interview.model';

export const interviewApi = {
    listMySessions: () =>
        apiClient.get<InterviewSession[]>('/v1/ai/interview/my-sessions'),

    createSession: (data: CreateInterviewSessionRequest) =>
        apiClient.post<InterviewSession>('/v1/ai/interview/create', data),

    getSession: (id: string) =>
        apiClient.get<InterviewSession>(`/v1/ai/interview/${id}`),

    updateSession: (id: string, data: UpdateInterviewSessionRequest) =>
        apiClient.put<InterviewSession>(`/v1/ai/interview/${id}`, data),

    deleteSession: (id: string) =>
        apiClient.delete<void>(`/v1/ai/interview/${id}`),

    updateQuestions: (id: string, data: UpdateInterviewQuestionsRequest) =>
        apiClient.put<InterviewSession>(`/v1/ai/interview/${id}/questions`, data),

    deleteQuestion: (id: string) =>
        apiClient.delete<void>(`/v1/ai/interview/question/${id}`),

    reorderQuestions: (id: string, data: ReorderQuestionsRequest) =>
        apiClient.put<InterviewSession>(`/v1/ai/interview/${id}/questions/reorder`, data),

    generateQuestions: (id: string) =>
        apiClient.post<InterviewSession>(`/v1/ai/interview/${id}/generate-questions`),

    startInterview: (id: string) =>
        apiClient.post<void>(`/v1/ai/interview/${id}/start`),

    submitAnswer: (data: SubmitAnswerRequest) =>
        apiClient.post<void>('/v1/ai/interview/answer', data),

    submitVideoAnswer: (questionId: string, formData: FormData) =>
        apiClient.post<string>('/v1/ai/interview/answer-video', formData, {
            params: { questionId },
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    analyzeInterview: (id: string) =>
        apiClient.post<InterviewSession>(`/v1/ai/interview/${id}/analyze`),
};
