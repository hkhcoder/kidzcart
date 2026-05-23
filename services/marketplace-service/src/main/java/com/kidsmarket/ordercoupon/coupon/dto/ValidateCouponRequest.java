package com.kidsmarket.ordercoupon.coupon.dto;

import jakarta.validation.constraints.NotBlank;

public record ValidateCouponRequest(@NotBlank String userId, @NotBlank String code) {}
