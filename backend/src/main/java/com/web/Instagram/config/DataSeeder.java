package com.web.Instagram.config;

import com.web.Instagram.entity.*;
import com.web.Instagram.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

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
        "Naatu Naatu", "Srivalli", "Oo Antava", "Ramuloo Ramulaa", "Butta Bomma",
        "Samajavaragamana", "Inkem Inkem Kavale", "Vachinde", "Ve Maari", "Maguva Maguva",
        "Rangamma Mangamma", "Seetimaarr", "Adiga Adiga", "Pilla Raa", "Ko Ante Koti",
        "Bomma Blockbuster", "Kissik", "Pushpa Pushpa", "Sooseki", "Idhe Kadha Nee Katha",
        "Aa Ante Amalapuram", "Nuvvostanante Nenoddantana", "Cheli Paadindi Paata", "Cheppave Chirugali", "O Priya Priya",
        "Poola Poola Devudaa", "Jalsa Jalsa", "Oka Laila Kosam", "Manase Manase", "Bangaru Kodipetta",
        "Kalyana Vaibhogame", "Ee Bindu Ee Bindu", "Uppena", "Payana Sandadi", "Sye Raa",
        "Dil Dil Dil", "Govinda Govinda", "Chinni Chinni Aasa", "Nuvvu Nenu", "Keeravani Keeravani",
        "Dhingara", "Pellaina Kothalo", "Rudram", "Priyathama Priyathama", "Evaro Ee Manishi",
        "Orey Bujjigaa", "Entha Manchivadavura", "Avanthika", "Ninne Ninne", "Vasthunna Vachestunna",
        "Merise Merise", "Naa Kosam Nuvvu", "Anthakante Thakkuva", "Race Gurram", "Dookudu",
        "Dear Comrade", "Padi Padi Leche Manasu", "Majili", "Nuvve Nuvve", "Godhari Gattu Meeda",
        "Yedalo Jagruthi", "Athade Okaradu", "Pokiri", "Chatrapathi", "Nela Ticket",
        "Aravinda Sametha", "Bharat Ane Nenu", "Sarileru Neekevvaru", "Maharshi", "World Famous Lover",
        "Tuck Jagadish", "Ante Sundaraniki", "Sarkaru Vaari Paata", "Akhanda", "Bheeshma",
        "Vakeel Saab", "Ee Nagaraniki Emaindi", "Premalu", "Guntur Kaaram", "Dasara",
        "Sankarabharanam", "Simhadri Theme", "Magadheera Theme", "Baahubali Theme", "Varsham",
        "Fidaa Theme", "Taxiwaala", "Gang Leader", "Jersey Theme", "Mahanati",
        "Shyam Singha Roy", "Arjun Reddy", "Akhanda Akhanda", "HIT Theme", "Krack Theme",
        "Suryakantam", "Kushi", "Nannaku Prematho", "Attarintiki Daredi", "Seethamma Vakitlo"
    };

    private static final String[] ARTISTS = {
        "SP Balasubrahmanyam", "Sid Sriram", "Devi Sri Prasad", "SS Thaman", "MM Keeravani",
        "Rahul Sipligunj", "Shreya Ghoshal", "Anurag Kulkarni", "Harika Narayan", "Ramya Behara",
        "Sunitha", "Yazin Nizar", "Karthik", "Benny Dayal", "Armaan Malik",
        "Simha", "Sri Krishna", "Geetha Madhuri", "Anup Rubens", "Manisharma",
        "Shankar Mahadevan", "Udit Narayan", "KS Chitra", "SP Charan", "Vijaya Prakash",
        "Rita", "Divya Valli", "Mohana Bhogaraju", "Hemachandra", "Swetha Mohan",
        "Chinmayi", "Revanth", "Kaala Bhairava", "Koyal Mullick", "Neeti Mohan",
        "Sujatha", "Mahalakshmi Iyer", "Kunal Ganjawala", "Shaan", "Vijay Yesudas",
        "Javed Ali", "Hariharan", "Naresh Iyer", "Kousalya", "Malathi",
        "Gopika Poornima", "Vasundhara Das", "Vani Jayaram", "Sravana Bhargavi", "Madhu Priya",
        "Vandemataram Srinivas", "Koti", "Raj Koti", "Chakri", "Mani Sharma",
        "Ramana Gogula", "Suresh Peters", "Isaac Thomas Kottukapally", "Hesham Abdul Wahab", "Pooja Vaidyanath",
        "Mangli", "Suryakumar", "Padmalatha", "L Sridhar", "Priya Himesh",
        "Shivangi", "Harika", "Srinivasa Murthy", "Shweta Pandit", "Sadhana Sargam",
        "Clinton Cerejo", "Nithyasree Mahadevan", "Deepika", "Ranjith Govind", "Kala Ranjini",
        "Narayana Swami", "Leon James", "Justin Prabhakaran", "Vishal Chandrashekhar", "Haricharan",
        "Karunya", "Sathyaprakash", "SP Sailaja", "P Susheela", "Ghantasala",
        "Balamurali Krishna", "Sreenivas", "Venkateswara Rao", "Bhavana", "Ramajogaiah Sastry",
        "Sreerama Chandra", "Smitha", "Tanveer Ghani", "Dheena", "Priyanka NK",
        "GV Prakash Kumar", "Harris Jayaraj", "Yuvan Shankar Raja", "Mano", "Sathyam"
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

    private static final String[] AUDIO_URLS = {
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/94/15/98/941598ae-7248-357a-1e07-be7d50ea7b08/mzaf_11251795343892643096.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6d/5a/f1/6d5af141-475c-7404-495c-0ef55283457c/mzaf_3028662401385709025.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/27/4c/07274cc8-f662-8747-e425-1108ba2a2390/mzaf_12339835384962827073.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/00/87/1c/00871cd6-9a64-717a-2072-d19c49f94682/mzaf_4402448724622500589.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/5d/86/595d8694-c034-2040-9a11-2f117ed32ea4/mzaf_8961189800316643417.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9b/4a/e3/9b4ae3a2-43ee-dd7b-0474-3b7e914513cf/mzaf_10743675123561433132.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3b/a0/a1/3ba0a1ce-bf63-bbaf-48f6-48593c231168/mzaf_16000697806590920631.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/10/02/18/100218f9-5c66-2959-50ea-ee069ee71bb6/mzaf_432494172595421656.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/42/c9/bf/42c9bf9d-04fa-679c-25fa-d0c4ee5461e6/mzaf_6443712189616939545.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/12/85/34/12853461-4a89-0825-f8b9-f34a4244237d/mzaf_7933769262972519634.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a0/e9/7b/a0e97bd1-b1b1-4caf-3203-37743554ccd5/mzaf_3032613957793276819.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f8/26/85/f826850b-7fe6-b6ba-8c92-66091f2fe2ef/mzaf_5705447640644940069.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/ab/f5/2e/abf52efa-0ccb-8cb4-229b-0c6958417b3d/mzaf_5799555854699892574.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/df/3c/2c/df3c2ca9-25b2-0838-0e51-aa58fa84b589/mzaf_2493042438260943468.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5e/ef/ff/5eefff68-e026-2b8e-5999-b6d01a9e3232/mzaf_15343903785544506669.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c7/83/7d/c7837dc7-6421-0f56-5707-92669a42f815/mzaf_5981761050699089050.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ca/7b/7e/ca7b7ed8-2ce6-1932-e625-ff515adb6305/mzaf_8067942892684836003.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/0b/d8/3e/0bd83e62-35b9-a041-4a1a-d619309cabde/mzaf_16815267570554901921.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e2/b6/c2/e2b6c2b7-a330-90c7-18b3-51fc67375ae4/mzaf_9023508455880264851.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/64/ac/d9/64acd930-caef-3851-12b9-869fb0f73c45/mzaf_3377576364396287437.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/db/50/f2/db50f2fa-24e5-59f4-c599-0e4d8ffc8ee0/mzaf_10706753160893349324.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/da/50/9d/da509d53-1c86-a099-1c3c-7e038ef72506/mzaf_2795513759439521124.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/cf/6d/c7/cf6dc7c7-05ea-489d-7a37-be8d542e644a/mzaf_12704959751527129871.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ea/6f/a0/ea6fa01f-e524-258f-dce1-f48bccd0547f/mzaf_12998017365404218728.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/db/0d/0a/db0d0aed-8c5d-26e8-a810-3b0d1c1af2b3/mzaf_331171247078832597.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e8/58/41/e85841f5-5bf4-95b6-3f87-5c4c8937cf40/mzaf_6917317644570388506.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview114/v4/8e/12/e1/8e12e13c-ece6-5168-50ad-02f5e633a4c3/mzaf_4034266628449567425.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/8c/55/3a8c550b-e703-bba3-f476-44d195e4a742/mzaf_17453075177753173991.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/de/fe/d0/defed0e2-2890-3f0a-431c-5a080b085e2d/mzaf_829609020199958765.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/15/1f/f6/151ff6b3-f33b-1e68-3022-d3e848a6b5e3/mzaf_10643656903755523055.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/03/95/c3/0395c3a4-368a-3aa5-06f8-f9e0ebd553a4/mzaf_1960951393962288235.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c7/cb/87/c7cb8777-fb03-0f85-4a6a-b9e806d9778b/mzaf_4237462713258033068.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c3/f0/fd/c3f0fdae-b517-f0cf-cbdf-8036c7ce117e/mzaf_13442410845971477726.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9e/89/a8/9e89a883-4858-a311-786e-f1ee96137cdd/mzaf_10663441610848496018.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c5/a5/8c/c5a58c0e-92cd-a6b0-b81d-40650d69358a/mzaf_8381237295757067097.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ac/1e/4a/ac1e4a70-2e7b-60c3-4971-3cc09d38815b/mzaf_7284747758742989760.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/64/be/71/64be714f-e61c-22b4-426e-10ca4d41ea9e/mzaf_8204469692647636183.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f9/1d/17/f91d1792-00a1-eec3-64d3-ee5edc150c74/mzaf_1132967870784229866.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/71/47/f7/7147f763-034f-e120-67fd-e9dc7b7e5f13/mzaf_5781812974030265972.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/53/70/0c/53700c23-87a7-e050-11ca-4b1bd52d2d2f/mzaf_9309538996740184890.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fd/7e/59/fd7e59df-13d3-5716-fe89-d61b699bc262/mzaf_3999376079533103487.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8e/dd/a4/8edda474-3fe1-3fe6-43d3-765db520a29b/mzaf_11740310005222997767.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6a/94/8a/6a948abe-1f62-4824-6d07-071854e5f4b1/mzaf_7845856316638946970.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/fd/5e/b8/fd5eb83b-8836-1d3e-a7d4-20618c9de84f/mzaf_4160412870870308123.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/ed/8c/38/ed8c385e-d3fe-2fc1-b973-5e8962c44018/mzaf_16044758333188193120.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/82/4f/75/824f7596-5fd1-f267-ce8e-d1958511f5c5/mzaf_11042398661330285568.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9b/72/e4/9b72e45e-d9c5-e054-1dcb-da193d086007/mzaf_5854048791426938853.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9f/95/57/9f9557ba-0c01-6f4d-bb2c-e6f87136c6f2/mzaf_14812554229219757093.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/86/3e/2e/863e2ee1-651d-3dc2-c7b6-05d7f6195b6e/mzaf_15794885840043942760.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6a/a5/6f/6aa56ff5-151e-36c8-d3b1-5287663433ec/mzaf_11752203345682364472.plus.aac.p.m4a",
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9e/49/f4/9e49f403-f96d-73d7-b15f-0f11a2e082a4/mzaf_10388231531758867237.plus.aac.p.m4a"
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
        createChatSettings(chats);
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
            u.setIsPrivate(i >= 10 && i < 30);
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

        for (int i = 0; i < 200; i++) {
            User user = users.get(i % users.size());
            Post p = new Post();
            p.setUser(user);
            p.setCaption(QUOTES[i % QUOTES.length] + " #" + HASHTAGS[i % HASHTAGS.length]);
            p.setVisibility("PUBLIC");
            p.setHideLikeCount(i >= 60 && i < 100);
            p.setCommentsDisabled(i >= 100 && i < 120);
            p.setMusicId((long) (rnd.nextInt(100) + 1));
            list.add(p);
        }

        return postRepository.saveAll(list);
    }

    private List<Media> createMedia(List<Post> posts) {
        List<Media> list = new ArrayList<>();

        for (int i = 0; i < posts.size(); i++) {
            Post post = posts.get(i);
            boolean isVideo = i % 4 == 0;

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

            if (i % 4 == 1) {
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
                    c.setPinned(list.size() < 10);
                    c.setMuted(list.size() >= 100);
                    if (list.size() % 15 == 0) c.setVanishMode("ENABLED");
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

    private void createChatSettings(List<Chat> chats) {
        List<ChatSetting> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Random rnd = new Random(890);

        for (Chat chat : chats) {
            for (int j = 0; j < 2; j++) {
                User user = j == 0 ? chat.getUserOne() : chat.getUserTwo();
                String key = user.getId() + ":" + chat.getId();
                if (seen.add(key)) {
                    ChatSetting cs = new ChatSetting();
                    cs.setUser(user);
                    cs.setChat(chat);
                    cs.setTheme(rnd.nextBoolean() ? "DARK" : "LIGHT");
                    cs.setMutedNotifications(list.size() > 200);
                    cs.setMuteCalls(false);
                    list.add(cs);
                }
            }
        }

        chatSettingRepository.saveAll(list);
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
                if (!members.contains(member)) members.add(member);
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

        for (int i = 0; i < 200; i++) {
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
                    .isTrending(i < 30)
                    .usageCount((long) (rnd.nextInt(1000) + 1))
                    .build();
            list.add(sm);
        }

        storyMusicRepository.saveAll(list);
    }
}
