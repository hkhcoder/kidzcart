package com.kidsmarket.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
    @NotBlank String name, @NotBlank String email, @NotBlank String password) {}
