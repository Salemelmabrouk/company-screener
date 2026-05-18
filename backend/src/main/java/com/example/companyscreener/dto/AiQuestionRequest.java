package com.example.companyscreener.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiQuestionRequest {

    @NotBlank(message = "Question cannot be blank")
    private String question;
}
