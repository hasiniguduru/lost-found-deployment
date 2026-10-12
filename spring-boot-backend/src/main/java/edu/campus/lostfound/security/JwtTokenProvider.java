package edu.campus.lostfound.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.security.jwt.secret-key:VmVyaXRhc0NhbXB1c0xvc3RBbmRGb3VuZEp3dFNlY3JldEtleTIwMjZTZWN1cmVIbWFjU2hhMjU2}") String secret,
            @Value("${app.security.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
            if (keyBytes.length < 32) {
                keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            }
        } catch (IllegalArgumentException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(CampusUserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getId())
                .claim("email", principal.getEmail())
                .claim("fullName", principal.getFullName())
                .claim("campusId", principal.getCampusId())
                .claim("department", principal.getDepartment())
                .claim("role", principal.getRole())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public CampusUserPrincipal getPrincipalFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return CampusUserPrincipal.builder()
                .id(claims.getSubject())
                .email(claims.get("email", String.class))
                .fullName(claims.get("fullName", String.class))
                .campusId(claims.get("campusId", String.class))
                .department(claims.get("department", String.class))
                .role(claims.get("role", String.class))
                .verified(true)
                .build();
    }
}
