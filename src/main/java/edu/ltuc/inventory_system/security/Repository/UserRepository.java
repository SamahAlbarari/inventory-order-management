package edu.ltuc.inventory_system.security.Repository;

import edu.ltuc.inventory_system.security.Entity.SystemUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<SystemUser, Long> {

    Optional<SystemUser> findByEmail(String email);

    Optional<SystemUser> findByEmailIgnoreCase(String email);

    Long countByRoles_Name(String roleName);

    List<SystemUser> findByRoles_Name(String roleName);

    Page<SystemUser> findByRoles_Name(String roleName, Pageable pageable);


}
