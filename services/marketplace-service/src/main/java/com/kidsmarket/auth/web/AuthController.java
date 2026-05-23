package com.kidsmarket.auth.web;

import com.kidsmarket.auth.dto.AuthResponse;
import com.kidsmarket.auth.dto.LoginRequest;
import com.kidsmarket.auth.dto.SignupRequest;
import com.kidsmarket.auth.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AccountService accounts;

  public AuthController(AccountService accounts) {
    this.accounts = accounts;
  }

  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse signup(@Valid @RequestBody SignupRequest req) {
    return accounts.signup(req);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    return accounts.login(req);
  }
}
