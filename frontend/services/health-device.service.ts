import { Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions } from 'react-native-health';
import {
    getSdkStatus,
    initialize,
    openHealthConnectSettings,
    readRecords,
    requestPermission,
} from 'react-native-health-connect';

export interface DeviceHealthSnapshot {
    source: 'health_connect' | 'apple_healthkit';
    date: string; // ISO yyyy-MM-dd
    stepsCount: number;
    distanceKm: number;
    activeKcal: number;
    avgHeartRate: number;
}

function startOfDateIso(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function endOfDateIso(date: Date): string {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

function toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return sum / values.length;
}

// Helper for safe read with Health Connect
const readRecordsSafe = async (type: any, options: any) => {
    try {
        return await readRecords(type, options);
    } catch (e) {
        console.warn('readRecords failed:', type, e);
        return { records: [] };
    }
};

async function readAndroidHealthConnectRange(days: number): Promise<DeviceHealthSnapshot[]> {
    try {
        await initialize();
        await requestPermission([
            { accessType: 'read', recordType: 'Steps' },
            { accessType: 'read', recordType: 'Distance' },
            { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
            { accessType: 'read', recordType: 'HeartRate' },
        ]);
    } catch (err) {
        console.warn('HealthConnect init/permission failed:', err);
        throw err;
    }

    const snapshots: DeviceHealthSnapshot[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const range = {
            operator: 'between' as const,
            startTime: startOfDateIso(targetDate),
            endTime: endOfDateIso(targetDate),
        };

        const [stepsRes, distanceRes, caloriesRes, heartRateRes] = await Promise.all([
            readRecordsSafe('Steps', { timeRangeFilter: range }),
            readRecordsSafe('Distance', { timeRangeFilter: range }),
            readRecordsSafe('ActiveCaloriesBurned', { timeRangeFilter: range }),
            readRecordsSafe('HeartRate', { timeRangeFilter: range }),
        ]);

        const stepsCount = (stepsRes.records || []).reduce((sum: number, r: any) => sum + toNumber(r.count), 0);
        const distanceKm = (distanceRes.records || []).reduce((sum: number, r: any) => sum + toNumber(r.distance?.inKilometers), 0);
        const activeKcal = (caloriesRes.records || []).reduce((sum: number, r: any) => sum + toNumber(r.energy?.inKilocalories), 0);
        const bpmValues = (heartRateRes.records || []).flatMap((r: any) => (r.samples ?? []).map((s: any) => toNumber(s.beatsPerMinute)));
        const avgHeartRate = average(bpmValues);

        if (stepsCount > 0 || distanceKm > 0 || activeKcal > 0 || avgHeartRate > 0) {
            snapshots.push({
                source: 'health_connect',
                date: dateStr,
                stepsCount: Math.round(stepsCount),
                distanceKm: Number(distanceKm.toFixed(2)),
                activeKcal: Math.round(activeKcal),
                avgHeartRate: Math.round(avgHeartRate),
            });
        }
    }
    return snapshots;
}

function initHealthKit(permissions: HealthKitPermissions): Promise<void> {
    return new Promise((resolve, reject) => {
        AppleHealthKit.initHealthKit(permissions, (error) => {
            if (error) {
                reject(new Error(String(error)));
                return;
            }
            resolve();
        });
    });
}

function getStepCount(startDate: string, endDate: string): Promise<number> {
    return new Promise((resolve) => {
        AppleHealthKit.getStepCount({ startDate, endDate }, (_err, result) => {
            resolve(toNumber((result as { value?: number })?.value));
        });
    });
}

function getDistanceWalkingRunning(startDate: string, endDate: string): Promise<number> {
    return new Promise((resolve) => {
        AppleHealthKit.getDistanceWalkingRunning({ startDate, endDate }, (_err, result) => {
            resolve(toNumber((result as { value?: number })?.value));
        });
    });
}

function getActiveEnergy(startDate: string, endDate: string): Promise<number> {
    return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned({ startDate, endDate }, (_err, results) => {
            const list = Array.isArray(results) ? results : [];
            const total = list.reduce((sum, item) => sum + toNumber((item as { value?: number })?.value), 0);
            resolve(total);
        });
    });
}

function getHeartRateAverage(startDate: string, endDate: string): Promise<number> {
    return new Promise((resolve) => {
        AppleHealthKit.getHeartRateSamples({ startDate, endDate }, (_err, results) => {
            const list = Array.isArray(results) ? results : [];
            const values = list
                .map((item) => toNumber((item as { value?: number })?.value))
                .filter((v) => v > 0);
            resolve(average(values));
        });
    });
}

async function readIosHealthKitRange(days: number): Promise<DeviceHealthSnapshot[]> {
    const perms = AppleHealthKit.Constants.Permissions;
    const permissions: HealthKitPermissions = {
        permissions: {
            read: [perms.StepCount, perms.DistanceWalkingRunning, perms.ActiveEnergyBurned, perms.HeartRate],
            write: [],
        },
    };
    await initHealthKit(permissions);

    const snapshots: DeviceHealthSnapshot[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const startDate = startOfDateIso(targetDate);
        const endDate = endOfDateIso(targetDate);

        const [stepsCount, distanceKm, activeKcal, avgHeartRate] = await Promise.all([
            getStepCount(startDate, endDate),
            getDistanceWalkingRunning(startDate, endDate),
            getActiveEnergy(startDate, endDate),
            getHeartRateAverage(startDate, endDate),
        ]);

        if (stepsCount > 0 || distanceKm > 0 || activeKcal > 0 || avgHeartRate > 0) {
            snapshots.push({
                source: 'apple_healthkit',
                date: dateStr,
                stepsCount: Math.round(stepsCount),
                distanceKm: Number(distanceKm.toFixed(2)),
                activeKcal: Math.round(activeKcal),
                avgHeartRate: Math.round(avgHeartRate),
            });
        }
    }
    return snapshots;
}

export const healthDeviceService = {
    syncToday: async (): Promise<DeviceHealthSnapshot> => {
        const snapshots = await healthDeviceService.syncRange(1);
        if (snapshots.length === 0) {
            return {
                source: Platform.OS === 'android' ? 'health_connect' : 'apple_healthkit',
                stepsCount: 0,
                distanceKm: 0,
                activeKcal: 0,
                avgHeartRate: 0,
                date: new Date().toISOString().split('T')[0],
            };
        }
        return snapshots[0];
    },
    syncRange: async (days: number): Promise<DeviceHealthSnapshot[]> => {
        if (Platform.OS === 'android') {
            try {
                return await readAndroidHealthConnectRange(days);
            } catch (error) {
                if (String(error).toLowerCase().includes('permission')) {
                    openHealthConnectSettings();
                }
                throw error;
            }
        }
        if (Platform.OS === 'ios') {
            return readIosHealthKitRange(days);
        }
        throw new Error('Bu platformda saglik entegrasyonu desteklenmiyor.');
    },
};