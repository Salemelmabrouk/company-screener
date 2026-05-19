package com.example.companyscreener.service;

import com.example.companyscreener.entity.Company;
import com.example.companyscreener.dto.ChatMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.model}")
    private String groqModel;

    /**

     * Ask an AI question about a company.
     * Builds a prompt from the company data and sends it to the Groq API.
     */
    public String askAboutCompany(Company company, String userQuestion, List<ChatMessageDto> history) {
        String prompt = buildPrompt(company, userQuestion);
        log.debug("Sending AI request for company: {}", company.getName());

        try {
            return callGroqApi(prompt, history);
        } catch (Exception e) {
            log.error("Error calling Groq API for company {}: {}", company.getName(), e.getMessage());
            throw new RuntimeException("Failed to get AI response. Please check your API key and try again.", e);
        }
    }

    private String buildPrompt(Company company, String userQuestion) {
        return String.format("""
                You are a helpful financial and business analyst assistant.

                Here is information about a company:

                Name: %s
                Sector: %s
                Country: %s
                Founded: %d
                Employees: %,d
                Description: %s

                User question:
                "%s"

                Answer briefly and clearly in 2-3 sentences. Be factual and informative.
                """,
                company.getName(),
                company.getSector(),
                company.getCountry(),
                company.getFoundedYear(),
                company.getEmployeeCount(),
                company.getDescription(),
                userQuestion
        );
    }

    private String callGroqApi(String prompt, List<ChatMessageDto> history) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        // Build messages array: history + current prompt
        List<Map<String, String>> messages = new ArrayList<>();
        if (history != null) {
            for (ChatMessageDto msg : history) {
                messages.add(Map.of("role", msg.role(), "content", msg.content()));
            }
        }
        // Add the current prompt (which includes company context and current question)
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", messages,
                "max_tokens", 300,
                "temperature", 0.7
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                groqApiUrl,
                HttpMethod.POST,
                request,
                Map.class
        );

        return extractContent(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> responseBody) {
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Groq API");
        }

        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("No choices in Groq API response");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new RuntimeException("No message in Groq API response");
        }

        return (String) message.get("content");
    }
}
