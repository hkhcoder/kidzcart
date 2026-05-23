package com.kidsmarket.auth.web;

import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class RestExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> responseStatus(ResponseStatusException ex) {
    String msg =
        ex.getReason() != null && !ex.getReason().isBlank()
            ? ex.getReason()
            : ex.getStatusCode().toString();
    return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", msg));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
    String msg =
        ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining("; "));
    return ResponseEntity.badRequest().body(Map.of("message", msg.isBlank() ? "Invalid request" : msg));
  }

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<Map<String, String>> dataAccess(DataAccessException ex) {
    String hint =
        "Cannot reach MySQL or tables are missing. Run db/kids_marketplace_mysql_init.sql, and check SPRING_DATASOURCE_* / password in application.properties.";
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of("message", hint, "detail", ex.getMostSpecificCause().getMessage()));
  }
}
