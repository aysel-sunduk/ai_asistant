import apiClient from './client';

export interface AuthUrlResponse {
  authUrl: string;
}

export interface StatusResponse {
  connected: boolean;
  email?: string;
}

export interface ConnectRequest {
  code: string;
  redirectUri: string;
}

export const googleCalendarApi = {
  getAuthUrl: (redirectUri: string) =>
    apiClient.get<{ data: AuthUrlResponse }>(`/v1/integrations/google-calendar/auth-url`, { params: { redirectUri } }),

  connect: (data: ConnectRequest) =>
    apiClient.post<{ data: StatusResponse }>(`/v1/integrations/google-calendar/connect`, data),

  getStatus: () =>
    apiClient.get<{ data: StatusResponse }>(`/v1/integrations/google-calendar/status`),

  disconnect: () =>
    apiClient.delete(`/v1/integrations/google-calendar/disconnect`),

  resync: () =>
    apiClient.post<{ data: { synced: number } }>(`/v1/integrations/google-calendar/resync`),
};
