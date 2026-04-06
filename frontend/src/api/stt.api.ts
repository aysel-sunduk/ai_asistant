import apiClient from './client';

export const sttApi = {
    transcribe: (formData: FormData) => 
        apiClient.post<{ transcription: string }>('/stt/transcribe', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
};
