package com.kidsmarket.ordercoupon.coupon;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderCouponRepository extends JpaRepository<OrderCoupon, String> {
  Optional<OrderCoupon> findByCodeAndUserId(String code, String userId);
}
