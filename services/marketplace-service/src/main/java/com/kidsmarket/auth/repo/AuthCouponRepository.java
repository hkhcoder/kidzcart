package com.kidsmarket.auth.repo;

import com.kidsmarket.auth.entity.Coupon;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthCouponRepository extends JpaRepository<Coupon, String> {

  List<Coupon> findByUserIdOrderByCreatedAtDesc(String userId);
}
