package com.example.companyscreener.service;

import com.example.companyscreener.dto.ChatMessageDto;
import com.example.companyscreener.entity.Company;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
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

    // Max messages to send from history to avoid exceeding token limits
    private static final int MAX_HISTORY_MESSAGES = 10;

    public String askAboutCompany(Company company, String userQuestion, List<ChatMessageDto> history) {
        log.debug("AI request for company={} question={}", company.getName(), userQuestion);

        // Validate API key is configured
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiKey.equals("your-groq-api-key-here")) {
            throw new RuntimeException("Groq API key is not configured. Set the GROQ_API_KEY environment variable.");
        }

        try {
            return callGroqApi(company, userQuestion, history);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("Groq API unauthorized — invalid API key");
            throw new RuntimeException("Invalid Groq API key. Please check your GROQ_API_KEY.", e);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Groq API rate limit hit");
            throw new RuntimeException("AI rate limit reached. Please wait a moment and try again.", e);
        } catch (HttpClientErrorException e) {
            log.error("Groq API client error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI request failed: " + e.getStatusCode(), e);
        } catch (HttpServerErrorException e) {
            log.error("Groq API server error {}", e.getStatusCode());
            throw new RuntimeException("AI service is temporarily unavailable. Please try again.", e);
        } catch (ResourceAccessException e) {
            log.error("Cannot reach Groq API: {}", e.getMessage());
            throw new RuntimeException("Cannot reach the AI service. Check your network connection.", e);
        } catch (Exception e) {
            log.error("Unexpected error calling Groq API for company {}: {}", company.getName(), e.getMessage(), e);
            throw new RuntimeException("Failed to get AI response. Please try again.", e);
        }
    }

    private String callGroqApi(Company company, String userQuestion, List<ChatMessageDto> history) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        List<Map<String, String>> messages = new ArrayList<>();

        // System message sets the AI's role with company context
        messages.add(Map.of(
            "role", "system",
            "content", buildSystemPrompt(company)
        ));

        // Add conversation history (trimmed to prevent token overflow)
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
            for (int i = start; i < history.size(); i++) {
                ChatMessageDto msg = history.get(i);
                if ("user".equals(msg.role()) || "assistant".equals(msg.role())) {
                    messages.add(Map.of("role", msg.role(), "content", msg.content()));
                }
            }
        }

        // Add current user question
        messages.add(Map.of("role", "user", "content", userQuestion));

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", messages,
            "max_tokens", 400,
            "temperature", 0.7
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            groqApiUrl, HttpMethod.POST, request, Map.class
        );

        return extractContent(response.getBody());
    }

    private String buildSystemPrompt(Company company) {
        return String.format("""
            You are a helpful financial and business analyst assistant.
            Answer questions about the following company concisely in 2-4 sentences.
            Be factual, informative, and professional.

            Company profile:
            - Name: %s
            - Sector: %s
            - Country: %s
            - Founded: %d
            - Employees: %,d
            - Description: %s
            """,
            company.getName(),
            company.getSector(),
            company.getCountry(),
            company.getFoundedYear(),
            company.getEmployeeCount(),
            company.getDescription()
        );
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
