package com.kidsmarket.auth.web;

import com.kidsmarket.auth.dto.MeResponse;
import com.kidsmarket.auth.service.AccountService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

  private final AccountService accounts;

  public UserController(AccountService accounts) {
    this.accounts = accounts;
  }

  @GetMapping("/users/me")
  public MeResponse me(Authentication authentication) {
    String userId = (String) authentication.getPrincipal();
    return accounts.me(userId);
  }
}
