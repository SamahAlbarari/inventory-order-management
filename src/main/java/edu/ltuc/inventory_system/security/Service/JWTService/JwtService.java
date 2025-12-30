package edu.ltuc.inventory_system.security.Service.JWTService;

import edu.ltuc.inventory_system.security.Entity.SystemUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Service
public class JwtService {

    private Key key;

    @Value("${jwt.base64Secret}")
    private String base64Secret;

    @Value("${jwt.ttlMs}")
    private Long ttlMs;

    @PostConstruct
    private void init() {
        if (Objects.isNull(base64Secret) || base64Secret.isBlank()) {
            key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            byte[] decode = Base64.getDecoder().decode(base64Secret);
            key = Keys.hmacShaKeyFor(decode);
        }
    }

    public String generateToken(SystemUser user) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + ttlMs);

        List<String> roles = user.getRoles().stream().map(r -> r.getName()).toList();

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("roles", roles)
                .claim("name", user.getFullName())
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isExpired(String token) {
        return parse(token).getExpiration().before(new Date());
    }
}
