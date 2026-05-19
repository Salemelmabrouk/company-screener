package com.example.companyscreener.dto;

import java.util.List;

public record GroqRequest(
    String model,
    List<GroqMessage> messages,
    int max_tokens,
    double temperature
) {}
