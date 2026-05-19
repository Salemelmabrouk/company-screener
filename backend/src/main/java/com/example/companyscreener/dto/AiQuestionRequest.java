package com.example.companyscreener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiQuestionRequest {

    @NotBlank(message = "Question cannot be blank")
    @Size(max = 1000, message = "Question must not exceed 1000 characters")
    private String question;

    // Optional conversation history for multi-turn chat
    // Capped server-side in AiService to prevent token abuse
    private List<ChatMessageDto> history;
}
