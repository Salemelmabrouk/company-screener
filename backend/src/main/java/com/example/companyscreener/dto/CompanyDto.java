package com.example.companyscreener.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDto {
    private Long id;
    private String name;
    private String sector;
    private String country;
    private String description;
    private Integer foundedYear;
    private Integer employeeCount;
}
