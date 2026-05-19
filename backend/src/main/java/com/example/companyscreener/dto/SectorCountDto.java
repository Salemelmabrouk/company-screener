package com.example.companyscreener.dto;

/**
 * Sector name + company count — used by the sector distribution chart.
 */
public record SectorCountDto(String sector, long count) {}
