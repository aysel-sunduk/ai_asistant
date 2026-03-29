-- V68: Add health_goal_favorites table for favorite foods functionality
CREATE TABLE IF NOT EXISTS public.health_goal_favorites (
    user_id UUID NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_health_goal_favorites_user FOREIGN KEY (user_id) REFERENCES public.health_goals(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_goal_favorites_user_id ON public.health_goal_favorites(user_id);
-- No unique constraint on user_id + food_name here to be simple, @ElementCollection will handle it.
