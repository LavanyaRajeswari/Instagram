package com.web.Instagram.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRequest {
    private String fullName;
    private String bio;
    private String profilePicture;
    private boolean isPrivate;
}
