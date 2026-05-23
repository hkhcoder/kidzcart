package com.kidsmarket.auth.service;

import com.kidsmarket.auth.dto.AuthResponse;
import com.kidsmarket.auth.dto.CouponDto;
import com.kidsmarket.auth.dto.LoginRequest;
import com.kidsmarket.auth.dto.MeResponse;
import com.kidsmarket.auth.dto.SignupRequest;
import com.kidsmarket.auth.dto.UserDto;
import com.kidsmarket.auth.entity.Coupon;
import com.kidsmarket.auth.entity.User;
import com.kidsmarket.auth.repo.AuthCouponRepository;
import com.kidsmarket.auth.repo.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {

  private final UserRepository users;
  private final AuthCouponRepository coupons;
  private final JwtTokenService jwt;

  public AccountService(UserRepository users, AuthCouponRepository coupons, JwtTokenService jwt) {
    this.users = users;
    this.coupons = coupons;
    this.jwt = jwt;
  }

  @Transactional
  public AuthResponse signup(SignupRequest req) {
    String email = req.email().trim();
    if (users.existsByEmailIgnoreCase(email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
    }
    String id = UUID.randomUUID().toString().replace("-", "");
    User u = new User();
    u.setId(id);
    u.setName(req.name().trim());
    u.setEmail(email);
    u.setPassword(req.password().trim());
    u.setCreatedAt(Instant.now());
    users.save(u);
    UserDto dto = toDto(u);
    String token = jwt.createToken(u.getId(), u.getEmail(), u.getName());
    return new AuthResponse(dto, token);
  }

  public AuthResponse login(LoginRequest req) {
    String email = req.email().trim();
    User u =
        users
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password."));
    if (!u.getPassword().equals(req.password().trim())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }
    UserDto dto = toDto(u);
    String token = jwt.createToken(u.getId(), u.getEmail(), u.getName());
    return new AuthResponse(dto, token);
  }

  public MeResponse me(String userId) {
    User u =
        users
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    List<CouponDto> list =
        coupons.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toCouponDto)
            .toList();
    return new MeResponse(toDto(u), list);
  }

  private UserDto toDto(User u) {
    return new UserDto(u.getId(), u.getName(), u.getEmail());
  }

  private CouponDto toCouponDto(Coupon c) {
    return new CouponDto(
        c.getCode(), c.getDiscount(), c.getExpiresAt(), c.isUsed());
  }
}
