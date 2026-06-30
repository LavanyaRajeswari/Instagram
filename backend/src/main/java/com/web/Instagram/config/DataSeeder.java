package com.web.Instagram.config;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.web.Instagram.entity.BlockedUser;
import com.web.Instagram.entity.Call;
import com.web.Instagram.entity.CallParticipant;
import com.web.Instagram.entity.Chat;
import com.web.Instagram.entity.Comment;
import com.web.Instagram.entity.CommentLike;
import com.web.Instagram.entity.Follow;
import com.web.Instagram.entity.FollowRequest;
import com.web.Instagram.entity.GroupChat;
import com.web.Instagram.entity.GroupChatAdmin;
import com.web.Instagram.entity.GroupChatMessage;
import com.web.Instagram.entity.Hashtag;
import com.web.Instagram.entity.Highlight;
import com.web.Instagram.entity.Like;
import com.web.Instagram.entity.Media;
import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Message;
import com.web.Instagram.entity.Mute;
import com.web.Instagram.entity.Note;
import com.web.Instagram.entity.Notification;
import com.web.Instagram.entity.NotificationSetting;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.Report;
import com.web.Instagram.entity.RestrictedUser;
import com.web.Instagram.entity.SavedPost;
import com.web.Instagram.entity.SavedStory;
import com.web.Instagram.entity.SearchHistory;
import com.web.Instagram.entity.Share;
import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryArchive;
import com.web.Instagram.entity.StoryHideFrom;
import com.web.Instagram.entity.StoryLike;
import com.web.Instagram.entity.StoryMusic;
import com.web.Instagram.entity.StoryReply;
import com.web.Instagram.entity.StoryView;
import com.web.Instagram.entity.Tag;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.BlockedUserRepository;
import com.web.Instagram.repository.CallParticipantRepository;
import com.web.Instagram.repository.CallRepository;
import com.web.Instagram.repository.ChatRepository;
import com.web.Instagram.repository.ChatSettingRepository;
import com.web.Instagram.repository.CommentLikeRepository;
import com.web.Instagram.repository.CommentRepository;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.FollowRequestRepository;
import com.web.Instagram.repository.GroupChatAdminRepository;
import com.web.Instagram.repository.GroupChatMessageRepository;
import com.web.Instagram.repository.GroupChatRepository;
import com.web.Instagram.repository.HashtagRepository;
import com.web.Instagram.repository.HighlightRepository;
import com.web.Instagram.repository.LikeRepository;
import com.web.Instagram.repository.MediaRepository;
import com.web.Instagram.repository.MessageRepository;
import com.web.Instagram.repository.MuteRepository;
import com.web.Instagram.repository.NoteRepository;
import com.web.Instagram.repository.NotificationRepository;
import com.web.Instagram.repository.NotificationSettingRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.ReportRepository;
import com.web.Instagram.repository.RestrictedUserRepository;
import com.web.Instagram.repository.SavedPostRepository;
import com.web.Instagram.repository.SavedStoryRepository;
import com.web.Instagram.repository.SearchHistoryRepository;
import com.web.Instagram.repository.ShareRepository;
import com.web.Instagram.repository.StoryArchiveRepository;
import com.web.Instagram.repository.StoryHideFromRepository;
import com.web.Instagram.repository.StoryLikeRepository;
import com.web.Instagram.repository.StoryMusicRepository;
import com.web.Instagram.repository.StoryReplyRepository;
import com.web.Instagram.repository.StoryRepository;
import com.web.Instagram.repository.StoryViewRepository;
import com.web.Instagram.repository.TagRepository;
import com.web.Instagram.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final MediaRepository mediaRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final ChatSettingRepository chatSettingRepository;
    private final GroupChatRepository groupChatRepository;
    private final GroupChatMessageRepository groupChatMessageRepository;
    private final GroupChatAdminRepository groupChatAdminRepository;
    private final CallRepository callRepository;
    private final CallParticipantRepository callParticipantRepository;
    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final StoryReplyRepository storyReplyRepository;
    private final StoryArchiveRepository storyArchiveRepository;
    private final StoryHideFromRepository storyHideFromRepository;
    private final SavedPostRepository savedPostRepository;
    private final SavedStoryRepository savedStoryRepository;
    private final TagRepository tagRepository;
    private final HashtagRepository hashtagRepository;
    private final HighlightRepository highlightRepository;
    private final ReportRepository reportRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final RestrictedUserRepository restrictedUserRepository;
    private final MuteRepository muteRepository;
    private final ShareRepository shareRepository;
    private final NoteRepository noteRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final StoryMusicRepository storyMusicRepository;

    private static final String[] USERNAMES = {
        "alex", "jordan", "taylor", "morgan", "casey", "riley", "drew", "avery", "quinn", "blake",
        "hayden", "reagan", "parker", "cameron", "skyler", "reese", "peyton", "sage", "finley", "rowan",
        "emerson", "harper", "elliot", "addison", "kinsley", "briar", "marlowe", "ember", "lennon", "haven",
        "james", "oliver", "noah", "liam", "emma", "sophia", "olivia", "ava", "isabella", "mia",
        "charlotte", "amelia", "luna", "aria", "chloe", "penelope", "layla", "ella", "nora", "hazel",
        "ellie", "violet", "scarlett", "grace", "zoey", "stella", "natalie", "evelyn", "lily", "hannah",
        "zoe", "leah", "alice", "audrey", "claire", "savannah", "aurora", "anna", "bella", "sam",
        "sarah", "caroline", "genesis", "eva", "london", "brooklyn", "winter", "kendall", "skylar", "maya",
        "willow", "piper", "sienna", "eden", "eliana", "ariana", "isla", "naomi", "ruby", "serenity",
        "lyric", "nova", "melody", "brielle", "camila", "jade", "jasmine", "juliet", "june", "kai"
    };

    private static final String[] FULL_NAMES = {
        "Alex Johnson", "Jordan Smith", "Taylor Brown", "Morgan Davis", "Casey Wilson",
        "Riley Martinez", "Drew Anderson", "Avery Taylor", "Quinn Thomas", "Blake Jackson",
        "Hayden White", "Reagan Harris", "Parker Martin", "Cameron Lee", "Skyler Walker",
        "Reese Hall", "Peyton Allen", "Sage Young", "Finley King", "Rowan Wright",
        "Emerson Scott", "Harper Green", "Elliot Baker", "Addison Adams", "Kinsley Nelson",
        "Briar Carter", "Marlowe Mitchell", "Ember Perez", "Lennon Roberts", "Haven Turner",
        "James Campbell", "Oliver Evans", "Noah Edwards", "Liam Collins", "Emma Stewart",
        "Sophia Morris", "Olivia Rogers", "Ava Reed", "Isabella Cook", "Mia Morgan",
        "Charlotte Bell", "Amelia Murphy", "Luna Bailey", "Aria Rivera", "Chloe Cooper",
        "Penelope Richardson", "Layla Cox", "Ella Howard", "Nora Ward", "Hazel Torres",
        "Ellie Peterson", "Violet Gray", "Scarlett Ramirez", "Grace James", "Zoey Watson",
        "Stella Brooks", "Natalie Kelly", "Evelyn Sanders", "Lily Price", "Hannah Bennett",
        "Zoe Wood", "Leah Barnes", "Alice Ross", "Audrey Henderson", "Claire Coleman",
        "Savannah Jenkins", "Aurora Perry", "Anna Powell", "Bella Long", "Sam Patterson",
        "Sarah Hughes", "Caroline Flores", "Genesis Washington", "Eva Butler", "London Simmons",
        "Brooklyn Foster", "Winter Gonzales", "Kendall Bryant", "Skylar Alexander", "Maya Russell",
        "Willow Griffin", "Piper Diaz", "Sienna Hayes", "Eden Myers", "Eliana Ford",
        "Ariana Hamilton", "Isla Graham", "Naomi Sullivan", "Ruby Wallace", "Serenity Woods",
        "Lyric Cole", "Nova West", "Melody Jordan", "Brielle Owens", "Camila Reynolds",
        "Jade Fisher", "Jasmine Ellis", "Juliet Harrison", "June Lawrence", "Kai Stone"
    };

    private static final String[] QUOTES = {
        "Life is beautiful", "Stay positive", "Work hard dream big", "Good vibes only",
        "Keep smiling", "Be kind", "Follow your heart", "Never give up",
        "Dream big", "Love yourself", "Be the change", "Stay humble",
        "Happiness is within", "Create your own path", "Shine bright",
        "Believe in yourself", "Make today count", "Stay focused",
        "Enjoy the journey", "Live in the moment", "Chase your dreams",
        "Be fearless", "Stay strong", "You are enough", "Keep going",
        "Rise and shine", "Embrace the chaos", "Find your peace",
        "Spread love", "Stay curious", "Dance like nobody's watching",
        "Let it be", "Carpe diem", "Adventure awaits", "Just do it",
        "No excuses", "Make it happen", "Dream chaser", "Limitless",
        "Be unstoppable", "Radiate positivity", "Choose happiness",
        "Breathe and believe", "Stay wild", "Free spirit", "Kind heart",
        "Brave soul", "Peace and love", "Endless summer", "Golden hour"
    };

    private static final String[] SONG_TITLES = {
    "Samajavaragamana",
    "Butta Bomma",
    "Inkem Inkem Inkem Kaavaale",
    "Pillaa Raa",
    "Neeli Neeli Aakasam",
    "Saranga Dariya",
    "Srivalli",
    "Saami Saami",
    "Naatu Naatu",
    "Vachindamma",
    "Maate Vinadhuga",
    "Adiga Adiga",
    "Yenti Yenti",
    "Choosi Chudangane",
    "Aaskasam Eenatido",
    "Thassadiya",
    "Chikiri Chikiri",
    "Yedhalo Oka Mounam",
    "Kannuladha",
    "Why This Kolaveri Di",
    "Manasilaayo",
    "Beast Mode",
    "Dippam Dappam",
    "Hello Rammante",
    "Ola Olaala Ala",
    "Nenu Nuvvantu",
    "Rooba Rooba",
    "Sirivennela",
    "Pranavalaya",
    "Nijanga Nenena",
    "Nenani Neevani (LoFi Mix)",
    "Chilipiga",
    "Devatha",
    "Gusa Gusa Lade",
    "Yenno Yenno",
    "Stereo Hearts",
    "Shape of You",
    "love nwantiti (ah ah ah)",
    "At My Worst",
    "We Don't Talk Anymore",
    "Vaathi Coming",
    "Arabic Kuthu",
    "Thenmozhi",
    "Megham Karukatha",
    "Kanja Poovu Kannala",
    "Chellamma",
    "So Baby",
    "Adiye",
    "Vaathi Raid",
    "Pona Pogattum",
    "Ennodu Nee Irundhaal",
    "Vellai Pookkal",
    "Marakkuma Nenjam",
    "Paisa Note",
    "Jolly O Gymkhana",
    "Verithanam",
    "Vaada Thambi",
    "En Iniya Thanimaye",
    "Unakaga",
    "Kesariya",
    "Pasoori",
    "Lut Gaye",
    "Raataan Lambiyan",
    "Ghungroo",
    "Bekhayali",
    "Tujhe Kitna Chahne Lage",
    "Morni Banke",
    "Dilbaro",
    "Binte Dil",
    "Ghoomar",
    "Phir Aur Kya Chahiye",
    "Kho Gaye Hum Kahan",
    "Manike Mage Hithe",
    "O Bedardeya",
    "Apna Bana Le",
    "Tera Ban Jaunga",
    "Main Dhoondne Ko Zamaane Mein",
    "Kabhi Jo Baadal Barse",
    "Gilehriyaan",
    "Blinding Lights",
    "Dandelions",
    "Let Me Down Slowly",
    "Sunflower",
    "Believer",
    "Lovely",
    "Someone You Loved",
    "Memories",
    "Night Changes",
    "Closer",
    "See You Again",
    "Heat Waves",
    "Perfect",
    "Photograph",
    "Unstoppable",
    "Cheap Thrills",
    "Attention",
    "Ocean Eyes",
    "bad guy",
    "Havana",
    "Flowers"
};

