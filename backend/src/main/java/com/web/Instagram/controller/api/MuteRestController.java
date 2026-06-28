package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Mute;
import com.web.Instagram.service.MuteService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class MuteRestController {

    private final MuteService muteService;
    private final UserService userService;

    @PostMapping("/{mutedId}/mute")
    public ResponseEntity<Void> muteUser(
            Principal principal,
            @PathVariable Long mutedId,
            @RequestParam(defaultValue = "ALL") String muteType) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        muteService.muteUser(userId, mutedId, muteType);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{mutedId}/mute")
    public ResponseEntity<Void> unmuteUser(Principal principal, @PathVariable Long mutedId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        muteService.unmuteUser(userId, mutedId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{mutedId}/mute/status")
    public ResponseEntity<Map<String, Boolean>> isMuted(
            Principal principal,
            @PathVariable Long mutedId,
            @RequestParam(defaultValue = "ALL") String muteType) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(Map.of("muted", muteService.isMuted(userId, mutedId, muteType)));
    }

    @GetMapping("/muted")
    public ResponseEntity<List<Mute>> getMutedUsers(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(muteService.getUserMutes(userId));
    }
}