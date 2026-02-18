import type { ApiResponse } from '../models/auth.model';
import type { FamilyBirthdayPage, FamilyBirthdayRequest, FamilyBirthdayResponse } from '../models/family.model';
import apiClient from './client';

const BASE_PATH = '/v1/family';

export const familyApi = {
    getBirthdays: (page = 0, size = 50) =>
        apiClient.get<ApiResponse<FamilyBirthdayPage>>(`${BASE_PATH}/birthdays`, {
            params: { page, size },
        }),

    createBirthday: (data: FamilyBirthdayRequest) =>
        apiClient.post<ApiResponse<FamilyBirthdayResponse>>(`${BASE_PATH}/birthdays`, data),

    updateBirthday: (id: string, data: FamilyBirthdayRequest) =>
        apiClient.put<ApiResponse<FamilyBirthdayResponse>>(`${BASE_PATH}/birthdays/${id}`, data),

    deleteBirthday: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/birthdays/${id}`),
};
