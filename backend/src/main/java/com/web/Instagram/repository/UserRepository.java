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
    List<User> findAllByUsernameIn(List<String> usernames);
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    Optional<User> findByUsernameOrEmailOrMobileNumber(String username, String email, String mobileNumber);

    @Query("""
    select u from User u
        where lower(u.username) like lower(concat('%', :query, '%'))
        or lower(u.fullName) like lower(concat('%', :query, '%'))
        """)
    List<User> searchUsers(@Param("query") String query);

    @Query("""
        select u from User u
        where u.id <> :userId
        and u.id not in (select f.following.id from Follow f where f.follower.id = :userId)
        order by size(u.followers) desc
        """)
    org.springframework.data.domain.Page<User> findSuggestedUsers(
            @Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);
}
