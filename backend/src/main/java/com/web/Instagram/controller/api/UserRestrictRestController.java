package com.web.Instagram.controller.api;

import com.web.Instagram.entity.RestrictedUser;
import com.web.Instagram.service.RestrictedUserService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserRestrictRestController {

    private final RestrictedUserService restrictedUserService;
    private final UserService userService;

    @PostMapping("/{userId}/restrict")
    public ResponseEntity<Void> restrictUser(Principal principal, @PathVariable Long userId) {
        Long restricterId = userService.getCurrentUser(principal.getName()).getId();
        restrictedUserService.restrictUser(restricterId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/restrict")
    public ResponseEntity<Void> unRestrictUser(Principal principal, @PathVariable Long userId) {
        Long restricterId = userService.getCurrentUser(principal.getName()).getId();
        restrictedUserService.unRestrictUser(restricterId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/restricted")
    public ResponseEntity<List<RestrictedUser>> getRestrictedUsers(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(restrictedUserService.getRestrictedUsers(userId));
    }
}
