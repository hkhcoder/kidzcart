package com.kidsmarket.ordercoupon.order;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders", catalog = "kids_marketplace_order")
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 64)
  private String userId;

  @Lob
  @Column(nullable = false)
  private String itemsJson;

  @Column(nullable = false)
  private int subtotal;

  @Column(nullable = false)
  private int discountApplied;

  @Column(nullable = false)
  private int total;

  @Column(nullable = true, length = 64)
  private String couponCode;

  @Column(nullable = false, length = 32)
  private String paymentStatus;

  @Column(nullable = false)
  private OffsetDateTime createdAt;

  protected Order() {}

  public Order(
      String userId,
      String itemsJson,
      int subtotal,
      int discountApplied,
      int total,
      String couponCode,
      String paymentStatus,
      OffsetDateTime createdAt) {
    this.userId = userId;
    this.itemsJson = itemsJson;
    this.subtotal = subtotal;
    this.discountApplied = discountApplied;
    this.total = total;
    this.couponCode = couponCode;
    this.paymentStatus = paymentStatus;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public String getUserId() {
    return userId;
  }

  public String getItemsJson() {
    return itemsJson;
  }

  public int getSubtotal() {
    return subtotal;
  }

  public int getDiscountApplied() {
    return discountApplied;
  }

  public int getTotal() {
    return total;
  }

  public String getCouponCode() {
    return couponCode;
  }

  public String getPaymentStatus() {
    return paymentStatus;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
