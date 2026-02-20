import { Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions } from 'react-native-health';
import {
    getSdkStatus,
    initialize,
    readRecords,
    requestPermission,
    SdkAvailabilityStatus,
    openHealthConnectSettings,
} from 'react-native-health-connect';

export interface DeviceHealthSnapshot {
    source: 'health_connect' | 'apple_healthkit';
    stepsCount: number;
    distanceKm: number;
    activeKcal: number;
    avgHeartRate: number;
}

function startOfTodayIso(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

function nowIso(): string {
    return new Date().toISOString();
}

function toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return sum / values.length;
}

async function readAndroidHealthConnectToday(): Promise<DeviceHealthSnapshot> {
    const sdkStatus = await getSdkStatus();

    if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        throw new Error('Health Connect kullanilabilir degil. Lutfen cihazda Health Connect kurulu ve aktif olsun.');
    }
    await initialize();

    await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'HeartRate' },
    ]);

    const range = {
        operator: 'between' as const,
        startTime: startOfTodayIso(),
        endTime: nowIso(),
    };

    const safeRead = async <T extends 'Steps' | 'Distance' | 'ActiveCaloriesBurned' | 'HeartRate'>(recordType: T) => {
        try {
            return await readRecords(recordType, { timeRangeFilter: range });
        } catch {
            return { records: [] };
        }
    };

    const [stepsRes, distanceRes, caloriesRes, heartRateRes] = await Promise.all([
        safeRead('Steps'),
        safeRead('Distance'),
        safeRead('ActiveCaloriesBurned'),
        safeRead('HeartRate'),
    ]);

    const stepsCount = stepsRes.records.reduce((sum, record) => sum + toNumber(record.count), 0);
    const distanceKm = distanceRes.records.reduce(
        (sum, record) => sum + toNumber(record.distance?.inKilometers),
        0,
    );
    const activeKcal = caloriesRes.records.reduce(
        (sum, record) => sum + toNumber(record.energy?.inKilocalories),
        0,
    );

    const bpmValues = heartRateRes.records.flatMap((record) =>
        (record.samples ?? []).map((sample) => toNumber(sample.beatsPerMinute)),
    );
    const avgHeartRate = average(bpmValues);

    return {
        source: 'health_connect',
        stepsCount: Math.round(stepsCount),
        distanceKm: Number(distanceKm.toFixed(2)),
        activeKcal: Math.round(activeKcal),
        avgHeartRate: Math.round(avgHeartRate),
    };
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

async function readIosHealthKitToday(): Promise<DeviceHealthSnapshot> {
    const perms = AppleHealthKit.Constants.Permissions;
    const permissions: HealthKitPermissions = {
        permissions: {
            read: [
                perms.StepCount,
                perms.DistanceWalkingRunning,
                perms.ActiveEnergyBurned,
                perms.HeartRate,
            ],
            write: [],
        },
    };

    await initHealthKit(permissions);

    const startDate = startOfTodayIso();
    const endDate = nowIso();

    const [stepsCount, distanceKm, activeKcal, avgHeartRate] = await Promise.all([
        getStepCount(startDate, endDate),
        getDistanceWalkingRunning(startDate, endDate),
        getActiveEnergy(startDate, endDate),
        getHeartRateAverage(startDate, endDate),
    ]);

    return {
        source: 'apple_healthkit',
        stepsCount: Math.round(stepsCount),
        distanceKm: Number(distanceKm.toFixed(2)),
        activeKcal: Math.round(activeKcal),
        avgHeartRate: Math.round(avgHeartRate),
    };
}

export const healthDeviceService = {
    syncToday: async (): Promise<DeviceHealthSnapshot> => {
        if (Platform.OS === 'android') {
            try {
                return await readAndroidHealthConnectToday();
            } catch (error) {
                if (String(error).toLowerCase().includes('permission')) {
                    openHealthConnectSettings();
                }
                throw error;
            }
        }

        if (Platform.OS === 'ios') {
            return readIosHealthKitToday();
        }

        throw new Error('Bu platformda saglik entegrasyonu desteklenmiyor.');
    },
};
