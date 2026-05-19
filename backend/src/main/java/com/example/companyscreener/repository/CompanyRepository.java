package com.example.companyscreener.repository;

import com.example.companyscreener.dto.CompanyListItemDto;
import com.example.companyscreener.dto.SectorCountDto;
import com.example.companyscreener.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Paginated + filtered list.
     * Uses :search = '' fallback to avoid the lower(bytea) PostgreSQL type error
     * when null params are passed — CAST AS string forces text type resolution.
     */
    @Query(value = """
        SELECT new com.example.companyscreener.dto.CompanyListItemDto(
            c.id, c.name, c.sector, c.country,
            SUBSTRING(c.description, 1, 140),
            c.foundedYear, c.employeeCount
        )
        FROM Company c
        WHERE (
            CAST(:search AS string) IS NULL
            OR CAST(:search AS string) = ''
            OR LOWER(c.name)    LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.sector)  LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.country) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            CAST(:sector AS string) IS NULL
            OR CAST(:sector AS string) = ''
            OR c.sector = :sector
        )
        """,
        countQuery = """
        SELECT COUNT(c) FROM Company c
        WHERE (
            CAST(:search AS string) IS NULL
            OR CAST(:search AS string) = ''
            OR LOWER(c.name)    LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.sector)  LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.country) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            CAST(:sector AS string) IS NULL
            OR CAST(:sector AS string) = ''
            OR c.sector = :sector
        )
        """)
    Page<CompanyListItemDto> findListByFilters(
            @Param("search") String search,
            @Param("sector") String sector,
            Pageable pageable
    );

    /**
     * Full list — no pagination. Used by watchlist endpoint and sector chart.
     * Lightweight projection (no description).
     */
    @Query("""
        SELECT new com.example.companyscreener.dto.CompanyListItemDto(
            c.id, c.name, c.sector, c.country,
            SUBSTRING(c.description, 1, 140),
            c.foundedYear, c.employeeCount
        )
        FROM Company c
        """)
    List<CompanyListItemDto> findAllProjected(Sort sort);

    /** All distinct sectors sorted alphabetically. */
    @Query("SELECT DISTINCT c.sector FROM Company c ORDER BY c.sector")
    List<String> findDistinctSectors();

    /** Company count per sector — for the pie/bar chart. */
    @Query("SELECT new com.example.companyscreener.dto.SectorCountDto(c.sector, COUNT(c)) FROM Company c GROUP BY c.sector ORDER BY COUNT(c) DESC")
    List<SectorCountDto> countBySector();
}
