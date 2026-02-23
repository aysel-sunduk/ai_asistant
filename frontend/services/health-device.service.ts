// Kisa aciklama: Servis akislarini yonetir.
import { Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions } from 'react-native-health';
import {
    getSdkStatus,
    initialize,
    openHealthConnectSettings,
    readRecords,
    requestPermission
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
    // Debug: SDK durumunu logla
    // eslint-disable-next-line no-console
    console.log('HealthConnect SDK status:', sdkStatus);

    // Bazı cihazlarda SDK status enum farklı dönebilir; burada
    // izinleri zorlayacak şekilde daha toleranslı davranıyoruz.
    try {
        await initialize();
        const permissionResult = await requestPermission([
            { accessType: 'read', recordType: 'Steps' },
            { accessType: 'read', recordType: 'Distance' },
            { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
            { accessType: 'read', recordType: 'HeartRate' },
        ]);
        // eslint-disable-next-line no-console
        console.log('HealthConnect requestPermission result:', permissionResult);
    } catch (err) {
        // Eğer izin reddi veya benzeri bir problem varsa Health Connect ayarlarını aç
        const text = String(err || '').toLowerCase();
        if (text.includes('permission') || text.includes('denied') || text.includes('granted') === false) {
            try {
                openHealthConnectSettings();
            } catch {}
        }
        // Hata fırlat ki caller durumu göstersin
        throw err;
    }

    const range = {
        operator: 'between' as const,
        startTime: startOfTodayIso(),
        endTime: nowIso(),
    };
    // Debug: show time range used
    // eslint-disable-next-line no-console
    console.log('HealthConnect timeRange:', range);

    const safeRead = async <T extends 'Steps' | 'Distance' | 'ActiveCaloriesBurned' | 'HeartRate'>(recordType: T, useRange = range) => {
        try {
            return await readRecords(recordType, { timeRangeFilter: useRange });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('readRecords failed for', recordType, err);
            // Eğer SecurityException nedeniyle okunamıyorsa, Health Connect ayarlarını açarak
            // kullanıcıyı izin vermeye yönlendir.
            try {
                const msg = String(err || '').toLowerCase();
                if (msg.includes('read_steps') || msg.includes('read_distance') || msg.includes('read_heart') || msg.includes('read_active_calories') || msg.includes('securityexception')) {
                    // eslint-disable-next-line no-console
                    console.log('Opening Health Connect settings due to missing permission for', recordType);
                    openHealthConnectSettings();
                }
            } catch (e) {
                // ignore
            }
            return { records: [] };
        }
    };

    let [stepsRes, distanceRes, caloriesRes, heartRateRes] = await Promise.all([
        safeRead('Steps'),
        safeRead('Distance'),
        safeRead('ActiveCaloriesBurned'),
        safeRead('HeartRate'),
    ]);
    // Debug: her kayit tipinin uzunlugunu logla
    // eslint-disable-next-line no-console
    console.log('HealthConnect records:', {
        steps: (stepsRes.records || []).length,
        distance: (distanceRes.records || []).length,
        calories: (caloriesRes.records || []).length,
        heartRate: (heartRateRes.records || []).length,
    });

    // Dump up to first 5 raw records for each type to diagnose mapping/empty reads
    // eslint-disable-next-line no-console
    const dump = (name: string, res: any) => {
        const recs = res?.records || [];
        try {
            if (recs.length === 0) {
                console.log(`HealthConnect raw ${name}: empty`);
                return;
            }
            const sample = recs.slice(0, 5).map((r: any) => ({
                startTime: r.startTime, endTime: r.endTime, count: r.count, distance: r.distance, energy: r.energy, samples: r.samples?.length, source: r.source, raw: r,
            }));
            console.log(`HealthConnect raw ${name} (first ${Math.min(5, recs.length)}):`, sample);
        } catch (e) {
            console.warn('Failed to dump raw', name, e);
        }
    };

    dump('steps', stepsRes);
    dump('distance', distanceRes);
    dump('calories', caloriesRes);
    dump('heartRate', heartRateRes);

    // Diagnostic retry: if all record arrays are empty, retry with a wider (30-day) range
    const recordsAllEmpty = (s: any, d: any, c: any, h: any) =>
        [s, d, c, h].every((r) => !(r?.records) || (Array.isArray(r.records) && r.records.length === 0));

    if (recordsAllEmpty(stepsRes, distanceRes, caloriesRes, heartRateRes)) {
        // eslint-disable-next-line no-console
        console.warn('HealthConnect initial read empty — retrying with 30-day window');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const wideRange = { operator: 'between' as const, startTime: thirtyDaysAgo, endTime: nowIso() };

        const [rSteps, rDistance, rCalories, rHeartRate] = await Promise.all([
            safeRead('Steps', wideRange),
            safeRead('Distance', wideRange),
            safeRead('ActiveCaloriesBurned', wideRange),
            safeRead('HeartRate', wideRange),
        ]);

        // eslint-disable-next-line no-console
        console.log('HealthConnect retryCounts (30d):', {
            steps: (rSteps.records || []).length,
            distance: (rDistance.records || []).length,
            calories: (rCalories.records || []).length,
            heartRate: (rHeartRate.records || []).length,
        });

        // dump retry samples as well
        dump('steps(retry)', rSteps);
        dump('distance(retry)', rDistance);
        dump('calories(retry)', rCalories);
        dump('heartRate(retry)', rHeartRate);

        if (!recordsAllEmpty(rSteps, rDistance, rCalories, rHeartRate)) {
            // replace original results with retry results for snapshot construction
            stepsRes = rSteps;
            distanceRes = rDistance;
            caloriesRes = rCalories;
            heartRateRes = rHeartRate;
        }
    }

    // If still empty after 30-day retry, try an all-time retry (epoch -> now) as a last diagnostic
    if (recordsAllEmpty(stepsRes, distanceRes, caloriesRes, heartRateRes)) {
        // eslint-disable-next-line no-console
        console.warn('HealthConnect still empty after 30d — retrying with all-time window');
        const epoch = '1970-01-01T00:00:00.000Z';
        const allTimeRange = { operator: 'between' as const, startTime: epoch, endTime: nowIso() };

        const [aSteps, aDistance, aCalories, aHeartRate] = await Promise.all([
            safeRead('Steps', allTimeRange),
            safeRead('Distance', allTimeRange),
            safeRead('ActiveCaloriesBurned', allTimeRange),
            safeRead('HeartRate', allTimeRange),
        ]);

        // eslint-disable-next-line no-console
        console.log('HealthConnect retryCounts (all-time):', {
            steps: (aSteps.records || []).length,
            distance: (aDistance.records || []).length,
            calories: (aCalories.records || []).length,
            heartRate: (aHeartRate.records || []).length,
        });

        dump('steps(all)', aSteps);
        dump('distance(all)', aDistance);
        dump('calories(all)', aCalories);
        dump('heartRate(all)', aHeartRate);

        if (!recordsAllEmpty(aSteps, aDistance, aCalories, aHeartRate)) {
            stepsRes = aSteps;
            distanceRes = aDistance;
            caloriesRes = aCalories;
            heartRateRes = aHeartRate;
        }
    }

    // Extra diagnostic: some providers (Samsung Health) may write steps under
    // `StepsCadence` or other record types. If steps still empty, try that type.
    const tryAlternateStepTypes = async () => {
        try {
            // try StepsCadence with all-time range
            const epoch = '1970-01-01T00:00:00.000Z';
            const allTimeRange = { operator: 'between' as const, startTime: epoch, endTime: nowIso() };
            const alt = await safeRead('StepsCadence' as any, allTimeRange);
            // eslint-disable-next-line no-console
            console.log('HealthConnect alt steps (StepsCadence) count:', (alt.records || []).length);
            dump('steps(alt StepsCadence)', alt);
            if ((alt.records || []).length > 0) {
                stepsRes = alt;
            }
        } catch (e) {
            // ignore
        }
    };

    if ((stepsRes.records || []).length === 0) {
        await tryAlternateStepTypes();
    }

    const stepsCount = (stepsRes.records || []).reduce((sum, record) => sum + toNumber(record.count), 0);
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

    // Debug: iOS tarafında dönen değerleri logla
    // eslint-disable-next-line no-console
    console.log('HealthKit today:', { stepsCount, distanceKm, activeKcal, avgHeartRate });

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