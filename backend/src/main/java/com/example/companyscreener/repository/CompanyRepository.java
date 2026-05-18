package com.example.companyscreener.repository;

import com.example.companyscreener.dto.CompanyListItemDto;
import com.example.companyscreener.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    @Query(value = """
        SELECT new com.example.companyscreener.dto.CompanyListItemDto(
            c.id,
            c.name,
            c.sector,
            c.country,
            SUBSTRING(c.description, 1, 140),
            c.foundedYear,
            c.employeeCount
        )
        FROM Company c
        WHERE (
            :search IS NULL
            OR :search = ''
            OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.sector) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.country) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            :sector IS NULL
            OR :sector = ''
            OR c.sector = :sector
        )
        """,
        countQuery = """
        SELECT COUNT(c) FROM Company c
        WHERE (
            :search IS NULL
            OR :search = ''
            OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.sector) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.country) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            :sector IS NULL
            OR :sector = ''
            OR c.sector = :sector
        )
        """)
    Page<CompanyListItemDto> findListByFilters(
            @Param("search") String search,
            @Param("sector") String sector,
            Pageable pageable
    );

    @Query("SELECT DISTINCT c.sector FROM Company c ORDER BY c.sector")
    List<String> findDistinctSectors();
}
