import { interviewApi } from '../src/api/interview.api';
import type { 
    CreateInterviewSessionRequest, 
    UpdateInterviewQuestionsRequest,
    SubmitAnswerRequest
} from '../src/models/interview.model';

export const interviewService = {
    createSession: async (request: CreateInterviewSessionRequest) => {
        const response = await interviewApi.createSession(request);
        return response.data;
    },

    getSession: async (id: string) => {
        const response = await interviewApi.getSession(id);
        return response.data;
    },

    updateQuestions: async (id: string, request: UpdateInterviewQuestionsRequest) => {
        const response = await interviewApi.updateQuestions(id, request);
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
