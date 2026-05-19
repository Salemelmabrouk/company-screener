-- Supports case-insensitive sorting on name without triggering a filesort.
-- This aligns with Sort.by(Sort.Order.asc("name").ignoreCase()) in CompanyServiceImpl.

CREATE INDEX IF NOT EXISTS idx_companies_lower_name
    ON companies (lower(name));
