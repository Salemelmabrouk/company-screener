-- Supports stable name-sorted pagination, exact sector filtering,
-- and case-insensitive substring search on the screener fields.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_companies_name_id
    ON companies (name, id);

CREATE INDEX IF NOT EXISTS idx_companies_sector_name_id
    ON companies (sector, name, id);

CREATE INDEX IF NOT EXISTS idx_companies_lower_name_trgm
    ON companies USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_companies_lower_sector_trgm
    ON companies USING gin (lower(sector) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_companies_lower_country_trgm
    ON companies USING gin (lower(country) gin_trgm_ops);
