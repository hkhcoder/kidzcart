package com.kidsmarket.auth.dto;

import java.time.Instant;

public record CouponDto(String code, int discount, Instant expiresAt, boolean used) {}
