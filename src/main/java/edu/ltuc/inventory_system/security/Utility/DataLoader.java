package edu.ltuc.inventory_system.security.Utility;

import edu.ltuc.inventory_system.security.Entity.Role;
import edu.ltuc.inventory_system.security.Entity.SystemUser;
import edu.ltuc.inventory_system.security.Repository.RoleRepository;
import edu.ltuc.inventory_system.security.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role admin = roleRepo.findByName("ADMIN")
                .orElseGet(() -> roleRepo.save(new Role(null, "ADMIN")));

        Role manager = roleRepo.findByName("STORE_MANAGER")
                .orElseGet(() -> roleRepo.save(new Role(null, "STORE_MANAGER")));


        Role customer = roleRepo.findByName("CUSTOMER")
                .orElseGet(() -> roleRepo.save(new Role(null, "CUSTOMER")));

        if (userRepo.findByEmailIgnoreCase("admin@gmail.com").isEmpty()) {
            SystemUser adminUser = new SystemUser();
            adminUser.setEmail("admin@gmail.com");
            adminUser.setFullName("Admin");
            adminUser.setPassword(passwordEncoder.encode("Admin123@"));
            adminUser.setRoles(Set.of(admin));
            userRepo.save(adminUser);
        }

        if (userRepo.findByEmailIgnoreCase("manager@gmail.com").isEmpty()) {
            SystemUser managerUser = new SystemUser();
            managerUser.setEmail("manager@gmail.com");
            managerUser.setFullName("Manager");
            managerUser.setPassword(passwordEncoder.encode("Manager123@"));
            managerUser.setRoles(Set.of(manager));
            userRepo.save(managerUser);
        }

        if (userRepo.findByEmailIgnoreCase("customer@gmail.com").isEmpty()) {
            SystemUser customerUser = new SystemUser();
            customerUser.setEmail("customer@gmail.com");
            customerUser.setFullName("Customer");
            customerUser.setPassword(passwordEncoder.encode("Customer123@"));
            customerUser.setRoles(Set.of(customer));
            userRepo.save(customerUser);
        }
    }
}

