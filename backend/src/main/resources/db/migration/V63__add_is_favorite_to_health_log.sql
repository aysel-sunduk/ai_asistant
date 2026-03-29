-- Sağlık loglarına favori durumu ekleme
-- V62__add_is_favorite_to_health_log.sql

ALTER TABLE health_logs ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
