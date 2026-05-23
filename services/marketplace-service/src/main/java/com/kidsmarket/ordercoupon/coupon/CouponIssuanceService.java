package com.kidsmarket.ordercoupon.coupon;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;

import org.springframework.stereotype.Service;

/**
 * Creates {@link OrderCoupon} rows in the order DB (same as {@code POST /coupon/generate}).
 */
@Service
public class CouponIssuanceService {

  private final OrderCouponRepository orderCouponRepository;
  private final SecureRandom secureRandom = new SecureRandom();
  private final HexFormat hex = HexFormat.of().withUpperCase();

  public CouponIssuanceService(OrderCouponRepository orderCouponRepository) {
    this.orderCouponRepository = orderCouponRepository;
  }

  /** e.g. DONATE-AB12CD — 30-day validity; called from donation flow via {@code POST /coupon/generate}. */
  public OrderCoupon issueDonationStyle(String userId, int discountPercent) {
    return issue(userId, discountPercent, "DONATE-");
  }

  private OrderCoupon issue(String userId, int discountPercent, String prefix) {
    String code = prefix + randomHex(6);
    OffsetDateTime now = OffsetDateTime.now();
    OrderCoupon coupon =
        new OrderCoupon(code, userId, discountPercent, now, now.plusDays(30));
    return orderCouponRepository.save(coupon);
  }

  private String randomHex(int bytes) {
    byte[] b = new byte[bytes];
    secureRandom.nextBytes(b);
    return hex.formatHex(b);
  }
}
