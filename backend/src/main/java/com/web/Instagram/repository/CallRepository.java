package com.web.Instagram.repository;

import com.web.Instagram.entity.Call;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CallRepository extends JpaRepository<Call, Long> {
    @Query("select c from Call c where c.caller.id = :userId or c.callee.id = :userId order by c.createdAt desc")
    Page<Call> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("select c from Call c where (c.caller.id = :userId1 and c.callee.id = :userId2) or (c.caller.id = :userId2 and c.callee.id = :userId1) order by c.createdAt desc")
    Page<Call> findByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2, Pageable pageable);
}