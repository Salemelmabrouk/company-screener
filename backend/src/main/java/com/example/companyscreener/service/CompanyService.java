package com.example.companyscreener.service;

import com.example.companyscreener.dto.CompanyDto;
import com.example.companyscreener.dto.CompanyListItemDto;
import com.example.companyscreener.dto.PagedResponse;
import com.example.companyscreener.dto.SectorCountDto;
import com.example.companyscreener.entity.Company;

import java.util.List;

public interface CompanyService {

    /** Paginated + filtered list (main list view). */
    PagedResponse<CompanyListItemDto> getAllCompanies(int page, int size, String search, String sector);

    /** Full unpaginated list — used by watchlist and sector chart. */
    List<CompanyListItemDto> getAllCompaniesUnpaged();

    /** Full company detail by id. */
    CompanyDto getCompanyById(Long id);

    /** Raw entity for AiService prompt building. */
    Company getCompanyEntityById(Long id);

    /** All distinct sector names, sorted. */
    List<String> getSectors();

    /** Company count grouped by sector — for the sector distribution chart. */
    List<SectorCountDto> getSectorDistribution();
}
