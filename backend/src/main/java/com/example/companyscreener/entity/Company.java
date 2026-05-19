package com.example.companyscreener.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Entity
@Table(
    name = "companies",
    indexes = {
        @Index(name = "idx_companies_sector", columnList = "sector"),
        @Index(name = "idx_companies_country", columnList = "country")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 255)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String sector;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String country;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Positive
    @Column(name = "founded_year")
    private Integer foundedYear;

    @Positive
    @Column(name = "employee_count")
    private Integer employeeCount;
}
