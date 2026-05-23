package com.kidsmarket.auth.dto;

public record AuthResponse(UserDto user, String token) {}
