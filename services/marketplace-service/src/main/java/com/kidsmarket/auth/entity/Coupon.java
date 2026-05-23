package com.kidsmarket.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "coupons", catalog = "kids_marketplace_auth")
public class Coupon {

  @Id
  @Column(name = "code", length = 64)
  private String code;

  @Column(name = "user_id", length = 32, nullable = false)
  private String userId;

  @Column(name = "discount", nullable = false)
  private int discount;

  @Column(name = "used", nullable = false)
  private boolean used;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  public String getCode() {
    return code;
  }

  public int getDiscount() {
    return discount;
  }

  public boolean isUsed() {
    return used;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }
}
