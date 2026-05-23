package com.kidsmarket.ordercoupon.order.dto;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CheckoutRequest(
    @NotBlank String userId, @NotEmpty List<Item> items, String couponCode) {
  public record Item(
      @NotBlank String productId,
      @NotBlank String name,
      @Min(1) int price,
      @Min(1) int qty) {}
}
