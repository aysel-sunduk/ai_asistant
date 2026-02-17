-- Allow longer symbol codes like SILVER_GRAM and GOLD_CUMHURIYET.

ALTER TABLE currency_rates
    ALTER COLUMN currency_code TYPE varchar(32),
    ALTER COLUMN base_currency TYPE varchar(32);

ALTER TABLE currency_rates_latest
    ALTER COLUMN currency_code TYPE varchar(32),
    ALTER COLUMN base_currency TYPE varchar(32);
