package com.example.companyscreener.controller;

import com.example.companyscreener.dto.AiAnswerResponse;
import com.example.companyscreener.dto.AiQuestionRequest;
import com.example.companyscreener.dto.CompanyDto;
import com.example.companyscreener.dto.CompanyListItemDto;
import com.example.companyscreener.dto.PagedResponse;
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

@Slf4j
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final AiService aiService;

    /**
     * GET /api/companies?page=0&size=10&search=stripe&sector=FinTech
     *
     * Returns a paginated, optionally filtered page of companies.
     * All query params are optional.
     */
    @GetMapping
    public ResponseEntity<PagedResponse<CompanyListItemDto>> getAllCompanies(
            @RequestParam(defaultValue = "0")   @Min(0)              int    page,
            @RequestParam(defaultValue = "10")  @Min(1) @Max(100)    int    size,
            @RequestParam(required = false)                           String search,
            @RequestParam(required = false)                           String sector
    ) {
        return ResponseEntity.ok(companyService.getAllCompanies(page, size, search, sector));
    }

    /**
     * GET /api/companies/sectors
     */
    @GetMapping("/sectors")
    public ResponseEntity<java.util.List<String>> getSectors() {
        return ResponseEntity.ok(companyService.getSectors());
    }

    /**
     * GET /api/companies/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CompanyDto> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    /**
     * POST /api/companies/{id}/ask
     * Body: { "question": "..." }
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
