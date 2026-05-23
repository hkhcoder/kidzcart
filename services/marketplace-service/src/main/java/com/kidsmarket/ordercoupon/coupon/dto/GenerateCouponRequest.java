package com.kidsmarket.ordercoupon.coupon.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record GenerateCouponRequest(
    @NotBlank String userId, @Min(1) @Max(90) int discount) {}
