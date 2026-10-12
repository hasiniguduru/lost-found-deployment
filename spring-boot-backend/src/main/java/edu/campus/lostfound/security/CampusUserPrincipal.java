package edu.campus.lostfound.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusUserPrincipal implements UserDetails {

    private String id;
    private String fullName;
    private String email;
    private String passwordHash;
    private String campusId;
    private String department;
    private String role;
    private boolean verified;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String normalizedRole = (role != null && role.startsWith("ROLE_"))
                ? role
                : "ROLE_" + (role != null ? role : "OWNER");
        return List.of(new SimpleGrantedAuthority(normalizedRole));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return verified;
    }
}
