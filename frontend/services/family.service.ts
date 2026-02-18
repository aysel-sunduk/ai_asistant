import { familyApi } from '../src/api/family.api';
import type {
    FamilyBirthdayPage,
    FamilyBirthdayRequest,
    FamilyBirthdayResponse,
} from '../src/models/family.model';

export const familyService = {
    getBirthdays: async (page = 0, size = 50): Promise<FamilyBirthdayPage> => {
        const response = await familyApi.getBirthdays(page, size);
        return response.data.data;
    },

    createBirthday: async (data: FamilyBirthdayRequest): Promise<FamilyBirthdayResponse> => {
        const response = await familyApi.createBirthday(data);
        return response.data.data;
    },

    updateBirthday: async (id: string, data: FamilyBirthdayRequest): Promise<FamilyBirthdayResponse> => {
        const response = await familyApi.updateBirthday(id, data);
        return response.data.data;
    },

    deleteBirthday: async (id: string): Promise<void> => {
        await familyApi.deleteBirthday(id);
    },
};
