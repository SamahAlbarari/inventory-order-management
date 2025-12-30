package edu.ltuc.inventory_system.security.Token;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public class EmailAuthToken extends AbstractAuthenticationToken {

    private final String email;

    public EmailAuthToken(String email, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.email = email;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return email;
    }

    @Override
    public String getName() {
        return email;
    }
}
