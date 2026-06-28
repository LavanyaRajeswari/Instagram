package com.web.Instagram.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 30)
    private String username;

    @NotBlank @Size(max = 100)
    private String fullName;

    private String email;
    private String mobileNumber;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    private LocalDate birthDate;
}