package com.kidsmarket.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users", catalog = "kids_marketplace_auth")
public class User {

  @Id
  @Column(name = "id", length = 32)
  private String id;

  @Column(name = "name", length = 100, nullable = false)
  private String name;

  @Column(name = "email", length = 255, nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", length = 255, nullable = false)
  private String password;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
