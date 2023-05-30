UPDATE public.port
SET
    country_name = 'United Kingdom',
    time_zone = 'Europe/London'
WHERE
    country_code = 'GBR'
    AND country_name IS NULL
    AND time_zone IS NULL;