-- Migration V2: Fix ip_address column type from inet to varchar
-- Reason: Hibernate JPA validation expects varchar for String columns

ALTER TABLE refresh_tokens
ALTER COLUMN ip_address TYPE varchar(39) USING ip_address::text;
