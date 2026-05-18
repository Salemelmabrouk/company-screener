package com.example.companyscreener.service;

import com.example.companyscreener.dto.CompanyDto;
import com.example.companyscreener.entity.Company;
import org.springframework.data.domain.Page;

public interface CompanyService {

    /**
     * Returns a paginated list of companies with optional
     * keyword search and sector filter.
     *
     * @param page   zero-based page index
     * @param size   page size (clamped 1-100)
     * @param search optional keyword matched on name/sector/country
     * @param sector optional exact sector filter
     */
    Page<CompanyDto> getAllCompanies(int page, int size, String search, String sector);

    CompanyDto getCompanyById(Long id);

    Company getCompanyEntityById(Long id);
}