private static final String[] ARTISTS = {
    "Sid Sriram",
    "Armaan Malik",
    "Sid Sriram",
    "Anurag Kulkarni",
    "Sid Sriram, Sunitha",
    "Mangli",
    "Sid Sriram",
    "Mounika Yadav",
    "Rahul Sipligunj, Kaala Bhairava",
    "Sid Sriram",
    "Sid Sriram",
    "Sid Sriram",
    "Chinmayi Sripada",
    "Anurag Kulkarni",
    "S. Janaki",
    "Silambarasan TR, T. Rajendar, Suchitra",
    "Yazin Nizar, Narendra, Rita",
    "Karthik",
    "Dhanush, Shruti Haasan",
    "Dhanush",
    "Malaysia Vasudevan, Yugendran, Anirudh Ravichander",
    "Anirudh Ravichander",
    "Anirudh Ravichander, Anthony Daasan",
    "Sagar",
    "Ranina Reddy",
    "Naresh Iyer, Shreya Ghoshal",
    "Benny Dayal, K. G. Ranjith",
    "Anurag Kulkarni",
    "Sid Sriram",
    "Karthik",
    "A. R. Rahman",
    "Karthik",
    "Karthik",
    "Karthik, Pranavi",
    "Karthik",
    "Gym Class Heroes feat. Adam Levine",
    "Ed Sheeran",
    "CKay",
    "Pink Sweat$",
    "Charlie Puth feat. Selena Gomez",
    "Anirudh Ravichander & Gana Balachandar",
    "Anirudh Ravichander & Jonita Gandhi",
    "Santhosh Narayanan & Anirudh Ravichander",
    "Dhanush & Anirudh Ravichander",
    "Yuvan Shankar Raja & Sid Sriram",
    "Anirudh Ravichander & Jonita Gandhi",
    "Anirudh Ravichander & Ananthakrrishnan",
    "Dhibu Ninan Thomas & Kapil Kapilan",
    "Anirudh Ravichander & Arivu",
    "Anirudh Ravichander & CB Vinith",
    "A.R. Rahman, Sid Sriram & Sunitha Sarathy",
    "A.R. Rahman & Hariharan",
    "A.R. Rahman",
    "Hiphop Tamizha",
    "Vijay & Anirudh Ravichander",
    "A.R. Rahman & Vijay",
    "G.V. Prakash Kumar, Anirudh Ravichander & D. Imman",
    "Sid Sriram & D. Imman",
    "A.R. Rahman, Sreekanth Hariharan & Madhura Dhara Talluri",
    "Pritam, Arijit Singh & Amitabh Bhattacharya",
    "Shae Gill & Ali Sethi",
    "Jubin Nautiyal",
    "Tanishk Bagchi, Jubin Nautiyal & Asees Kaur",
    "Arijit Singh, Shilpa Rao & Vishal-Shekhar",
    "Sachet Tandon",
    "Arijit Singh",
    "Guru Randhawa & Neha Kakkar",
    "Harshdeep Kaur, Shankar Mahadevan & Vibha Saraf",
    "Arijit Singh & A M Turaz",
    "Shreya Ghoshal, Swaroop Khan & A M Turaz",
    "Sachin-Jigar, Arijit Singh & Amitabh Bhattacharya",
    "Jasleen Royal & Prateek Kuhad",
    "Shehan Kaushalya",
    "Pritam, Arijit Singh & Amitabh Bhattacharya",
    "Sachin-Jigar & Arijit Singh",
    "Akhil Sachdeva & Tulsi Kumar",
    "Arijit Singh",
    "Arijit Singh",
    "Jonita Gandhi",
    "The Weeknd",
    "Ruth B.",
    "Alec Benjamin",
    "Post Malone & Swae Lee",
    "Imagine Dragons",
    "Billie Eilish & Khalid",
    "Lewis Capaldi",
    "Maroon 5",
    "One Direction",
    "The Chainsmokers & Halsey",
    "Wiz Khalifa feat. Charlie Puth",
    "Glass Animals",
    "Ed Sheeran",
    "Ed Sheeran",
    "Sia",
    "Sia",
    "Charlie Puth",
    "Billie Eilish",
    "Billie Eilish",
    "Camila Cabello",
    "Miley Cyrus"
};

