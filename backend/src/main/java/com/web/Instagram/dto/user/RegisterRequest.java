package com.web.Instagram.dto.user;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;


@Getter
@Setter
public class RegisterRequest {
    private String username;
    private String fullName;
    private String email;
    private String mobileNumber;
    private String password;
    private LocalDate birthDate;
}
