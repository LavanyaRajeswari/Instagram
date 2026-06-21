package com.web.Instagram.repository;

import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByMobileNumber(String mobileNumber);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    @Query("""
    select u from User u
        where lower(u.username) like lower(concat('%', :query, '%'))
        or lower(u.fullName) like lower(concat('%', :query, '%'))
        """)
    List<User> searchUsers(@Param("query") String query);
}