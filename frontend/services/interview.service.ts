import { interviewApi } from '../src/api/interview.api';
import type {
    CreateInterviewSessionRequest,
    UpdateInterviewSessionRequest,
    UpdateInterviewQuestionsRequest,
    ReorderQuestionsRequest,
    SubmitAnswerRequest
} from '../src/models/interview.model';

export const interviewService = {
    listMySessions: async () => {
        const response = await interviewApi.listMySessions();
        return response.data;
    },

    createSession: async (request: CreateInterviewSessionRequest) => {
        const response = await interviewApi.createSession(request);
        return response.data;
    },

    getSession: async (id: string) => {
        const response = await interviewApi.getSession(id);
        return response.data;
    },

    updateSession: async (id: string, request: UpdateInterviewSessionRequest) => {
        const response = await interviewApi.updateSession(id, request);
        return response.data;
    },

    deleteSession: async (id: string) => {
        await interviewApi.deleteSession(id);
    },

    updateQuestions: async (id: string, request: UpdateInterviewQuestionsRequest) => {
        const response = await interviewApi.updateQuestions(id, request);
        return response.data;
    },

    deleteQuestion: async (id: string) => {
        await interviewApi.deleteQuestion(id);
    },

    reorderQuestions: async (id: string, request: ReorderQuestionsRequest) => {
        const response = await interviewApi.reorderQuestions(id, request);
        return response.data;
    },

    generateQuestions: async (id: string) => {
        const response = await interviewApi.generateQuestions(id);
        return response.data;
    },

    startInterview: async (id: string) => {
        await interviewApi.startInterview(id);
    },

    submitAnswer: async (request: SubmitAnswerRequest) => {
        await interviewApi.submitAnswer(request);
    },

    submitVideoAnswer: async (questionId: string, fileUri: string) => {
        const formData = new FormData();
        const filename = fileUri.split('/').pop() || 'answer.mp4';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `video/${match[1]}` : `video/mp4`;

        formData.append('file', {
            uri: fileUri,
            name: filename,
            type,
        } as any);

        const response = await interviewApi.submitVideoAnswer(questionId, formData);
        return response.data;
    },

    analyzeInterview: async (id: string) => {
        const response = await interviewApi.analyzeInterview(id);
        return response.data;
    }
};
