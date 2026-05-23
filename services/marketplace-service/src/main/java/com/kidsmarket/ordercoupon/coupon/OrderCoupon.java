package com.kidsmarket.ordercoupon.coupon;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "coupons", catalog = "kids_marketplace_order")
public class OrderCoupon {
  @Id
  @Column(length = 64)
  private String code;

  @Column(nullable = false, length = 64)
  private String userId;

  @Column(nullable = false)
  private int discount;

  @Column(nullable = false)
  private boolean used;

  @Column(nullable = false)
  private OffsetDateTime createdAt;

  @Column(nullable = false)
  private OffsetDateTime expiresAt;

  protected OrderCoupon() {}

  public OrderCoupon(
      String code,
      String userId,
      int discount,
      OffsetDateTime createdAt,
      OffsetDateTime expiresAt) {
    this.code = code;
    this.userId = userId;
    this.discount = discount;
    this.used = false;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  public String getCode() {
    return code;
  }

  public String getUserId() {
    return userId;
  }

  public int getDiscount() {
    return discount;
  }

  public boolean isUsed() {
    return used;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getExpiresAt() {
    return expiresAt;
  }

  public void markUsed() {
    this.used = true;
  }
}
