package com.kidsmarket.ordercoupon.coupon;

import java.time.OffsetDateTime;

import com.kidsmarket.ordercoupon.coupon.dto.GenerateCouponRequest;
import com.kidsmarket.ordercoupon.coupon.dto.ValidateCouponRequest;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/coupon")
public class CouponController {
  private final CouponIssuanceService issuance;
  private final OrderCouponRepository orderCouponRepository;

  public CouponController(CouponIssuanceService issuance, OrderCouponRepository orderCouponRepository) {
    this.issuance = issuance;
    this.orderCouponRepository = orderCouponRepository;
  }

  @PostMapping("/generate")
  public OrderCoupon generate(@Valid @RequestBody GenerateCouponRequest req) {
    return issuance.issueDonationStyle(req.userId(), req.discount());
  }

  @PostMapping("/validate")
  public ValidateResponse validate(@Valid @RequestBody ValidateCouponRequest req) {
    OrderCoupon coupon =
        orderCouponRepository
            .findByCodeAndUserId(req.code(), req.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

    if (coupon.isUsed()) {
      return new ValidateResponse(false, "USED", coupon.getDiscount());
    }
    if (coupon.getExpiresAt().isBefore(OffsetDateTime.now())) {
      return new ValidateResponse(false, "EXPIRED", coupon.getDiscount());
    }
    return new ValidateResponse(true, "OK", coupon.getDiscount());
  }

  public record ValidateResponse(boolean valid, String reason, int discount) {}
}
