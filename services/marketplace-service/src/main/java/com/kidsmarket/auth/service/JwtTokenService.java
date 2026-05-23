package com.kidsmarket.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * HS256 signing key matches .NET achievements-service JWT validation: if secret UTF-8 length &lt; 32, SHA-512 hash
 * (64 bytes); otherwise raw bytes.
 */
@Service
public class JwtTokenService {

  private final String issuer;
  private final String audience;
  private final SecretKey signingKey;

  public JwtTokenService(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.issuer}") String issuer,
      @Value("${jwt.audience}") String audience) {
    this.issuer = issuer;
    this.audience = audience;
    this.signingKey = Keys.hmacShaKeyFor(getJwtKeyBytes(secret));
  }

  static byte[] getJwtKeyBytes(String secret) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length >= 32) {
      return bytes;
    }
    try {
      return MessageDigest.getInstance("SHA-512").digest(bytes);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public String createToken(String userId, String email, String name) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(6 * 3600L);
    return Jwts.builder()
        .issuer(issuer)
        .audience()
        .add(audience)
        .and()
        .subject(userId)
        .claim("userId", userId)
        .claim("email", email)
        .claim("name", name)
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(signingKey)
        .compact();
  }

  public Claims parseAndValidate(String token) {
    return Jwts.parser()
        .verifyWith(signingKey)
        .requireIssuer(issuer)
        .requireAudience(audience)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public String extractUserId(Claims claims) {
    String uid = claims.get("userId", String.class);
    if (uid != null && !uid.isBlank()) {
      return uid;
    }
    return claims.getSubject();
  }
}
