package com.kidsmarket.auth.dto;

import java.util.List;

public record MeResponse(UserDto user, List<CouponDto> coupons) {}
