package com.web.Instagram.dto.closeFriend;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CloseFriendResponse {

    private Long id;

    private String username;

    private String fullName;

    private String profilePicture;

}
