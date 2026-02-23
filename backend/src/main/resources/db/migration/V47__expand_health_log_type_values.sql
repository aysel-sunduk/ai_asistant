-- Expand health log type values to match HealthLogService accepted types.

ALTER TABLE IF EXISTS public.health_logs
    DROP CONSTRAINT IF EXISTS chk_health_logs_log_type_allowed;

ALTER TABLE IF EXISTS public.health_logs
    ADD CONSTRAINT chk_health_logs_log_type_allowed
    CHECK (log_type IN (
        'daily_summary',
        'water',
        'exercise',
        'meal',
        'steps',
        'distance',
        'active_calories',
        'resting_calories',
        'heart_rate',
        'sleep'
    ));
