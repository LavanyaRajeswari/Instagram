package com.web.Instagram.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage() == null ? "Request failed" : ex.getMessage();
        String normalized = message.toLowerCase();

        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (normalized.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (normalized.contains("invalid credentials")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (normalized.contains("not allowed")
                || normalized.contains("must be uploaded to cloudinary")) {
            status = HttpStatus.FORBIDDEN;
        } else if (normalized.contains("upload failed")
                || normalized.contains("delete failed")) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
