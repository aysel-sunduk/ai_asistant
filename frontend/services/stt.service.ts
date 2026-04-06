import { sttApi } from '../src/api/stt.api';

export const sttService = {
    transcribe: async (fileUri: string) => {
        const formData = new FormData();
        const filename = fileUri.split('/').pop() || 'recording.m4a';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `audio/${match[1]}` : `audio/m4a`;

        formData.append('file', {
            uri: fileUri,
            name: filename,
            type,
        } as any);

        const response = await sttApi.transcribe(formData);
        return response.data.transcription;
    },
};
