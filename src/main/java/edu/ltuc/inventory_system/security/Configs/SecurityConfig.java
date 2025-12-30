package edu.ltuc.inventory_system.security.Configs;


import edu.ltuc.inventory_system.security.Filter.JwtAuthFilter;
import edu.ltuc.inventory_system.security.Handler.CustomAccessDeniedHandler;
import edu.ltuc.inventory_system.security.Handler.JwtAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationEntryPoint authEntryPoint,
                                                   CustomAccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        // UI static pages (served by Spring Boot)
                        .requestMatchers("/", "/index.html", "/login.html", "/register.html").permitAll()
                        .requestMatchers("/admin/**", "/manager/**", "/customer/**").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                        // Open endpoints
                        .requestMatchers("/api/auth/**", "/error").permitAll()

                        // CATEGORIES
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").hasAnyAuthority("STORE_MANAGER", "ADMIN")
                        .requestMatchers("/api/categories/**").hasAuthority("ADMIN") // PUT, POST, DELETE

                        // SUPPLIERS
                        .requestMatchers(HttpMethod.GET, "/api/suppliers/**").hasAnyAuthority("STORE_MANAGER", "ADMIN")
                        .requestMatchers("/api/suppliers/**").hasAuthority("ADMIN") // POST, PUT, DELETE

                        // PRODUCTS
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("STORE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("STORE_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/**").hasAuthority("STORE_MANAGER")

                        // MANAGER endpoints
                        .requestMatchers(HttpMethod.GET, "/api/manager/**").hasAuthority("STORE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasAnyAuthority("STORE_MANAGER", "CUSTOMER")
                        .requestMatchers("/api/purchase-orders/**").hasAuthority("STORE_MANAGER")

                        // ADMIN endpoints
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/roles/**").hasAuthority("ADMIN")

                        // CUSTOMER endpoints
                        .requestMatchers("/api/orders/**").hasAuthority("CUSTOMER")
                        .requestMatchers("/api/customer/**").hasAuthority("CUSTOMER")

                        // Any other request
                        .anyRequest().authenticated()
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        ;

        http.addFilterBefore(jwtFilter, BasicAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
