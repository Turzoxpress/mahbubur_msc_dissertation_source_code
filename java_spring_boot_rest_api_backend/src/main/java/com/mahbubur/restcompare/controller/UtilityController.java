package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.dto.StatsResponse;
import com.mahbubur.restcompare.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
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
