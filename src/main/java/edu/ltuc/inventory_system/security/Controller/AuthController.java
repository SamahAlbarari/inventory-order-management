package edu.ltuc.inventory_system.security.Controller;


import edu.ltuc.inventory_system.security.Service.Interface.User.UserService;
import edu.ltuc.inventory_system.dto.RequestDtos.UserRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseMessageDto;
import edu.ltuc.inventory_system.security.Service.JWTService.JwtService;
import edu.ltuc.inventory_system.security.dtos.AuthRequestDto;
import edu.ltuc.inventory_system.security.dtos.AuthResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {
    private final JwtService jwtService;
    private final edu.ltuc.inventory_system.security.Repository.UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDto req) {
        final String email = (req.email() == null) ? "" : req.email().trim().toLowerCase();
        final String password = req.password() == null ? "" : req.password();

        var userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Incorrect email or password"));
        }

        var user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Incorrect email or password"));
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponseDto(token, "Bearer"));
    }


    @PostMapping("/auth/users/customer")
    public ResponseEntity<UserResponseMessageDto> createUser(@Valid @RequestBody UserRequestDto userRequestDto) {
        UserResponseMessageDto user = userService.createUser(userRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(user); //this is another way
    }


    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/users/manager")
    public ResponseEntity<UserResponseMessageDto> createManager(@Valid @RequestBody UserRequestDto userRequestDto) {
        UserResponseMessageDto user = userService.createManager(userRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(user); //this is another way
    }


    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<UserResponseMessageDto> createAdmin(@Valid @RequestBody UserRequestDto userRequestDto) {
        UserResponseMessageDto user = userService.createAdmin(userRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(user); //this is another way
    }

}