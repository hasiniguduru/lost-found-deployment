package edu.campus.lostfound.controller;

import edu.campus.lostfound.entity.User;
import edu.campus.lostfound.repository.UserRepository;
import edu.campus.lostfound.security.CampusUserPrincipal;
import edu.campus.lostfound.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String rawEmail = payload != null ? payload.getOrDefault("email", "") : "";
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        String password = payload != null ? payload.getOrDefault("password", "") : "";

        Map<String, String> fieldErrors = new HashMap<>();
        if (email.isBlank() || !email.contains("@")) {
            fieldErrors.put("email", "Please enter a valid email address.");
        }
        if (password == null || password.length() < 4) {
            fieldErrors.put("password", "Please enter your password (at least 4 characters).");
        }
        if (!fieldErrors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "fieldErrors", fieldErrors
            ));
        }

        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        User user = existing.orElseGet(() -> {
            String prefix = email.split("@")[0].replaceAll("[._-]+", " ").trim();
            String derivedName = prefix.isEmpty()
                    ? "Campus User"
                    : Character.toUpperCase(prefix.charAt(0)) + prefix.substring(1);
            User created = User.builder()
                    .id("usr-" + UUID.randomUUID().toString().substring(0, 8))
                    .fullName(derivedName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .campusId("STU-2026-" + (1000 + userRepository.count()))
                    .department("Campus Community")
                    .phone("+1 (555) 234-8819")
                    .role("OWNER")
                    .verified(true)
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(created);
        });

        CampusUserPrincipal principal = toPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", user
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String fullName = payload != null ? payload.getOrDefault("fullName", "").trim() : "";
        String email = payload != null ? payload.getOrDefault("email", "").trim().toLowerCase(Locale.ROOT) : "";
        String password = payload != null ? payload.getOrDefault("password", "") : "";
        String campusId = payload != null ? payload.getOrDefault("campusId", "").trim().toUpperCase(Locale.ROOT) : "";
        String department = payload != null ? payload.getOrDefault("department", "").trim() : "";
        String phone = payload != null ? payload.getOrDefault("phone", "+1 (555) 019-2831").trim() : "+1 (555) 019-2831";
        String role = payload != null ? payload.getOrDefault("role", "OWNER").trim().toUpperCase(Locale.ROOT) : "OWNER";

        Map<String, String> fieldErrors = new HashMap<>();
        if (fullName.length() < 2) {
            fieldErrors.put("fullName", "Please enter your full name (at least 2 characters).");
        }
        if (campusId.length() < 3) {
            fieldErrors.put("campusId", "Please enter your Campus ID (e.g., STU-2026-101).");
        }
        if (department.length() < 2) {
            fieldErrors.put("department", "Please enter your department.");
        }
        if (email.isBlank() || !email.contains("@")) {
            fieldErrors.put("email", "Please enter a valid email address.");
        }
        if (password == null || password.length() < 6) {
            fieldErrors.put("password", "Password must be at least 6 characters.");
        }
        if (!fieldErrors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "fieldErrors", fieldErrors
            ));
        }

        if (!"OWNER".equals(role) && !"FINDER".equals(role) && !"ADMIN_SECURITY".equals(role)) {
            role = "OWNER";
        }
        final String resolvedRole = role;

        User user = userRepository.findByEmailIgnoreCase(email).map(existingUser -> {
            existingUser.setFullName(fullName);
            existingUser.setCampusId(campusId);
            existingUser.setDepartment(department);
            existingUser.setRole(resolvedRole);
            existingUser.setPasswordHash(passwordEncoder.encode(password));
            return userRepository.save(existingUser);
        }).orElseGet(() -> {
            User created = User.builder()
                    .id("usr-" + UUID.randomUUID().toString().substring(0, 8))
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .campusId(campusId)
                    .department(department)
                    .phone(phone.isBlank() ? "+1 (555) 019-2831" : phone)
                    .role(resolvedRole)
                    .verified(true)
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(created);
        });

        CampusUserPrincipal principal = toPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", user
        ));
    }

    @PostMapping("/switch-role")
    public ResponseEntity<?> switchRole(
            @AuthenticationPrincipal CampusUserPrincipal currentPrincipal,
            @RequestBody Map<String, String> payload
    ) {
        if (currentPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        String role = payload != null ? payload.getOrDefault("role", "OWNER").trim().toUpperCase(Locale.ROOT) : "OWNER";
        if (!role.equals("OWNER") && !role.equals("FINDER") && !role.equals("ADMIN_SECURITY")) {
            role = "OWNER";
        }
        final String updatedRole = role;
        User user = userRepository.findById(currentPrincipal.getId()).map(existing -> {
            existing.setRole(updatedRole);
            return userRepository.save(existing);
        }).orElseGet(() -> User.builder()
                .id(currentPrincipal.getId())
                .fullName(currentPrincipal.getFullName())
                .email(currentPrincipal.getEmail())
                .passwordHash("")
                .campusId(currentPrincipal.getCampusId())
                .department(currentPrincipal.getDepartment() != null ? currentPrincipal.getDepartment() : "Campus Community")
                .phone("+1 (555) 234-8819")
                .role(updatedRole)
                .verified(true)
                .createdAt(Instant.now())
                .build());

        CampusUserPrincipal principal = toPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "expiresIn", 86400,
                "user", user
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal CampusUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of(
                "id", principal.getId(),
                "fullName", principal.getFullName(),
                "email", principal.getEmail(),
                "campusId", principal.getCampusId(),
                "department", principal.getDepartment() != null ? principal.getDepartment() : "Campus Community",
                "phone", "+1 (555) 234-8819",
                "role", principal.getRole(),
                "verified", principal.isVerified(),
                "createdAt", Instant.now().toString()
        ));
    }

    private CampusUserPrincipal toPrincipal(User user) {
        return CampusUserPrincipal.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .passwordHash(user.getPasswordHash())
                .campusId(user.getCampusId())
                .department(user.getDepartment())
                .role(user.getRole())
                .verified(user.isVerified())
                .build();
    }
}
