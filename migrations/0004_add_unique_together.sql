alter table mds_v_md_cedat_exclusion_rules
  ADD CONSTRAINT mds_v_md_cedat_exclusion_rules_unique_together
    UNIQUE (carrier, arrival_port, departure_port, flight_no, trailing_char, std_start_date, std_end_date, is_current);

-- Finds duplicate entries
--
-- select country_md_code, count(*)
-- from mds_v_md_countries
-- where is_current = 1
-- group by country_md_code
-- HAVING count(*) > 1;
--
-- select servicetype_code, count(*)
-- from mds_v_md_servicetypes
-- where is_current = 1
-- group by servicetype_code
-- HAVING count(*) > 1;
