-- Run manually against PostgreSQL after deploying the entity index changes.
-- Hibernate ddl-auto=update can create missing indexes, but it does not drop
-- indexes that were removed from JPA metadata.

DROP INDEX IF EXISTS idx_user_username;
DROP INDEX IF EXISTS idx_user_email;
DROP INDEX IF EXISTS idx_messages_chat_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_group_chat_messages_group_id;
DROP INDEX IF EXISTS idx_group_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_follow_follower;
DROP INDEX IF EXISTS idx_chats_user_one_id;
DROP INDEX IF EXISTS idx_chats_user_two_id;
DROP INDEX IF EXISTS idx_chats_last_message_at;
DROP INDEX IF EXISTS idx_notifications_recipient_id;
DROP INDEX IF EXISTS idx_notifications_sender_id;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_likes_post_id;
DROP INDEX IF EXISTS idx_comment_post_id;
DROP INDEX IF EXISTS idx_comment_parent;
DROP INDEX IF EXISTS idx_saved_posts_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_blacklisted_tokens_token;
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_expires_at;
DROP INDEX IF EXISTS idx_reports_reporter_id;

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_created_at ON posts (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_original_post_id ON posts (original_post_id);

CREATE INDEX IF NOT EXISTS idx_messages_chat_deleted_created_at ON messages (chat_id, deleted, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_seen_sender ON messages (chat_id, seen, sender_id);

CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_created_at ON group_chat_messages (group_chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_unread ON group_chat_messages (group_chat_id, deleted, created_at, sender_id);

CREATE INDEX IF NOT EXISTS idx_chats_user_one_last_message ON chats (user_one_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_two_last_message ON chats (user_two_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_pair ON chats (user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_pair_reverse ON chats (user_two_id, user_one_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at ON notifications (recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_seen ON notifications (recipient_id, seen);

CREATE INDEX IF NOT EXISTS idx_likes_post_created_at ON likes (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent_created_at ON comments (post_id, parent_comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_created_at ON comments (parent_comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_created_at ON saved_posts (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens (expires_at);

CREATE INDEX IF NOT EXISTS idx_notes_expires_created_at ON notes (expires_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_expires_created_at ON notes (user_id, expires_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notes_audience_expires_created_at ON notes (audience, expires_at, created_at);

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created_at ON reports (reporter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target_lookup ON reports (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_story_music_usage_count ON story_music (usage_count);
