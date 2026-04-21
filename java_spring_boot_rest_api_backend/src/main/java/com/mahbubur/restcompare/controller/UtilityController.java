package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.model.dto.StatsResponse;
import com.mahbubur.restcompare.api.ApiEndpoints;
import com.mahbubur.restcompare.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping(ApiEndpoints.API_BASE)
public class UtilityController {

    private final StatsService statsService;

    public UtilityController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "status", "ok",
                "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return statsService.getStats();
    }
}
