-- Expand health log source values for Apple HealthKit and Android Health Connect sync.

ALTER TABLE IF EXISTS public.health_logs
    DROP CONSTRAINT IF EXISTS chk_health_logs_source_allowed;

ALTER TABLE IF EXISTS public.health_logs
    ADD CONSTRAINT chk_health_logs_source_allowed
    CHECK (source IN (
        'manual',
        'mobile_device',
        'apple_health',
        'apple_healthkit',
        'google_fit',
        'health_connect',
        'other'
    ));
