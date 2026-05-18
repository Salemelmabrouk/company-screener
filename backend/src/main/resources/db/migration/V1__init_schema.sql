-- ============================================================
-- V1__init_schema.sql
-- Creates the companies table. NO seed data here — data goes
-- in V2 only. Using BIGSERIAL so the sequence is never broken
-- by manual id inserts.
-- ============================================================

CREATE TABLE IF NOT EXISTS companies
(
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(255) NOT NULL UNIQUE,
    sector         VARCHAR(255) NOT NULL,
    country        VARCHAR(255) NOT NULL,
    description    TEXT,
    founded_year   INTEGER,
    employee_count INTEGER
);
