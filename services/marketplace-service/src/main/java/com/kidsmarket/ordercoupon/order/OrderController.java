package com.kidsmarket.ordercoupon.order;

import java.time.OffsetDateTime;
import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidsmarket.ordercoupon.coupon.OrderCoupon;
import com.kidsmarket.ordercoupon.coupon.OrderCouponRepository;
import com.kidsmarket.ordercoupon.order.dto.CheckoutRequest;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/orders")
public class OrderController {
  private final OrderRepository orderRepository;
  private final OrderCouponRepository orderCouponRepository;
  private final ObjectMapper objectMapper;

  public OrderController(
      OrderRepository orderRepository,
      OrderCouponRepository orderCouponRepository,
      ObjectMapper objectMapper) {
    this.orderRepository = orderRepository;
    this.orderCouponRepository = orderCouponRepository;
    this.objectMapper = objectMapper;
  }

  @PostMapping("/checkout")
  public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest req) {
    int subtotal = req.items().stream().mapToInt(i -> i.price() * i.qty()).sum();

    int discountApplied = 0;
    String couponCode =
        (req.couponCode() == null || req.couponCode().isBlank()) ? null : req.couponCode().trim();

    if (couponCode != null) {
      OrderCoupon coupon =
          orderCouponRepository
              .findByCodeAndUserId(couponCode, req.userId())
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

      if (coupon.isUsed()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon already used");
      if (coupon.getExpiresAt().isBefore(OffsetDateTime.now()))
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon expired");

      discountApplied = (int) Math.floor(subtotal * (coupon.getDiscount() / 100.0));
      coupon.markUsed();
      orderCouponRepository.save(coupon);
    }

    int total = Math.max(0, subtotal - discountApplied);
    String itemsJson = toJson(req.items());

    Order order =
        new Order(
            req.userId(),
            itemsJson,
            subtotal,
            discountApplied,
            total,
            couponCode,
            "PAID_MOCK",
            OffsetDateTime.now());

    Order saved = orderRepository.save(order);

    return new CheckoutResponse(
        saved.getId(),
        saved.getSubtotal(),
        saved.getDiscountApplied(),
        saved.getTotal(),
        saved.getCouponCode(),
        saved.getPaymentStatus(),
        saved.getCreatedAt().toString());
  }

  @GetMapping
  public List<Order> list(@RequestParam String userId) {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  private String toJson(Object o) {
    try {
      return objectMapper.writeValueAsString(o);
    } catch (JsonProcessingException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize items");
    }
  }

  public record CheckoutResponse(
      Long orderId,
      int subtotal,
      int discountApplied,
      int total,
      String couponCode,
      String paymentStatus,
      String createdAt) {}
}
