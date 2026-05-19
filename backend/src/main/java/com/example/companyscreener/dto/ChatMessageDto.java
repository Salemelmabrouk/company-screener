package com.example.companyscreener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * A single chat message in the conversation history.
 * Role must be "user" or "assistant" — never "error" (filtered client-side).
 */
public record ChatMessageDto(

    @NotBlank
    @Pattern(regexp = "user|assistant", message = "Role must be 'user' or 'assistant'")
    String role,

    @NotBlank
    @jakarta.validation.constraints.Size(max = 4000, message = "Message content too long")
    String content
) {}
