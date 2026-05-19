package com.example.companyscreener.controller;

import com.example.companyscreener.dto.*;
import com.example.companyscreener.entity.Company;
import com.example.companyscreener.service.AiService;
import com.example.companyscreener.service.CompanyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final AiService aiService;

    /**
     * GET /api/companies?page=0&size=12&search=stripe&sector=FinTech
     * Paginated + filtered company list for the main list view.
     */
    @GetMapping
    public ResponseEntity<PagedResponse<CompanyListItemDto>> getAllCompanies(
            @RequestParam(defaultValue = "0")  @Min(0)           int    page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(100) int    size,
            @RequestParam(required = false)                       String search,
            @RequestParam(required = false)                       String sector
    ) {
        return ResponseEntity.ok(companyService.getAllCompanies(page, size, search, sector));
    }

    /**
     * GET /api/companies/all
     * Returns the FULL unpaginated list. Used by the watchlist and sector chart.
     * Assignment requirement: "Return the full list of companies".
     */
    @GetMapping("/all")
    public ResponseEntity<List<CompanyListItemDto>> getAllCompaniesUnpaged() {
        return ResponseEntity.ok(companyService.getAllCompaniesUnpaged());
    }

    /**
     * GET /api/companies/sectors
     * Returns distinct sector names for the filter dropdown.
     */
    @GetMapping("/sectors")
    public ResponseEntity<List<String>> getSectors() {
        return ResponseEntity.ok(companyService.getSectors());
    }

    /**
     * GET /api/companies/sector-distribution
     * Returns sector name + company count for the distribution chart.
     */
    @GetMapping("/sector-distribution")
    public ResponseEntity<List<SectorCountDto>> getSectorDistribution() {
        return ResponseEntity.ok(companyService.getSectorDistribution());
    }

    /**
     * GET /api/companies/{id}
     * Returns full company detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CompanyDto> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    /**
     * POST /api/companies/{id}/ask
     * AI question about a company.
     * Body: { "question": "...", "history": [...] }
     */
    @PostMapping("/{id}/ask")
    public ResponseEntity<AiAnswerResponse> askQuestion(
            @PathVariable Long id,
            @Valid @RequestBody AiQuestionRequest request
    ) {
        log.info("AI question for company {}: {}", id, request.getQuestion());
        Company company = companyService.getCompanyEntityById(id);
        String answer = aiService.askAboutCompany(company, request.getQuestion(), request.getHistory());
        return ResponseEntity.ok(new AiAnswerResponse(answer));
    }
}
