package com.example.companyscreener.dto;

import java.util.List;

public record GroqResponse(
    List<Choice> choices
) {
    public record Choice(
        GroqMessage message
    ) {}
}
