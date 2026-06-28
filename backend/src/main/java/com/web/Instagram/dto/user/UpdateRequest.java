package com.web.Instagram.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRequest {
    private String fullName;
    private String username;
    private String bio;
    private String gender;
    private String website;
    private String email;
    private String profilePicture;
    private Boolean isPrivate;
}
