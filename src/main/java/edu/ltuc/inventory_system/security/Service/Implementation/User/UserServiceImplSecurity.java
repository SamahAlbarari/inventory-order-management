package edu.ltuc.inventory_system.security.Service.Implementation.User;

import edu.ltuc.inventory_system.Exceptions.EmailExistException;
import edu.ltuc.inventory_system.Exceptions.RoleNotFoundException;
import edu.ltuc.inventory_system.Exceptions.UserNotFoundException;
import edu.ltuc.inventory_system.Mapper.EntityMapper;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseMessageDto;
import edu.ltuc.inventory_system.security.Service.Interface.User.UserService;
import edu.ltuc.inventory_system.dto.RequestDtos.UserRequestDto;
import edu.ltuc.inventory_system.security.Entity.Role;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import edu.ltuc.inventory_system.security.Repository.RoleRepository;
import edu.ltuc.inventory_system.security.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImplSecurity implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final EntityMapper entityMapper = EntityMapper.INSTANCE;

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    @Override
    @Transactional
    public UserResponseMessageDto createUser(UserRequestDto userRequestDto) {

        final String normalizedEmail = normalizeEmail(userRequestDto.email());

        boolean emailExists = userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (emailExists) throw new EmailExistException("Email already exists");

        Role role = roleRepository.findByName("CUSTOMER").orElseThrow(
                () -> new RoleNotFoundException(" Role CUSTOMER is Not Found ")
        );

        SystemUser newUser = new SystemUser();
        newUser.setEmail(normalizedEmail);
        newUser.setFullName(userRequestDto.fullName().trim());
        newUser.setPassword(passwordEncoder.encode(userRequestDto.password()));
        newUser.getRoles().add(role);

        SystemUser savedUser = userRepository.save(newUser);

        return entityMapper.toUserResponseMessageDto(savedUser);
    }

    @Override
    public Page<UserResponseDto> getAllCustomer(Pageable pageable) {
        Page<SystemUser> systemUsers = userRepository.findByRoles_Name("CUSTOMER", pageable);
        return systemUsers.map(entityMapper::toUserResponseDto);
    }

    @Override
    @Transactional
    public UserResponseMessageDto createManager(UserRequestDto userRequestDto) {

        final String normalizedEmail = normalizeEmail(userRequestDto.email());

        boolean emailExists = userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (emailExists) throw new EmailExistException("Email already exists");

        Role role = roleRepository.findByName("STORE_MANAGER").orElseThrow(
                () -> new RoleNotFoundException(" Role STORE_MANAGER is Not Found ")
        );

        SystemUser newUser = new SystemUser();
        newUser.setEmail(normalizedEmail);
        newUser.setFullName(userRequestDto.fullName().trim());
        newUser.setPassword(passwordEncoder.encode(userRequestDto.password()));
        newUser.getRoles().add(role);

        SystemUser savedUser = userRepository.save(newUser);

        return entityMapper.toUserResponseMessageDto(savedUser);
    }

    @Override
    @Transactional
    public UserResponseMessageDto createAdmin(UserRequestDto userRequestDto) {

        final String normalizedEmail = normalizeEmail(userRequestDto.email());

        boolean emailExists = userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (emailExists) throw new EmailExistException("Email already exists");

        Role role = roleRepository.findByName("ADMIN").orElseThrow(
                () -> new RoleNotFoundException(" Role ADMIN is Not Found ")
        );

        SystemUser newUser = new SystemUser();
        newUser.setEmail(normalizedEmail);
        newUser.setFullName(userRequestDto.fullName().trim());
        newUser.setPassword(passwordEncoder.encode(userRequestDto.password()));
        newUser.getRoles().add(role);

        SystemUser savedUser = userRepository.save(newUser);

        return entityMapper.toUserResponseMessageDto(savedUser);
    }

    @Override
    public List<UserResponseDto> getAllManagers() {
        List<SystemUser> storeManagers = userRepository.findByRoles_Name("STORE_MANAGER");
        return storeManagers.stream().map(entityMapper::toUserResponseDto).toList();
    }

    @Override
    public Page<UserResponseDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(entityMapper::toUserResponseDto);
    }


    public void resetPassword(Long userId, String newPassword) {
        SystemUser user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with id " + userId + " not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