private static final String[] AUDIO_URLS = {
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/94/15/98/941598ae-7248-357a-1e07-be7d50ea7b08/mzaf_11251795343892643096.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/28/e0/d3/28e0d30a-2afe-66e4-ac03-69b6d779fecd/mzaf_7857615290499608693.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6d/5a/f1/6d5af141-475c-7404-495c-0ef55283457c/mzaf_3028662401385709025.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bc/15/37/bc153788-a945-4f0f-6b92-4846474b1b89/mzaf_15097234370210149897.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/6d/54/ad/6d54ade1-7625-8dee-a147-e89afffddbb8/mzaf_17003487550385654497.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/33/1f/37/331f3776-9186-622c-513b-375f8a285048/mzaf_10012025651381903672.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9b/4a/e3/9b4ae3a2-43ee-dd7b-0474-3b7e914513cf/mzaf_10743675123561433132.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e9/e7/ce/e9e7cec0-4073-3c70-8b26-cc03fcc1129d/mzaf_4901988606946752203.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8e/dd/a4/8edda474-3fe1-3fe6-43d3-765db520a29b/mzaf_11740310005222997767.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3b/a0/a1/3ba0a1ce-bf63-bbaf-48f6-48593c231168/mzaf_16000697806590920631.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/27/4c/07274cc8-f662-8747-e425-1108ba2a2390/mzaf_12339835384962827073.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/02/f7/90/02f7902c-1575-e977-1511-8319bb50e08c/mzaf_10918442391040891316.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5e/ef/ff/5eefff68-e026-2b8e-5999-b6d01a9e3232/mzaf_15343903785544506669.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/4f/07/57/4f07570f-dab3-7c25-c9cf-cfded4358fb0/mzaf_14349320663995628602.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/bb/56/a9/bb56a9ee-8cfe-4486-ab01-a47681475399/mzaf_6274004425047703251.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/39/84/f5/3984f5f1-27e1-8836-6acd-3f849fe8a18f/mzaf_10810776326652076526.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b6/1d/29/b61d293a-ea47-8dd0-ce15-28f4cc98db54/mzaf_1819846632360520184.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ee/b0/2d/eeb02d79-f43f-9ad9-e738-3909940ce40e/mzaf_6723223793649289010.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/da/91/48/da91488f-420a-e441-58ae-abe6f5c968f5/mzaf_17537276067918480498.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9c/b6/47/9cb647c8-7a88-e45a-3d96-26d60432fd9e/mzaf_18327520659217913330.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f1/e9/c2/f1e9c23d-8087-28af-cf16-1785fb42cd14/mzaf_16351401772645005124.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/0c/48/18/0c481815-665b-9423-c7ff-f8eaf807ac9d/mzaf_8072620134514905555.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/40/49/4d/40494d88-2445-bc2b-55e9-a0379dc6ccab/mzaf_6978204614442627331.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/63/a9/87/63a98767-bc89-7532-8ed4-845d175234c9/mzaf_12917640697906480425.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5b/2c/08/5b2c0892-53fa-2d00-f64d-da0f5804fa73/mzaf_11729370401875930774.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/18/79/b1/1879b127-5bfa-6a32-f6d1-9c14f42cd306/mzaf_473814996909398735.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6a/a5/6f/6aa56ff5-151e-36c8-d3b1-5287663433ec/mzaf_11752203345682364472.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/ec/4c/8b/ec4c8b4b-2b5e-eb6e-3c15-ebe7bfa01bb7/mzaf_17851861569986269875.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/dc/6e/c5/dc6ec59a-8db3-b9c9-55e7-d4917e73ee7d/mzaf_8087402160345992021.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/68/ee/a2/68eea2f3-d9b1-3f80-d0cb-2b12f48028be/mzaf_9735344628297346370.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/6e/92/05/6e9205dd-3e90-5afe-778b-8a1197851519/mzaf_11401471494980881592.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/14/c0/1c/14c01cb8-fcc9-38b2-7d19-e7ae5e308f22/mzaf_15781203346288740258.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/b2/8c/b7/b28cb7f7-313f-8745-5a26-c9842686e10a/mzaf_14844792202296213058.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/6e/1c/46/6e1c46cf-fa86-4d3d-5a86-5c3f843c3909/mzaf_10125928785046734835.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/03/4f/8f/034f8ff6-5d32-7ac5-8c9b-6d5ed991b438/mzaf_17900073067782324391.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8c/71/37/8c7137c7-c4d6-45e6-367a-312a7c69783c/mzaf_13157621948290062056.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/75/83/6f/75836f63-4520-986c-6a38-a376243a761f/mzaf_1387184041520321033.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f4/47/70/f447709d-bbc4-cf7b-c6cc-81ce4baae597/mzaf_13362692329187378715.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a9/05/42/a905420d-535d-e9f7-7885-b8e9c9831b70/mzaf_930790171806791983.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d7/72/96/d77296ea-677d-45f9-4267-996bbc6801c8/mzaf_2392699048273414940.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/0b/83/a7/0b83a7a8-4911-221c-4fa1-ecd4ab7e7750/mzaf_4636221010938715732.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/1f/4c/02/1f4c02c2-7fa7-6215-c377-fd1aedc3a3b8/mzaf_10918057479948622334.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/96/d7/76/96d77625-68c4-20f8-0912-9b993a2fe08b/mzaf_11617875593805152000.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2a/d4/99/2ad49961-e2ce-a0b0-5504-6753fdac9ea5/mzaf_6609734267078936093.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/3d/58/8b3d582f-6d84-8cc2-c413-f29d16f73261/mzaf_15652552109006263319.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/50/b9/a7/50b9a735-f93b-04f1-287c-3e21a03d4c84/mzaf_356610455127769117.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cb/35/86/cb35867a-3e8a-67ac-214f-95ab6c11bec5/mzaf_4582978819706510426.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6a/c1/a9/6ac1a982-c0b6-a541-9ddb-b0b18e3527cb/mzaf_1681938382476126996.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f8/1f/56/f81f56a4-649f-ef2b-bedd-0d81538d4553/mzaf_5316584740652432285.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3e/9b/ea/3e9bea48-007f-c973-281e-aadb58df5d0b/mzaf_537943556202548569.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/23/2b/a8/232ba816-dac9-f6f5-004f-3d8148878578/mzaf_2300007408605448225.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/00/d2/94/00d29496-d8ec-1b5e-c0af-dec93c5e24ec/mzaf_6336318738527627568.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e2/17/7b/e2177bd1-a67a-2e48-b8b5-869374aded51/mzaf_2792937487588898591.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/84/f3/89/84f38940-92e3-2faf-b86c-1f35794b07f4/mzaf_5020105287289807461.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f2/8d/0f/f28d0fa0-44e4-4c95-79e2-e3929569b8df/mzaf_3704945305239446483.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/6a/90/3a/6a903a1d-7fd2-5786-838e-4c343c19ddd4/mzaf_1559177658966053202.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/85/f1/01/85f101a5-9f93-5de8-b9c2-322f1ccbfae9/mzaf_6772660130280144812.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e0/82/1a/e0821a1e-95d5-f80c-870f-e2265dcb9024/mzaf_7556648374116231473.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/62/33/1e/62331ea8-d1df-027d-fe75-ac16a519323d/mzaf_14381883946572745360.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/00/68/e6/0068e67b-cdb8-2d91-8b4b-95a44a014964/mzaf_9566492396252024088.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/99/0c/38/990c381b-0530-8c0d-87a9-18b050b97f0a/mzaf_10418866714500530894.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d1/90/95/d190958b-cb33-34b6-83d2-4d88b6ff1348/mzaf_8015651280578447253.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4e/f1/8a/4ef18aa3-53a5-7ced-f887-b537d4adf0eb/mzaf_16713780536711201262.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/16/6b/75/166b752b-c288-d978-54f2-ae6bb8368346/mzaf_8053064283423859432.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1c/c4/60/1cc460a5-4a92-2478-e266-f8200bf891dd/mzaf_7790148735287095620.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/93/3e/9a/933e9aef-1299-234e-07a1-f512c8afadf7/mzaf_15937172001265781043.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ec/74/4a/ec744a08-3be7-9935-1cd5-01070b021c18/mzaf_16411309030678014559.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d9/c9/40/d9c94030-237c-1acf-4bff-a8ea8f9abaa8/mzaf_3319838461581527542.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d5/10/6f/d5106fa0-dbc1-8be7-f20f-1f892dd86c38/mzaf_5974873759252686356.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/22/e9/56/22e95688-b15a-cd1d-8469-9451231ec849/mzaf_11658240031865818317.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/30/a6/84/30a6840a-7711-8eab-3a9c-5e7db74e9ce2/mzaf_16867816593086258501.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/42/e8/ab/42e8abd5-2074-ec16-c890-d3d49ca7df10/mzaf_6635146496859793884.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/ec/37/8b/ec378bf9-be0f-bd7a-9c90-48e8e780da22/mzaf_9733775466955067724.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/61/a9/59/61a95964-c914-f0fe-b99b-4348851c13ee/mzaf_750697725323217609.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/25/94/6f/25946fc8-e42f-9d13-6846-1d4465b101d0/mzaf_2502694225483492730.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/84/d9/1f/84d91f20-d505-96b1-1b4a-dbf3a78999b4/mzaf_2980018932843693225.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/46/49/4e/46494e8c-b97e-5a6b-5c5b-78eb8fb6c312/mzaf_17261683028465116344.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bc/5a/88/bc5a881d-dc44-fc7f-92fd-376680957969/mzaf_10218454983981161930.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f1/11/e6/f111e600-4810-dc0c-b9c8-487ddc9bc58a/mzaf_2235588256287220504.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/98/f0/d6/98f0d67e-f8bf-762d-cac7-1c6b3b6b35dd/mzaf_4543283896248560946.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/3f/36/c03f367a-b66b-fd0a-a54c-30f8250c4410/mzaf_12768434238801682952.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1e/d8/8d/1ed88d91-fb06-b3f2-5391-afd732cc2ff9/mzaf_18444937225262929488.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e5/c8/17/e5c817e2-7830-091f-8686-d6276d5beaeb/mzaf_5586826958480073790.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/48/db/6b/48db6b78-cdb7-5b3f-1b4d-dfec435a513d/mzaf_11078616836226327327.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/8c/b8/8a/8cb88ab0-1ff4-e1a4-20dd-99cd38769996/mzaf_4064811256027788885.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bd/f9/b9/bdf9b9b2-eaa4-4461-6079-aaacc6df7316/mzaf_17327312786932455493.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f3/c8/1f/f3c81f2c-5669-a5b6-1c98-a1e87419d97c/mzaf_10782207625414161396.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a3/4c/b9/a34cb911-40fc-5f0c-e862-14bd171a77aa/mzaf_384792072030970151.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c7/ba/bc/c7babc66-f598-aaa6-bcf6-307281795817/mzaf_16337361235117168274.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/4f/6a/114f6ad0-165c-1e3c-8fbd-df4707d7ae26/mzaf_12480083080052535279.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bb/dd/6a/bbdd6a92-b322-1c35-8dc7-8eb7d84f72b8/mzaf_14355345747730153074.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/89/73/fb/8973fb2c-5417-e56b-30f1-bf5035bb46a2/mzaf_5922398524297774212.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0b/76/e1/0b76e164-35b8-7fbb-a773-9832f3155532/mzaf_12020704327610118862.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d6/59/2b/d6592b0b-1e7e-4743-b2e4-f2af038fd783/mzaf_11193578239150321308.plus.aac.ep.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c3/87/1f/c3871f7e-3260-d615-1c66-5fdca2c3a48f/mzaf_10721331211699880949.plus.aac.p.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7d/42/fe/7d42fe40-78b9-c546-861e-bda5788bba4e/mzaf_17258777927542422456.plus.aac.ep.m4a",
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c5/46/32/c546324e-d129-4630-45cd-78092836ce4f/mzaf_14963616412621662357.plus.aac.p.m4a"
};

        private static final String[] HASHTAGS = {
        "Nature", "Love", "Music", "Dance", "Travel",
        "Food", "Fashion", "Art", "Photography", "Sunset",
        "Beach", "Mountains", "Vibes", "Party", "Fun",
        "Family", "Friends", "Life", "Style", "Beauty",
        "Happy", "Smile", "Blessed", "Weekend", "Adventure",
        "Explore", "Dream", "Goals", "Fitness", "Yoga",
        "Workout", "Healthy", "Cooking", "Reading", "Writing",
        "Poetry", "Sports", "Gaming", "Movies", "Comedy",
        "Animals", "Cats", "Dogs", "Birds", "Flowers",
        "Rain", "Stars", "Moon", "Coffee", "Chill"
    };

    private static final String[] SAMPLE_VIDEOS = {
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
        "https://www.w3schools.com/html/mov_bbb.mp4"
    };

    private static final String[] SEARCH_QUERIES = {
        "photography tips", "travel destinations", "fitness motivation", "healthy recipes", "fashion trends",
        "music playlists", "art inspiration", "nature photography", "street style", "home decor",
        "sunset photos", "coffee aesthetic", "book recommendations", "workout routines", "cooking videos",
        "landscape photography", "portrait photography", "minimalist lifestyle", "adventure travel", "yoga poses",
        "digital art", "graphic design", "typography", "watercolor painting", "urban photography",
        "food photography", "vintage fashion", "sustainable living", "mental health tips", "self care",
        "travel vlogs", "morning routine", "night sky photography", "city exploration", "hiking trails",
        "beach vibes", "mountain views", "cozy aesthetic", "plant care tips", "architecture photography",
        "street food", "cafe hopping", "stargazing spots", "forest walks", "coastal views",
        "wedding photography", "birthday celebration", "graduation photos", "family portraits", "pet photos"
    };

    @Override
    public void run(String... args) {
        if (storyMusicRepository.count() == 0) {
            createStoryMusic();
        }

        if (userRepository.count() > 0) {
            return;
        }

        clearAllTables();
        seedAll();
    }

    private void clearAllTables() {
        storyViewRepository.deleteAllInBatch();
        storyLikeRepository.deleteAllInBatch();
        storyReplyRepository.deleteAllInBatch();
        savedStoryRepository.deleteAllInBatch();
        storyHideFromRepository.deleteAllInBatch();
        storyArchiveRepository.deleteAllInBatch();
        highlightRepository.deleteAllInBatch();
        shareRepository.deleteAllInBatch();
        savedPostRepository.deleteAllInBatch();
        tagRepository.deleteAllInBatch();
        hashtagRepository.deleteAllInBatch();
        commentLikeRepository.deleteAllInBatch();
        commentRepository.deleteAllInBatch();
        likeRepository.deleteAllInBatch();
        mediaRepository.deleteAllInBatch();
        postRepository.deleteAllInBatch();
        callParticipantRepository.deleteAllInBatch();
        callRepository.deleteAllInBatch();
        groupChatAdminRepository.deleteAllInBatch();
        groupChatMessageRepository.deleteAllInBatch();
        groupChatRepository.deleteAllInBatch();
        chatSettingRepository.deleteAllInBatch();
        messageRepository.deleteAllInBatch();
        chatRepository.deleteAllInBatch();
        followRepository.deleteAllInBatch();
        followRequestRepository.deleteAllInBatch();
        reportRepository.deleteAllInBatch();
        notificationRepository.deleteAllInBatch();
        notificationSettingRepository.deleteAllInBatch();
        blockedUserRepository.deleteAllInBatch();
        restrictedUserRepository.deleteAllInBatch();
        muteRepository.deleteAllInBatch();
        noteRepository.deleteAllInBatch();
        searchHistoryRepository.deleteAllInBatch();
        storyRepository.deleteAllInBatch();
        storyMusicRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private void seedAll() {
        List<User> users = createUsers();
        List<Post> posts = createPosts(users);
        createMedia(posts);
        createLikes(users, posts);
        List<Comment> comments = createComments(users, posts);
        createCommentLikes(users, comments);
        createFollows(users);
        createFollowRequests(users);
        createNotifications(users, posts, comments);
        createNotificationSettings(users);
        List<Chat> chats = createChats(users);
        createMessages(chats);
        List<GroupChat> groupChats = createGroupChats(users);
        createGroupChatMessages(users, groupChats);
        createGroupChatAdmins(groupChats);
        createCalls(users);
        List<Story> stories = createStories(users);
        createStoryViews(users, stories);
        createStoryLikes(users, stories);
        createStoryReplies(users, stories);
        createStoryArchives(users);
        createStoryHideFrom(users);
        createSavedPosts(users, posts);
        createSavedStories(users, stories);
        createTags(users, posts);
        createHashtags(posts);
        createHighlights(users, stories);
        createReports(users, posts);
        createBlockedUsers(users);
        createRestrictedUsers(users);
        createMutes(users);
        createShares(users, posts);
        createNotes(users);
        createSearchHistory(users);
        createStoryMusic();
    }

    private List<User> createUsers() {
        List<User> list = new ArrayList<>();
        String encodedPass = passwordEncoder.encode("Password@123");

        for (int i = 0; i < 100; i++) {
            User u = new User();
            u.setUsername(USERNAMES[i] + String.format("%02d", i));
            u.setFullName(FULL_NAMES[i]);
            u.setEmail("user" + i + "@example.com");
            u.setMobileNumber("+1500000" + String.format("%04d", i));
            u.setPassword(encodedPass);
            u.setBio(QUOTES[i % QUOTES.length] + " | " + (i % 3 == 0 ? "Creator" : i % 3 == 1 ? "Explorer" : "Dreamer"));
            u.setProfilePicture("https://i.pravatar.cc/150?u=" + USERNAMES[i] + i);
            u.setGender(i % 2 == 0 ? "Male" : "Female");
            u.setWebsite(i < 20 ? "https://" + USERNAMES[i] + ".com" : null);
            u.setBirthDate(java.time.LocalDate.of(1985 + (i % 30), 1 + (i % 12), 1 + (i % 28)));
            u.setPronouns(i % 3 == 0 ? "he/him" : i % 3 == 1 ? "she/her" : "they/them");
            u.setIsPrivate(false);
            u.setIsVerified(i < 15);
            u.setHideLikeCount(i >= 30 && i < 50);
            u.setCommentsDisabled(i >= 50 && i < 60);
            u.setActivityStatus(true);
            u.setReadReceipts(i % 3 != 0);
            u.setSensitiveContentFilter(i % 2 == 0 ? "STANDARD" : "LESS");
            u.setAllowReelDownloads(i % 2 == 0);
            u.setTheme(i % 3 == 0 ? "DARK" : i % 3 == 1 ? "LIGHT" : "SYSTEM");
            u.setStoryRepliesEnabled(i % 4 != 0);
            u.setStoryMentionsEnabled(i % 5 != 0);
            u.setAccountStatus("ACTIVE");
            u.setOnline(i < 40);
            u.setLastActiveAt(LocalDateTime.now().minusHours(i));
            list.add(u);
        }

        return userRepository.saveAll(list);
    }

    private List<Post> createPosts(List<User> users) {
        List<Post> list = new ArrayList<>();
        Random rnd = new Random(42);

        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            for (int j = 0; j < 4; j++) {
                int postIndex = i * 4 + j;
                Post p = new Post();
                p.setUser(user);
                p.setCaption(QUOTES[postIndex % QUOTES.length] + " #" + HASHTAGS[postIndex % HASHTAGS.length]);
                p.setVisibility("PUBLIC");
                p.setHideLikeCount(postIndex >= 60 && postIndex < 100);
                p.setCommentsDisabled(postIndex >= 100 && postIndex < 120);
                p.setMusicId((long) (rnd.nextInt(100) + 1));
                list.add(p);
            }
        }

        return postRepository.saveAll(list);
    }

    private List<Media> createMedia(List<Post> posts) {
        List<Media> list = new ArrayList<>();

        for (int i = 0; i < posts.size(); i++) {
            Post post = posts.get(i);
            int userPostIndex = i % 4;
            boolean isVideo = userPostIndex >= 2;

            Media m = new Media();
            m.setPost(post);
            if (isVideo) {
                m.setMediaUrl(SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length]);
                m.setMediaType(MediaType.VIDEO);
            } else {
                m.setMediaUrl("https://picsum.photos/seed/post" + i + "/640/640");
                m.setMediaType(MediaType.IMAGE);
            }
            m.setPublicId("public_post_" + i);
            m.setSortOrder(0);
            list.add(m);

            if (!isVideo && userPostIndex == 1) {
                Media m2 = new Media();
                m2.setPost(post);
                m2.setMediaUrl("https://picsum.photos/seed/post" + i + "_2/640/640");
                m2.setMediaType(MediaType.IMAGE);
                m2.setPublicId("public_post_" + i + "_2");
                m2.setSortOrder(1);
                list.add(m2);
            }
        }

        return mediaRepository.saveAll(list);
    }

    private void createLikes(List<User> users, List<Post> posts) {
        List<Like> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(123);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            Post post = posts.get(rnd.nextInt(posts.size()));
            String key = user.getId() + ":" + post.getId();
            if (seen.add(key)) {
                Like l = new Like();
                l.setUser(user);
                l.setPost(post);
                list.add(l);
            }
        }

        likeRepository.saveAll(list);
    }

    private List<Comment> createComments(List<User> users, List<Post> posts) {
        List<Comment> list = new ArrayList<>();
        Random rnd = new Random(456);
        String[] texts = {
            "Amazing shot!", "Love this!", "Great content!", "Beautiful!", "Stunning!",
            "So inspiring!", "Keep it up!", "Fantastic!", "Brilliant!", "Incredible!",
            "Well done!", "This is fire!", "So good!", "Absolute perfection!", "Love your work!",
            "You nailed it!", "Goals!", "Pure talent!", "Wow factor!", "Simply superb!",
            "Best ever!", "Gorgeous!", "Fantastic click!", "Mind blowing!", "Respect!",
            "Beautifully captured!", "You rock!", "Stay blessed!", "Inspiring!", "Loved it!",
            "So beautiful!", "Keep shining!", "Outstanding!", "Perfect!", "Legendary!",
            "This made my day!", "Cannot get enough!", "So wholesome!", "Chefs kiss!", "Elite!",
            "This is everything!", "Absolutely love it!", "Living for this!", "Too good!", "Epic!",
            "Masterpiece!", "Such a vibe!", "Obsessed!", "You always deliver!", "Flawless!",
            "This hits different!", "Iconic!", "Spectacular!", "Next level!", "Unreal!"
        };

        for (int i = 0; i < 150; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            Post post = posts.get(rnd.nextInt(posts.size()));
            Comment c = new Comment();
            c.setUser(user);
            c.setPost(post);
            c.setText(texts[i % texts.length]);
            list.add(c);
        }

        List<Comment> saved = commentRepository.saveAll(list);

        List<Comment> replies = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            Comment parent = saved.get(rnd.nextInt(saved.size()));
            Comment reply = new Comment();
            reply.setUser(users.get(rnd.nextInt(users.size())));
            reply.setPost(parent.getPost());
            reply.setParentComment(parent);
            reply.setText("Totally agree! " + texts[rnd.nextInt(texts.length)]);
            replies.add(reply);
        }
        commentRepository.saveAll(replies);

        return saved;
    }

    private void createCommentLikes(List<User> users, List<Comment> comments) {
        List<CommentLike> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(789);

        for (int i = 0; i < 300 && list.size() < 150; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            Comment comment = comments.get(rnd.nextInt(comments.size()));
            String key = user.getId() + ":" + comment.getId();
            if (seen.add(key)) {
                CommentLike cl = new CommentLike();
                cl.setUser(user);
                cl.setComment(comment);
                list.add(cl);
            }
        }

        commentLikeRepository.saveAll(list);
    }

    private void createFollows(List<User> users) {
        List<Follow> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(234);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            User follower = users.get(rnd.nextInt(users.size()));
            User following = users.get(rnd.nextInt(users.size()));
            if (!follower.equals(following)) {
                String key = follower.getId() + ":" + following.getId();
                if (seen.add(key)) {
                    Follow f = new Follow();
                    f.setFollower(follower);
                    f.setFollowing(following);
                    list.add(f);
                }
            }
        }

        followRepository.saveAll(list);
    }

    private void createFollowRequests(List<User> users) {
        List<FollowRequest> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(345);

        for (int i = 0; i < 300 && list.size() < 150; i++) {
            User follower = users.get(rnd.nextInt(users.size()));
            User following = users.get(rnd.nextInt(users.size()));
            if (!follower.equals(following)) {
                String key = follower.getId() + ":" + following.getId();
                if (seen.add(key)) {
                    FollowRequest fr = new FollowRequest();
                    fr.setFollower(follower);
                    fr.setFollowing(following);
                    fr.setStatus(list.size() % 3 == 0 ? "PENDING" : list.size() % 3 == 1 ? "ACCEPTED" : "DECLINED");
                    list.add(fr);
                }
            }
        }

        followRequestRepository.saveAll(list);
    }

    private void createNotifications(List<User> users, List<Post> posts, List<Comment> comments) {
        List<Notification> list = new ArrayList<>();
        Random rnd = new Random(567);
        String[] types = {"LIKE", "COMMENT", "FOLLOW", "MENTION", "STORY"};

        for (int i = 0; i < 150; i++) {
            Notification n = new Notification();
            n.setRecipient(users.get(rnd.nextInt(users.size())));
            n.setSender(users.get(rnd.nextInt(users.size())));
            n.setType(types[i % types.length]);
            n.setSeen(i % 3 == 0);
            if ("LIKE".equals(n.getType()) || "COMMENT".equals(n.getType())) {
                n.setPostId(posts.get(rnd.nextInt(posts.size())).getId());
            }
            if ("COMMENT".equals(n.getType())) {
                n.setCommentId(comments.get(rnd.nextInt(comments.size())).getId());
            }
            list.add(n);
        }

        notificationRepository.saveAll(list);
    }

    private void createNotificationSettings(List<User> users) {
        List<NotificationSetting> list = new ArrayList<>();

        for (int i = 0; i < users.size(); i++) {
            NotificationSetting ns = NotificationSetting.builder()
                    .user(users.get(i))
                    .pushEnabled(true)
                    .likesEnabled(i % 5 != 0)
                    .commentsEnabled(i % 4 != 0)
                    .followsEnabled(true)
                    .mentionsEnabled(i % 3 != 0)
                    .messagesEnabled(true)
                    .storiesEnabled(i % 2 == 0)
                    .liveEnabled(i % 5 != 0)
                    .build();
            list.add(ns);
        }

        notificationSettingRepository.saveAll(list);
    }

    private List<Chat> createChats(List<User> users) {
        List<Chat> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(678);

        for (int i = 0; i < 300 && list.size() < 120; i++) {
            User u1 = users.get(rnd.nextInt(users.size()));
            User u2 = users.get(rnd.nextInt(users.size()));
            if (!u1.equals(u2)) {
                long minId = Math.min(u1.getId(), u2.getId());
                long maxId = Math.max(u1.getId(), u2.getId());
                String key = minId + ":" + maxId;
                if (seen.add(key)) {
                    Chat c = new Chat();
                    c.setUserOne(u1);
                    c.setUserTwo(u2);
                    c.setLastMessage(QUOTES[list.size() % QUOTES.length]);
                    c.setLastMessageAt(LocalDateTime.now().minusHours(list.size()));
                    c.setMuted(list.size() >= 100);
                    list.add(c);
                }
            }
        }

        return chatRepository.saveAll(list);
    }

    private void createMessages(List<Chat> chats) {
        List<Message> list = new ArrayList<>();
        Random rnd = new Random(789);
        String[] contents = {
            "Hey! How are you?", "Looking great!", "What's up?", "Let's catch up!",
            "Awesome content!", "Love your feed!", "Hey there!", "Good morning!",
            "How's it going?", "Let's meet up!", "You're so talented!", "Keep it up!",
            "Nice work!", "Hello there!", "How are you doing?", "Miss hanging out!",
            "Let's chat later!", "What's new with you?", "Take care!", "Have a great day!",
            "Just thinking about you!", "How's everything?", "Sending good vibes!", "You're amazing!",
            "Hope you're well!", "Just checking in!", "How's the project coming along?", "Great to hear from you!",
            "Can't wait to catch up!", "Let's plan something fun!", "Hope your week is going well!",
            "Thinking of you!", "You're doing great!", "So happy for you!", "Congratulations!",
            "Well done!", "Proud of you!", "Stay safe!", "Miss you lots!", "Can't wait to see you!",
            "See you soon!", "Talk soon!", "Love you lots!", "You're the best!", "Never change!",
            "Keep smiling!", "You got this!", "Believe in yourself!", "Shine on!", "Rooting for you!"
        };

        for (Chat chat : chats) {
            int msgCount = 2 + rnd.nextInt(4);
            for (int j = 0; j < msgCount; j++) {
                User sender = j % 2 == 0 ? chat.getUserOne() : chat.getUserTwo();
                Message m = new Message();
                m.setChat(chat);
                m.setSender(sender);
                m.setContent(contents[(list.size()) % contents.length]);
                m.setMessageType("TEXT");
                m.setSeen(j % 3 != 0);
                list.add(m);
            }
        }

        messageRepository.saveAll(list);
    }

    private List<GroupChat> createGroupChats(List<User> users) {
        List<GroupChat> list = new ArrayList<>();
        Random rnd = new Random(901);
        String[] groupNames = {
            "Morning Crew", "Weekend Plans", "Work Squad", "Travel Buddies", "Fitness Goals",
            "Book Club", "Movie Nights", "Foodies", "Tech Talk", "Creative Corner",
            "Adventure Squad", "Coffee Lovers", "Game Night", "Study Group", "Hiking Crew",
            "Photography Club", "Music Lovers", "Art Collective", "Cooking Circle", "Sports Fans"
        };

        for (int i = 0; i < 20; i++) {
            GroupChat gc = new GroupChat();
            gc.setName(groupNames[i % groupNames.length]);
            gc.setDescription("Group chat for " + groupNames[i % groupNames.length].toLowerCase());
            gc.setProfilePicture("https://picsum.photos/seed/group" + i + "/200/200");
            gc.setCreatedBy(users.get(rnd.nextInt(users.size())));

            List<User> members = new ArrayList<>();
            for (int j = 0; j < 6; j++) {
                User member = users.get((i * 7 + j) % users.size());
                if (!members.contains(member)) {
                    members.add(member);
                }
            }
            gc.setMembers(members);
            gc.setLastMessage("Welcome to the group!");
            gc.setLastMessageAt(LocalDateTime.now().minusHours(i));
            list.add(gc);
        }

        return groupChatRepository.saveAll(list);
    }

    private void createGroupChatMessages(List<User> users, List<GroupChat> groupChats) {
        List<GroupChatMessage> list = new ArrayList<>();
        Random rnd = new Random(1234);
        String[] msgs = {
            "Hello everyone!", "Welcome to the group!", "How is everyone doing?", "Great group!",
            "Anyone around?", "Good morning all!", "What's up?", "Let's plan something!",
            "Anyone free this weekend?", "Party time!", "Who's in?", "Sounds amazing!",
            "Love this group!", "This is fun!", "Awesome!",
            "What do you all think?", "Count me in!", "Let's do it!",
            "Can't wait!", "See you all soon!", "OK!", "Sure thing!",
            "That sounds great!", "Absolutely!", "Love the idea!", "Let's go!",
            "Sounds good to me!", "Perfect!", "I'm in!", "Let's make it happen!",
            "So excited!", "This is going to be great!", "Looking forward to it!"
        };

        for (int i = 0; i < 200; i++) {
            GroupChat gc = groupChats.get(i % groupChats.size());
            GroupChatMessage gcm = new GroupChatMessage();
            gcm.setGroupChat(gc);
            gcm.setSender(users.get(rnd.nextInt(users.size())));
            gcm.setContent(msgs[i % msgs.length]);
            gcm.setMessageType("TEXT");
            gcm.setSeen(rnd.nextBoolean());
            list.add(gcm);
        }

        groupChatMessageRepository.saveAll(list);
    }

    private void createGroupChatAdmins(List<GroupChat> groupChats) {
        List<GroupChatAdmin> list = new ArrayList<>();

        for (GroupChat gc : groupChats) {
            GroupChatAdmin admin = new GroupChatAdmin();
            admin.setGroupChat(gc);
            admin.setUser(gc.getCreatedBy());
            list.add(admin);
        }

        groupChatAdminRepository.saveAll(list);
    }

    private void createCalls(List<User> users) {
        List<Call> list = new ArrayList<>();
        Random rnd = new Random(2345);
        String[] callTypes = {"AUDIO", "VIDEO"};
        String[] statuses = {"COMPLETED", "MISSED", "COMPLETED", "CANCELLED"};

        for (int i = 0; i < 150; i++) {
            User caller = users.get(rnd.nextInt(users.size()));
            User callee = users.get(rnd.nextInt(users.size()));
            if (!caller.equals(callee)) {
                Call c = new Call();
                c.setCaller(caller);
                c.setCallee(callee);
                c.setCallType(callTypes[i % 2]);
                c.setStatus(statuses[i % 4]);
                c.setStartedAt(LocalDateTime.now().minusHours(i));
                c.setDurationSeconds(30 + rnd.nextInt(570));
                list.add(c);
            }
        }

        List<Call> saved = callRepository.saveAll(list);

        for (Call call : saved) {
            CallParticipant cp1 = new CallParticipant();
            cp1.setCall(call);
            cp1.setUser(call.getCaller());
            callParticipantRepository.save(cp1);

            CallParticipant cp2 = new CallParticipant();
            cp2.setCall(call);
            cp2.setUser(call.getCallee());
            callParticipantRepository.save(cp2);
        }
    }

    private List<Story> createStories(List<User> users) {
        List<Story> list = new ArrayList<>();

        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            boolean isVideo = i % 3 == 0;

            Story s = Story.builder()
                    .user(user)
                    .mediaUrl(isVideo ? SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length] : "https://picsum.photos/seed/story" + i + "/480/854")
                    .mediaType(isVideo ? "VIDEO" : "IMAGE")
                    .caption(QUOTES[i % QUOTES.length])
                    .build();
            list.add(s);
        }

        return storyRepository.saveAll(list);
    }

    private void createStoryViews(List<User> users, List<Story> stories) {
        List<StoryView> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(4567);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            Story story = stories.get(rnd.nextInt(stories.size()));
            User user = users.get(rnd.nextInt(users.size()));
            String key = story.getId() + ":" + user.getId();
            if (seen.add(key)) {
                StoryView sv = new StoryView();
                sv.setStory(story);
                sv.setUser(user);
                list.add(sv);
            }
        }

        storyViewRepository.saveAll(list);
    }

    private void createStoryLikes(List<User> users, List<Story> stories) {
        List<StoryLike> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(5678);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            Story story = stories.get(rnd.nextInt(stories.size()));
            User user = users.get(rnd.nextInt(users.size()));
            String key = story.getId() + ":" + user.getId();
            if (seen.add(key)) {
                StoryLike sl = new StoryLike();
                sl.setStory(story);
                sl.setUser(user);
                list.add(sl);
            }
        }

        storyLikeRepository.saveAll(list);
    }

    private void createStoryReplies(List<User> users, List<Story> stories) {
        List<StoryReply> list = new ArrayList<>();
        Random rnd = new Random(6789);
        String[] replies = {
            "Amazing story!", "Love this!", "So cool!", "Great stuff!", "Beautiful!", "Wow!", "Nice one!",
            "This is everything!", "Obsessed!", "Goals!", "You nailed it!", "Stunning!", "So good!",
            "Keep it up!", "Absolutely love it!", "This is fire!", "Incredible!", "Brilliant!",
            "Perfect!", "Outstanding!", "Love the vibe!", "This made my day!", "So inspiring!"
        };

        for (int i = 0; i < 150; i++) {
            StoryReply sr = new StoryReply();
            sr.setStory(stories.get(rnd.nextInt(stories.size())));
            sr.setUser(users.get(rnd.nextInt(users.size())));
            sr.setText(replies[i % replies.length]);
            list.add(sr);
        }

        storyReplyRepository.saveAll(list);
    }

    private void createStoryArchives(List<User> users) {
        List<StoryArchive> list = new ArrayList<>();
        Random rnd = new Random(7890);

        for (int i = 0; i < 30; i++) {
            StoryArchive sa = new StoryArchive();
            sa.setUser(users.get(rnd.nextInt(users.size())));
            sa.setMediaUrl("https://picsum.photos/seed/archive" + i + "/480/854");
            sa.setMediaType("IMAGE");
            sa.setCaption(QUOTES[i % QUOTES.length]);
            list.add(sa);
        }

        storyArchiveRepository.saveAll(list);
    }

    private void createStoryHideFrom(List<User> users) {
        List<StoryHideFrom> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(8901);

        for (int i = 0; i < 300 && list.size() < 120; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            User target = users.get(rnd.nextInt(users.size()));
            if (!user.equals(target)) {
                String key = user.getId() + ":" + target.getId();
                if (seen.add(key)) {
                    StoryHideFrom shf = new StoryHideFrom();
                    shf.setUser(user);
                    shf.setTargetUser(target);
                    list.add(shf);
                }
            }
        }

        storyHideFromRepository.saveAll(list);
    }

    private void createSavedPosts(List<User> users, List<Post> posts) {
        List<SavedPost> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(9012);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            Post post = posts.get(rnd.nextInt(posts.size()));
            String key = user.getId() + ":" + post.getId();
            if (seen.add(key)) {
                SavedPost sp = new SavedPost();
                sp.setUser(user);
                sp.setPost(post);
                list.add(sp);
            }
        }

        savedPostRepository.saveAll(list);
    }

    private void createSavedStories(List<User> users, List<Story> stories) {
        List<SavedStory> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(12345);

        for (int i = 0; i < 400 && list.size() < 200; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            Story story = stories.get(rnd.nextInt(stories.size()));
            String key = user.getId() + ":" + story.getId();
            if (seen.add(key)) {
                SavedStory ss = new SavedStory();
                ss.setUser(user);
                ss.setStory(story);
                list.add(ss);
            }
        }

        savedStoryRepository.saveAll(list);
    }

    private void createTags(List<User> users, List<Post> posts) {
        List<Tag> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(23456);

        for (int i = 0; i < 300 && list.size() < 150; i++) {
            Post post = posts.get(rnd.nextInt(posts.size()));
            User user = users.get(rnd.nextInt(users.size()));
            if (!user.equals(post.getUser())) {
                String key = post.getId() + ":" + user.getId();
                if (seen.add(key)) {
                    Tag t = new Tag();
                    t.setPost(post);
                    t.setUser(user);
                    t.setX(rnd.nextDouble() * 100);
                    t.setY(rnd.nextDouble() * 100);
                    list.add(t);
                }
            }
        }

        tagRepository.saveAll(list);
    }

    private void createHashtags(List<Post> posts) {
        List<Hashtag> list = new ArrayList<>();

        for (int i = 0; i < posts.size(); i++) {
            Hashtag h = new Hashtag();
            h.setTag(HASHTAGS[i % HASHTAGS.length]);
            h.setPostId(posts.get(i % posts.size()).getId());
            list.add(h);
        }

        hashtagRepository.saveAll(list);
    }

    private void createHighlights(List<User> users, List<Story> stories) {
        List<Highlight> list = new ArrayList<>();
        Random rnd = new Random(34567);
        String[] highlightNames = {
            "Travel", "Food", "Family", "Friends", "Work", "Fitness",
            "Art", "Music", "Nature", "Weekend", "Summer", "Winter",
            "Memories", "Adventures", "Daily Life", "Celebrations",
            "Throwback", "Favorites", "Moments", "Highlights",
            "Behind the Scenes", "Special Days", "Inspiration", "Goals",
            "Projects", "Events", "Trips", "Fun Times", "Best Of", "Life"
        };

        for (int i = 0; i < 30; i++) {
            Highlight h = Highlight.builder()
                    .title(highlightNames[i % highlightNames.length])
                    .coverUrl("https://picsum.photos/seed/highlight" + i + "/200/200")
                    .user(users.get(rnd.nextInt(users.size())))
                    .stories(new ArrayList<>())
                    .build();
            h.getStories().add(stories.get(rnd.nextInt(stories.size())));
            if (i % 3 == 0 && stories.size() > 1) {
                h.getStories().add(stories.get(rnd.nextInt(stories.size())));
            }
            list.add(h);
        }

        highlightRepository.saveAll(list);
    }

    private void createReports(List<User> users, List<Post> posts) {
        List<Report> list = new ArrayList<>();
        Random rnd = new Random(45678);
        String[] reasons = {"SPAM", "INAPPROPRIATE", "HARASSMENT", "HATE_SPEECH", "FAKE_NEWS", "MISINFORMATION", "VIOLENCE", "SCAM"};

        for (int i = 0; i < 100; i++) {
            Report r = new Report();
            r.setReporter(users.get(rnd.nextInt(users.size())));
            r.setTargetType("POST");
            r.setTargetId(posts.get(rnd.nextInt(posts.size())).getId());
            r.setReason(reasons[i % reasons.length]);
            r.setStatus("PENDING");
            list.add(r);
        }

        reportRepository.saveAll(list);
    }

    private void createBlockedUsers(List<User> users) {
        List<BlockedUser> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(56789);

        for (int i = 0; i < 300 && list.size() < 100; i++) {
            User blocker = users.get(rnd.nextInt(users.size()));
            User blocked = users.get(rnd.nextInt(users.size()));
            if (!blocker.equals(blocked)) {
                String key = blocker.getId() + ":" + blocked.getId();
                if (seen.add(key)) {
                    BlockedUser bu = new BlockedUser();
                    bu.setBlocker(blocker);
                    bu.setBlocked(blocked);
                    list.add(bu);
                }
            }
        }

        blockedUserRepository.saveAll(list);
    }

    private void createRestrictedUsers(List<User> users) {
        List<RestrictedUser> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(67890);

        for (int i = 0; i < 300 && list.size() < 100; i++) {
            User restricter = users.get(rnd.nextInt(users.size()));
            User restricted = users.get(rnd.nextInt(users.size()));
            if (!restricter.equals(restricted)) {
                String key = restricter.getId() + ":" + restricted.getId();
                if (seen.add(key)) {
                    RestrictedUser ru = new RestrictedUser();
                    ru.setRestricter(restricter);
                    ru.setRestricted(restricted);
                    list.add(ru);
                }
            }
        }

        restrictedUserRepository.saveAll(list);
    }

    private void createMutes(List<User> users) {
        List<Mute> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(78901);
        String[] muteTypes = {"STORY", "POST", "ALL"};

        for (int i = 0; i < 400 && list.size() < 150; i++) {
            User user = users.get(rnd.nextInt(users.size()));
            User mutedUser = users.get(rnd.nextInt(users.size()));
            String muteType = muteTypes[i % 3];
            if (!user.equals(mutedUser)) {
                String key = user.getId() + ":" + mutedUser.getId() + ":" + muteType;
                if (seen.add(key)) {
                    Mute m = new Mute();
                    m.setUser(user);
                    m.setMutedUser(mutedUser);
                    m.setMuteType(muteType);
                    list.add(m);
                }
            }
        }

        muteRepository.saveAll(list);
    }

    private void createShares(List<User> users, List<Post> posts) {
        List<Share> list = new ArrayList<>();
        Random rnd = new Random(89012);

        for (int i = 0; i < 150; i++) {
            Share s = new Share();
            s.setSender(users.get(rnd.nextInt(users.size())));
            s.setReceiver(users.get(rnd.nextInt(users.size())));
            s.setPost(posts.get(rnd.nextInt(posts.size())));
            s.setShareType("POST");
            list.add(s);
        }

        shareRepository.saveAll(list);
    }

    private void createNotes(List<User> users) {
        List<Note> list = new ArrayList<>();
        String[] colors = {"#FFC107", "#FF5722", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63", "#00BCD4", "#FF9800"};

        for (int i = 0; i < users.size(); i++) {
            Note n = Note.builder()
                    .user(users.get(i))
                    .text(QUOTES[i % QUOTES.length] + " ✨")
                    .color(colors[i % colors.length])
                    .audience(i % 3 == 0 ? "CLOSE_FRIENDS" : i % 3 == 1 ? "FOLLOWERS" : "MUTUALS")
                    .expiresAt(LocalDateTime.now().plusDays(1))
                    .build();
            list.add(n);
        }

        noteRepository.saveAll(list);
    }

    private void createSearchHistory(List<User> users) {
        List<SearchHistory> list = new ArrayList<>();
        Random rnd = new Random(90123);

        for (int i = 0; i < 200; i++) {
            SearchHistory sh = new SearchHistory();
            sh.setUser(users.get(rnd.nextInt(users.size())));
            sh.setQuery(SEARCH_QUERIES[i % SEARCH_QUERIES.length]);
            sh.setType(i % 2 == 0 ? "USER" : "HASHTAG");
            list.add(sh);
        }

        searchHistoryRepository.saveAll(list);
    }

    private void createStoryMusic() {
        List<StoryMusic> list = new ArrayList<>();
        Random rnd = new Random(11223);
        String[] genres = {"Pop", "Rock", "Electronic", "Hip-Hop", "R&B", "Jazz", "Classical", "Indie", "Country", "Folk"};

        for (int i = 0; i < 100; i++) {
            StoryMusic sm = StoryMusic.builder()
                    .title(SONG_TITLES[i % SONG_TITLES.length])
                    .artist(ARTISTS[i % ARTISTS.length])
                    .audioUrl(AUDIO_URLS[i % AUDIO_URLS.length])
                    .durationMs(30000L + (rnd.nextInt(60) * 1000L))
                    .genre(genres[i % genres.length])
                    .usageCount((long) (rnd.nextInt(1000) + 1))
                    .build();
            list.add(sm);
        }

        storyMusicRepository.saveAll(list);
    }
}