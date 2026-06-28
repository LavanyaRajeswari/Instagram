package com.web.Instagram.repository;

import com.web.Instagram.entity.CallParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CallParticipantRepository extends JpaRepository<CallParticipant, Long> {
    List<CallParticipant> findByCallId(Long callId);
    boolean existsByCallIdAndUserId(Long callId, Long userId);
    void deleteByCallIdAndUserId(Long callId, Long userId);
}