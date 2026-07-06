package com.web.Instagram.service;

import com.web.Instagram.entity.Activity;
import com.web.Instagram.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PopularityScheduler {

    private final ActivityRepository activityRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.feed.popularity.like-weight:3}")
    private int likeWeight;

    @Value("${app.feed.popularity.comment-weight:5}")
    private int commentWeight;

    @Value("${app.feed.popularity.share-weight:7}")
    private int shareWeight;

    @Value("${app.feed.popularity.decay-rate:0.05}")
    private double decayRate;

    @Value("${app.feed.popularity.redis-limit:500}")
    private int redisLimit;

    @Value("${app.redis.key.popular-posts:popular_posts}")
    private String redisKey;

    private LocalDateTime lastExecutionTime = LocalDateTime.now().minusHours(24);

    @Scheduled(fixedDelayString = "${app.feed.recalculate-interval-ms:6000}")
    public void recalculatePopularity() {
        LocalDateTime runTime = LocalDateTime.now();
        LocalDateTime queryTime = lastExecutionTime.minusSeconds(5);

        log.debug("Scanning for changed activities since {}", queryTime);
        List<Activity> changedActivities = activityRepository.findByUpdatedAtGreaterThanEqual(queryTime);

        if (!changedActivities.isEmpty()) {
            log.info("Recalculating popularity scores for {} changed activities", changedActivities.size());
            for (Activity activity : changedActivities) {
                double newScore = calculatePopularityScore(activity);
                updatePostScoreInRedis(activity.getPostId(), newScore);
            }
        }

        lastExecutionTime = runTime;
    }

    private double calculatePopularityScore(Activity activity) {
        long weightedEngagement = activity.getLikeCount() * likeWeight
                + activity.getCommentCount() * commentWeight
                + activity.getShareCount() * shareWeight;

        LocalDateTime createdAt = activity.getCreatedAt();
        long minutes = ChronoUnit.MINUTES.between(createdAt, LocalDateTime.now());
        double ageInHours = Math.max(0.0, minutes / 60.0);
        double timeDecay = Math.exp(-decayRate * ageInHours);

        return weightedEngagement * timeDecay;
    }

    private void updatePostScoreInRedis(Long postId, double newScore) {
        String member = postId.toString();
        Double currentScore = redisTemplate.opsForZSet().score(redisKey, member);

        if (currentScore != null) {
            redisTemplate.opsForZSet().add(redisKey, member, newScore);
        } else {
            Long size = redisTemplate.opsForZSet().zCard(redisKey);
            if (size == null || size < redisLimit) {
                redisTemplate.opsForZSet().add(redisKey, member, newScore);
            } else {
                Set<TypedTuple<String>> lowestTupleSet = redisTemplate.opsForZSet().rangeWithScores(redisKey, 0, 0);
                if (lowestTupleSet != null && !lowestTupleSet.isEmpty()) {
                    TypedTuple<String> lowest = lowestTupleSet.iterator().next();
                    Double lowestScore = lowest.getScore();
                    if (lowestScore != null && newScore > lowestScore) {
                        redisTemplate.opsForZSet().add(redisKey, member, newScore);
                        redisTemplate.opsForZSet().removeRange(redisKey, 0, -(redisLimit + 1));
                    }
                }
            }
        }
    }
}
