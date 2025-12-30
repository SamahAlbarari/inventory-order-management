package edu.ltuc.inventory_system.security.Service.Interface.User;

import edu.ltuc.inventory_system.dto.RequestDtos.UserRequestDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseDto;
import edu.ltuc.inventory_system.dto.ResponseDtos.UserResponseMessageDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;


public interface UserService {

    UserResponseMessageDto createUser(UserRequestDto userRequestDto);

    Page<UserResponseDto> getAllCustomer(Pageable pageable);

    UserResponseMessageDto createManager(UserRequestDto userRequestDto);

    UserResponseMessageDto createAdmin(UserRequestDto userRequestDto);

    List<UserResponseDto> getAllManagers();

    Page<UserResponseDto> getAllUsers(Pageable pageable);

    void resetPassword(Long userId, String newPassword);
}
