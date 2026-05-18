package com.example.companyscreener.repository;

import com.example.companyscreener.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    @Query("""
        SELECT c FROM Company c
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
    Page<Company> findByFilters(
            @Param("search") String search,
            @Param("sector") String sector,
            Pageable pageable
    );
}