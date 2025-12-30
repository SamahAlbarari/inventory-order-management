package edu.ltuc.inventory_system.dto.AdminDtos;

public record UsersStatsDto(

        long totalUsers,
        long customers,
        long storeManagers,
        long admins
) {
}
