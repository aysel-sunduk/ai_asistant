import apiClient from '../src/api/client';

export const sttService = {
  /**
   * Ses dosyasını (wav/m4a) backend'e gönderir ve metni döner.
   */
  async transcribe(uri: string): Promise<string> {
    const formData = new FormData();
    
    // React Native'de dosya gönderimi için özel format
    // URI'nin başına 'file://' eklenmiş olabilir veya olmayabilir
    const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    
    formData.append('file', {
      uri: fileUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as any);

    const response = await apiClient.post<{ transcription: string }>('/stt/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.transcription;
  },
};
