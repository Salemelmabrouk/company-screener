package com.example.companyscreener.service;

import com.example.companyscreener.dto.CompanyDto;
import com.example.companyscreener.dto.CompanyListItemDto;
import com.example.companyscreener.dto.PagedResponse;
import com.example.companyscreener.dto.SectorCountDto;
import com.example.companyscreener.entity.Company;
import com.example.companyscreener.exception.CompanyNotFoundException;
import com.example.companyscreener.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    public PagedResponse<CompanyListItemDto> getAllCompanies(int page, int size, String search, String sector) {
        size = Math.max(1, Math.min(size, 100));

        Pageable pageable = PageRequest.of(
            page, size,
            Sort.by(Sort.Order.asc("name").ignoreCase(), Sort.Order.asc("id"))
        );

        // Pass empty string instead of null to keep JPQL CAST logic consistent
        String searchTerm = StringUtils.hasText(search) ? search.trim() : "";
        String sectorTerm = StringUtils.hasText(sector) ? sector.trim() : "";

        log.debug("Fetching companies page={} size={} search='{}' sector='{}'", page, size, searchTerm, sectorTerm);

        return PagedResponse.from(companyRepository.findListByFilters(searchTerm, sectorTerm, pageable));
    }

    @Override
    public List<CompanyListItemDto> getAllCompaniesUnpaged() {
        log.debug("Fetching all companies unpaged");
        return companyRepository.findAllProjected(Sort.by(Sort.Order.asc("name").ignoreCase()));
    }

    @Override
    public CompanyDto getCompanyById(Long id) {
        log.debug("Fetching company id={}", id);
        return toDto(companyRepository.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with id: " + id)));
    }

    @Override
    public Company getCompanyEntityById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with id: " + id));
    }

    @Override
    public List<String> getSectors() {
        return companyRepository.findDistinctSectors();
    }

    @Override
    public List<SectorCountDto> getSectorDistribution() {
        return companyRepository.countBySector();
    }

    private CompanyDto toDto(Company c) {
        return CompanyDto.builder()
                .id(c.getId())
                .name(c.getName())
                .sector(c.getSector())
                .country(c.getCountry())
                .description(c.getDescription())
                .foundedYear(c.getFoundedYear())
                .employeeCount(c.getEmployeeCount())
                .build();
    }
}
