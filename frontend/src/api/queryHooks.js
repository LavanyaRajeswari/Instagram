import { useQuery } from "@tanstack/react-query";
import { getFeedPosts, getPostById, getPosts } from "./postsApi";
import { getReels } from "./reelsApi";
import { getCurrentUser, getUser } from "./userApi";

export const queryKeys = {
  currentUser: ["user", "me"],
  userProfile: (userId) => ["user", userId],
  userPosts: (userId) => ["posts", "user", userId],
  post: (postId) => ["post", postId],
  feed: (page = 0, size = 10) => ["posts", "feed", page, size],
  reels: (page = 0, size = 10) => ["reels", page, size],
};

export const useCurrentUserQuery = (options = {}) =>
  useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: getCurrentUser,
    staleTime: 60_000,
    ...options,
  });

export const useUserProfileQuery = (userId, options = {}) =>
  useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => getUser(userId),
    enabled: Boolean(userId) && (options.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });

export const useUserPostsQuery = (userId, options = {}) =>
  useQuery({
    queryKey: queryKeys.userPosts(userId),
    queryFn: () => getPosts(userId),
    enabled: Boolean(userId) && (options.enabled ?? true),
    staleTime: 30_000,
    ...options,
  });

export const usePostQuery = (postId, options = {}) =>
  useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => getPostById(postId),
    enabled: Boolean(postId) && (options.enabled ?? true),
    staleTime: 30_000,
    ...options,
  });

export const useFeedQuery = ({ page = 0, size = 10 } = {}, options = {}) =>
  useQuery({
    queryKey: queryKeys.feed(page, size),
    queryFn: () => getFeedPosts({ page, size }),
    staleTime: 15_000,
    ...options,
  });

export const useReelsQuery = ({ page = 0, size = 10 } = {}, options = {}) =>
  useQuery({
    queryKey: queryKeys.reels(page, size),
    queryFn: () => getReels({ page, size }),
    staleTime: 15_000,
    ...options,
  });
