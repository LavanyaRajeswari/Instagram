package com.web.Instagram.repository;

import com.web.Instagram.entity.RestrictedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestrictedUserRepository extends JpaRepository<RestrictedUser, Long> {
    Optional<RestrictedUser> findByRestricterIdAndRestrictedId(Long restricterId, Long restrictedId);

    boolean existsByRestricterIdAndRestrictedId(Long restricterId, Long restrictedId);

    List<RestrictedUser> findByRestricterId(Long restricterId);

    void deleteByRestricterIdAndRestrictedId(Long restricterId, Long restrictedId);
}
