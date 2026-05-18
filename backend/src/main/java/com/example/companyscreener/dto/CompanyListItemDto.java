package com.example.companyscreener.dto;

public record CompanyListItemDto(
        Long id,
        String name,
        String sector,
        String country,
        String descriptionPreview,
        Integer foundedYear,
        Integer employeeCount
) {
}
