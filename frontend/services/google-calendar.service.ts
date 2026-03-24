import { googleCalendarApi } from '../src/api/google-calendar.api';

export const googleCalendarService = {
  getAuthUrl: async (redirectUri: string) => {
    const response = await googleCalendarApi.getAuthUrl(redirectUri);
    return response.data.data;
  },

  connect: async (code: string, redirectUri: string) => {
    const response = await googleCalendarApi.connect({ code, redirectUri });
    return response.data.data;
  },

  getStatus: async () => {
    const response = await googleCalendarApi.getStatus();
    return response.data.data;
  },

  disconnect: async () => {
    await googleCalendarApi.disconnect();
  },

  resync: async () => {
    const response = await googleCalendarApi.resync();
    return response.data.data;
  },
};
