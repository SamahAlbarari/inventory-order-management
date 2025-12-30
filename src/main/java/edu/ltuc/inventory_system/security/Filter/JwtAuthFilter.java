package edu.ltuc.inventory_system.security.Filter;

import edu.ltuc.inventory_system.security.Service.JWTService.JwtService;
import edu.ltuc.inventory_system.security.Token.EmailAuthToken;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        final String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        final String token = authHeader.substring(7);
        final Claims claims;
        try {
            claims = jwtService.parse(token);
        } catch (Exception e) {
            chain.doFilter(req, res);
            return;
        }

        if (jwtService.isExpired(token)) {
            chain.doFilter(req, res);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String email = claims.getSubject();
            Object rolesObj = claims.get("roles");

            Collection<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (rolesObj instanceof List<?> list) {
                for (Object r : list) {
                    if (r != null) authorities.add(new SimpleGrantedAuthority(String.valueOf(r)));
                }
            }

            EmailAuthToken auth = new EmailAuthToken(email, authorities);
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(req, res);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth");
    }
}
