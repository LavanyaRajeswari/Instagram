package com.web.Instagram.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String bio;
    private String gender;
}