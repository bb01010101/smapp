--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ChallengeType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ChallengeType" AS ENUM (
    'DAILY',
    'SEASONAL',
    'WEEKLY'
);


ALTER TYPE public."ChallengeType" OWNER TO neondb_owner;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."NotificationType" AS ENUM (
    'LIKE',
    'COMMENT',
    'FOLLOW'
);


ALTER TYPE public."NotificationType" OWNER TO neondb_owner;

--
-- Name: PostType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PostType" AS ENUM (
    'REGULAR',
    'PRODUCT',
    'SERVICE'
);


ALTER TYPE public."PostType" OWNER TO neondb_owner;

--
-- Name: Prestige; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Prestige" AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'LAPIS_LAZULI',
    'EMERALD',
    'PURPLE_AMETHYST',
    'RUBY',
    'DIAMOND'
);


ALTER TYPE public."Prestige" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Bark; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Bark" (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "authorId" text NOT NULL,
    "communityId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Bark" OWNER TO neondb_owner;

--
-- Name: BarkComment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."BarkComment" (
    id text NOT NULL,
    content text NOT NULL,
    "authorId" text NOT NULL,
    "barkId" text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BarkComment" OWNER TO neondb_owner;

--
-- Name: BarkCommentVote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."BarkCommentVote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "commentId" text NOT NULL,
    value integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BarkCommentVote" OWNER TO neondb_owner;

--
-- Name: BarkVote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."BarkVote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "barkId" text NOT NULL,
    value integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BarkVote" OWNER TO neondb_owner;

--
-- Name: ChallengeConfig; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ChallengeConfig" (
    id text NOT NULL,
    "challengeName" text NOT NULL,
    type public."ChallengeType" NOT NULL,
    description text NOT NULL,
    xp integer NOT NULL,
    goal integer NOT NULL,
    "seasonLength" integer,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ChallengeConfig" OWNER TO neondb_owner;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    content text NOT NULL,
    "authorId" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Comment" OWNER TO neondb_owner;

--
-- Name: Community; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Community" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "creatorId" text
);


ALTER TABLE public."Community" OWNER TO neondb_owner;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO neondb_owner;

--
-- Name: ConversationParticipant; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ConversationParticipant" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conversationId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConversationParticipant" OWNER TO neondb_owner;

--
-- Name: Follows; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Follows" (
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Follows" OWNER TO neondb_owner;

--
-- Name: Like; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Like" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Like" OWNER TO neondb_owner;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO neondb_owner;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "creatorId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "postId" text,
    "commentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO neondb_owner;

--
-- Name: Pet; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Pet" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    species text NOT NULL,
    breed text,
    age text,
    bio text,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "loveCount" integer DEFAULT 0 NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    level integer DEFAULT 1 NOT NULL,
    "loginStreak" integer DEFAULT 0 NOT NULL,
    prestige public."Prestige" DEFAULT 'BRONZE'::public."Prestige" NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    "evolutionImageUrl" text
);


ALTER TABLE public."Pet" OWNER TO neondb_owner;

--
-- Name: PetNetShare; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PetNetShare" (
    id text NOT NULL,
    "senderId" text NOT NULL,
    recipient text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PetNetShare" OWNER TO neondb_owner;

--
-- Name: Post; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    "petId" text,
    content text,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mediaType" text,
    "affiliateCode" text,
    "affiliateLink" text,
    category text,
    condition text,
    description text,
    "isAffiliate" boolean,
    location text,
    price double precision,
    "priceType" text,
    title text,
    type public."PostType" DEFAULT 'REGULAR'::public."PostType" NOT NULL
);


ALTER TABLE public."Post" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    "clerkId" text NOT NULL,
    name text,
    bio text,
    image text,
    location text,
    website text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "lastLocationUpdate" timestamp(3) without time zone,
    latitude double precision,
    "locationSharingEnabled" boolean DEFAULT false,
    longitude double precision,
    "totalXp" integer DEFAULT 0 NOT NULL,
    "useEvolutionImages" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: UserChallenge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."UserChallenge" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "challengeName" text NOT NULL,
    type public."ChallengeType" NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    goal integer NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "seasonId" text
);


ALTER TABLE public."UserChallenge" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: Bark; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Bark" (id, title, content, "authorId", "communityId", "createdAt", "updatedAt", upvotes) FROM stdin;
cmc9xp08t0001lb043t9af4wd	New pet owner help!	Have a new baby lab, what are the top 3 pieces of advice you recommend?	cmc9xc7h20000l404q4obhe6e	cmc2uzgw10001u5hrm6wjhyct	2025-06-24 02:56:27.773	2025-06-24 02:56:27.773	0
cmdgc0gqd000ou55qovsyj907	Swimming Dog!	Any tips on how to teach my dog how to swim?  I want a buoyant doggo!	cmdgbub1r000iu55quiraxb10	cmc2uzsuq0003u5hrb4ybo0vw	2025-07-23 19:03:36.373	2025-07-23 19:03:36.373	0
\.


--
-- Data for Name: BarkComment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BarkComment" (id, content, "authorId", "barkId", "parentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: BarkCommentVote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BarkCommentVote" (id, "userId", "commentId", value, "createdAt") FROM stdin;
\.


--
-- Data for Name: BarkVote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BarkVote" (id, "userId", "barkId", value, "createdAt") FROM stdin;
cmcmpm0yk000bl804skk06m9i	cmcc8kd3o0000l40482ybot2g	cmc9xp08t0001lb043t9af4wd	1	2025-07-03 01:31:12.093
cmd1dfk7r0001u5lpn0vuaizq	cmc2u6sc60004u5y6arw0h0ja	cmc9xp08t0001lb043t9af4wd	1	2025-07-13 07:46:47.702
\.


--
-- Data for Name: ChallengeConfig; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ChallengeConfig" (id, "challengeName", type, description, xp, goal, "seasonLength", active) FROM stdin;
cmd1do3cg0000u5v7o7sa8jp0	login	DAILY	Log in today	10	1	\N	t
cmd1do3mv0001u5v7hyk0iyyk	post_timeline_photo	DAILY	Post a timeline photo	20	1	\N	t
cmd1do3tp0002u5v7finkzipi	like_post	DAILY	Like a post	10	1	\N	t
cmd1do40j0003u5v7uv9z5iib	follow_3_users	DAILY	Follow 3 users	15	3	\N	t
cmd1do46y0004u5v7oppzfx3k	share_app	DAILY	Share this app with a friend	25	1	\N	t
cmd1do4d60005u5v74o5nfyin	gain_100_followers	SEASONAL	Gain 100 followers	200	100	10	t
cmd1do4kk0006u5v7nqav9uq9	post_10_days	SEASONAL	Post every day for 10 days	150	10	10	t
cmd1do4r20007u5v7yk000pjm	share_10_friends	SEASONAL	Share with 10 friends	250	10	10	t
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Comment" (id, content, "authorId", "postId", "createdAt") FROM stdin;
cmc9qcfi40003u52m7z5vm1ty	Test	cmc2utm630000u56mr2eaja74	cmc9nouga0003l804vpvlx5bo	2025-06-23 23:30:43.709
cmc9qhxtc0005u52my3nsf44z	hello	cmc2utm630000u56mr2eaja74	cmc9nq54r0005l8040ad7w8mo	2025-06-23 23:35:00.72
cmc9ql3ok0007u52mcynjk2k5	yo	cmc2utm630000u56mr2eaja74	cmc2w83210003l504yflkyl4a	2025-06-23 23:37:28.293
cmc9wo0je000bu52mczkdlg12	Test	cmc2utm630000u56mr2eaja74	cmc2unjpf0001u5q2sqmrptxs	2025-06-24 02:27:41.882
cmca136cb0001u5fqr9cc3bhz	Nice!	cmc2utm630000u56mr2eaja74	cmc9nnnvk0001l804alzhvk58	2025-06-24 04:31:27.706
cmcmpkg3j0005ld04hyzb98j2	now that's a dog!	cmc9xc7h20000l404q4obhe6e	cmcmpfs610001ky04eqcd5gd7	2025-07-03 01:29:58.399
cmdcfb0gj000bu5apsx5du2qm	Nice!	cmc2u6sc60004u5y6arw0h0ja	cmcjuygvg0001u5n7up3c2f2u	2025-07-21 01:24:42.643
cmdgeng6e0001u5lwwnt0blfj	Cute doggo	cmdgbub1r000iu55quiraxb10	cmdg8pbam0005u57efozwhobh	2025-07-23 20:17:27.973
cmdgl7w3z0007u5mmpj1t1oi8	Awww	cmc2u6sc60004u5y6arw0h0ja	cmdg8pbam0005u57efozwhobh	2025-07-23 23:21:19.439
cmdgllafm000bu5mm7pgc1yk8	Great views	cmc2u6sc60004u5y6arw0h0ja	cmdceg7m90007u5ap3j3cd27o	2025-07-23 23:31:44.528
cmdglm4wk000du5mm80qyu00e	Wow!	cmc2u6sc60004u5y6arw0h0ja	cmdcdt2nm0001u5apnke85bhv	2025-07-23 23:32:24.018
cmdgm201f0001u5k4n088imqk	Good boy!	cmc2u6sc60004u5y6arw0h0ja	cmclcicnx0003u56aexezi8fk	2025-07-23 23:44:44.21
cmdgmfpow0005l504g3urnns9	Beautiful beach	cmc2u6sc60004u5y6arw0h0ja	cmd15x6an0005u5kg8dg091iw	2025-07-23 23:55:23.985
cmdgq9p0x0001le04cktrp6z2	testing	cmc2u6sc60004u5y6arw0h0ja	cmdg8pbam0005u57efozwhobh	2025-07-24 01:42:41.649
cmdgq9vv10003le042y7kpkau	test	cmc2u6sc60004u5y6arw0h0ja	cmdg8pbam0005u57efozwhobh	2025-07-24 01:42:50.509
\.


--
-- Data for Name: Community; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Community" (id, name, description, "createdAt", "creatorId") FROM stdin;
cmc2uzgw10001u5hrm6wjhyct	New Pet Owners	First time with a pup? Share your questions, wins, and wags with fellow new dog parents.	2025-06-19 04:06:13.825	cmc2utm630000u56mr2eaja74
cmc2uzsuq0003u5hrb4ybo0vw	Dog Training	From sit to stay (and everything in between), swap tips and tales on shaping good behavior.	2025-06-19 04:06:29.331	cmc2utm630000u56mr2eaja74
cmc2v0c2j0005u5hrcbwzjsrg	Pet Play 	Fetch, agility, hikes—explore fun ways to keep your dog active and engaged	2025-06-19 04:06:54.235	cmc2utm630000u56mr2eaja74
cmc2v0ulf0007u5hre8gk220h	Food and Treats	Talk kibble, home-cooked meals, and snack favorites your pup can’t resist.	2025-06-19 04:07:18.244	cmc2utm630000u56mr2eaja74
cmc2v16lc0009u5hre1th9dot	Budget-friendly essentials and tips	Smart saving for your furry friend—affordable hacks, products, and advice.	2025-06-19 04:07:33.793	cmc2utm630000u56mr2eaja74
cmc2v3r2n000fu5hrqa1ce54i	Behavioral Challenges (Support)	Barking, biting, or anxiety? You’re not alone—get and give support here.	2025-06-19 04:09:33.648	cmc2utm630000u56mr2eaja74
cmc2v481r000hu5hrubsjcavz	Emergency	Share stories and advice on urgent care or managing long-term conditions.	2025-06-19 04:09:55.647	cmc2utm630000u56mr2eaja74
cmc2v4nuy000ju5hrtlznww4y	Veterinary Insights and Advocacy	Ask a vet, share medical knowledge, and discuss pet health advocacy.	2025-06-19 04:10:16.138	cmc2utm630000u56mr2eaja74
cmc2v50lq000lu5hr3ben2tki	Fun Stories, Photos, Milestones	Post those zoomies, birthdays, gotcha days, and heart-melting snapshots!	2025-06-19 04:10:32.654	cmc2utm630000u56mr2eaja74
cmc2v5i6l000nu5hrri7p3ns2	Miscellaneous (Lost and Found)	Anything that doesn’t fit elsewhere—plus help reunite lost pets with their people.	2025-06-19 04:10:55.437	cmc2utm630000u56mr2eaja74
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Conversation" (id, "updatedAt", "createdAt") FROM stdin;
cmc9kndh00000u5xdzxi6gd01	2025-06-23 20:51:16.597	2025-06-23 20:51:16.597
cmccr1qwy0000l704xfr3uqrd	2025-06-26 02:13:43.426	2025-06-26 02:13:43.426
\.


--
-- Data for Name: ConversationParticipant; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ConversationParticipant" (id, "userId", "conversationId", "joinedAt") FROM stdin;
cmc9kndh30002u5xdg58atoi3	cmc2utm630000u56mr2eaja74	cmc9kndh00000u5xdzxi6gd01	2025-06-23 20:51:16.597
cmc9kndh30003u5xdfqy64pu1	cmc2u6sc60004u5y6arw0h0ja	cmc9kndh00000u5xdzxi6gd01	2025-06-23 20:51:16.597
cmccr1qwy0002l704ym6p9pg2	cmc9xc7h20000l404q4obhe6e	cmccr1qwy0000l704xfr3uqrd	2025-06-26 02:13:43.426
cmccr1qwy0003l704aajeyuwb	cmcc8kd3o0000l40482ybot2g	cmccr1qwy0000l704xfr3uqrd	2025-06-26 02:13:43.426
\.


--
-- Data for Name: Follows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Follows" ("followerId", "followingId", "createdAt") FROM stdin;
cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	2025-06-24 02:46:56.262
cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 02:00:12.34
cmc2u6sc60004u5y6arw0h0ja	cmc9xc7h20000l404q4obhe6e	2025-06-25 22:58:38.027
cmc2u6sc60004u5y6arw0h0ja	cmcc8kd3o0000l40482ybot2g	2025-06-25 22:58:40.08
cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:40:01.731
cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	2025-06-26 01:40:02.434
cmc9xc7h20000l404q4obhe6e	cmc2utm630000u56mr2eaja74	2025-06-26 01:40:07.848
cmc9xc7h20000l404q4obhe6e	cmcajxll50000l70ayd9bbcmb	2025-06-26 01:40:08.485
cmc9xc7h20000l404q4obhe6e	cmcc8kd3o0000l40482ybot2g	2025-06-26 01:40:09.328
cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	2025-07-05 19:35:49.231
cmc9xc7h20000l404q4obhe6e	cmcqalrvk0000l404w5hm36sj	2025-07-06 02:51:31.522
cmc2u6sc60004u5y6arw0h0ja	cmcajxll50000l70ayd9bbcmb	2025-07-13 21:53:33.318
cmcc8kd3o0000l40482ybot2g	cmc2utm630000u56mr2eaja74	2025-07-16 03:07:35.658
cmcc8kd3o0000l40482ybot2g	cmcqalrvk0000l404w5hm36sj	2025-07-16 03:07:37.402
cmcc8kd3o0000l40482ybot2g	cmcajxll50000l70ayd9bbcmb	2025-07-16 03:07:38.585
\.


--
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Like" (id, "postId", "userId", "createdAt") FROM stdin;
cmc9o3baw000fl80453rlyg0x	cmc2w83210003l504yflkyl4a	cmc2utm630000u56mr2eaja74	2025-06-23 22:27:39.114
cmc9phq84000ju5s889k4c20j	cmc2unjpf0001u5q2sqmrptxs	cmc2utm630000u56mr2eaja74	2025-06-23 23:06:51.225
cmc9por1o000ru5s8v25zpe4n	cmc9nnnvk0001l804alzhvk58	cmc2utm630000u56mr2eaja74	2025-06-23 23:12:18.924
cmc9pu53j000tu5s86j72ez3x	cmc2w8xce0005l504tf67ick7	cmc2utm630000u56mr2eaja74	2025-06-23 23:16:30.376
cmc9qca6d0001u52mhwkwhcfs	cmc9nouga0003l804vpvlx5bo	cmc2utm630000u56mr2eaja74	2025-06-23 23:30:36.804
cmca2wfah0001ld04i9lkiph7	cmc9nrbmn0009l804z9ma9kow	cmc2utm630000u56mr2eaja74	2025-06-24 05:22:11.945
cmcbbyc52000nu57di4h6htll	cmcasjvds0005u5xeylg1oc2k	cmc2utm630000u56mr2eaja74	2025-06-25 02:23:23.894
cmcbd06rs000pu57dwf2sqpyf	cmc9nqfsp0007l8044mou5y4f	cmc2utm630000u56mr2eaja74	2025-06-25 02:52:49.864
cmcbd08mn000ru57dshuyroev	cmc9nq54r0005l8040ad7w8mo	cmc2utm630000u56mr2eaja74	2025-06-25 02:52:52.271
cmcbdkcyq000tu57d9s50an4f	cmc2w798r0001l504dj0wqb61	cmc2utm630000u56mr2eaja74	2025-06-25 03:08:30.968
cmcbdklbn000xu57dg667dr1u	cmcasnjtm0001ji047axvahev	cmc2utm630000u56mr2eaja74	2025-06-25 03:08:41.791
cmcbe5w2w0001l204jhc6dp3q	cmcasnjtm0001ji047axvahev	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 03:25:15.561
cmcbe5zpz0003l20481vdnncj	cmc2w8xce0005l504tf67ick7	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 03:25:20.28
cmcck247l0001l804czx1rgns	cmc2w48ub0005le04ltumzug2	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 22:58:03.345
cmcck48ql0009jy04lp37z3pc	cmcc9475m0005jo0412zgpcvk	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 22:59:42.51
cmcck49j1000djy04ozje2sn1	cmcc930b30003jo04gzqq041b	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 22:59:43.534
cmcck4b7i000hjy04bks03li6	cmcc92f9g0001jo04yol93884	cmc2u6sc60004u5y6arw0h0ja	2025-06-25 22:59:45.712
cmccomdbb0001u5z8q41w3jon	cmc2unjpf0001u5q2sqmrptxs	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:05:46.726
cmccomk6r0003u5z87itoav1d	cmc9nq54r0005l8040ad7w8mo	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:05:55.591
cmccopv3s0007u5z8jq276kwn	cmc9nnnvk0001l804alzhvk58	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:08:29.704
cmccow6ab000bu5z8rg54aocb	cmc9nqfsp0007l8044mou5y4f	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:13:24.127
cmccowqs6000fu5z8tnlu08ld	cmc2w798r0001l504dj0wqb61	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:13:50.742
cmccp1cy9000hu5z8kf5lbn53	cmc2w83210003l504yflkyl4a	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:17:26.097
cmccq21pj0007jl04k1w7r3ha	cmccpz5qy0001jl04fg1kfnoo	cmc9xc7h20000l404q4obhe6e	2025-06-26 01:45:57.786
cmccq22ji000bjl04ptsupltz	cmccn7exu0001jx04rlmrywgt	cmc9xc7h20000l404q4obhe6e	2025-06-26 01:45:58.866
cmccqalny000fjl048kai3x8o	cmc9nrbmn0009l804z9ma9kow	cmc2u6sc60004u5y6arw0h0ja	2025-06-26 01:52:36.898
cmcij0hze0001u5n0axhb9x1n	cmccn7exu0001jx04rlmrywgt	cmc2utm630000u56mr2eaja74	2025-06-30 03:15:25.272
cmcj81kmi0001ic047sh39toy	cmcij6myx0005u5n0wkw2d5rp	cmc2u6sc60004u5y6arw0h0ja	2025-06-30 14:56:05.802
cmcj81o6d0007ic0451wpucqy	cmccpz5qy0001jl04fg1kfnoo	cmc2u6sc60004u5y6arw0h0ja	2025-06-30 14:56:10.406
cmcjzhhyn0001u56f5npm6uv3	cmcjuygvg0001u5n7up3c2f2u	cmc2utm630000u56mr2eaja74	2025-07-01 03:44:18.383
cmck15b0j0001l8046nai4d8s	cmccr5jv30005l7041unwkgc8	cmc2u6sc60004u5y6arw0h0ja	2025-07-01 04:30:48.819
cmck15km20005l8044zcao349	cmcjuygvg0001u5n7up3c2f2u	cmc2u6sc60004u5y6arw0h0ja	2025-07-01 04:31:01.275
cmclbg72x0001u5gpdtjbngna	cmcla0cja0001jy04fsqlkqed	cmc2u6sc60004u5y6arw0h0ja	2025-07-02 02:06:59.249
cmclcxdro0001k2046p93dx7i	cmccn7exu0001jx04rlmrywgt	cmc2u6sc60004u5y6arw0h0ja	2025-07-02 02:48:20.724
cmcmpk7mo0001ld04qcbzuao4	cmcmpfs610001ky04eqcd5gd7	cmc9xc7h20000l404q4obhe6e	2025-07-03 01:29:47.414
cmcmpwxj50001u56ugllqcfsi	cmcmpfs610001ky04eqcd5gd7	cmc2u6sc60004u5y6arw0h0ja	2025-07-03 01:39:40.821
cmcmsfh5l0005l204qv1apxct	cmcc9475m0005jo0412zgpcvk	cmc9xc7h20000l404q4obhe6e	2025-07-03 02:50:05.326
cmcqamf5y0002l404f1tc9ufj	cmc9nqfsp0007l8044mou5y4f	cmcqalrvk0000l404w5hm36sj	2025-07-05 13:42:40.954
cmcqm2ztf0001u52cp0ibo47q	cmcpbu5310001jj041l8xrrds	cmc2u6sc60004u5y6arw0h0ja	2025-07-05 19:03:29.931
cmcqs9sor0001u5lni3gt7vry	cmcmn8cd00001l6048y616rbl	cmc2u6sc60004u5y6arw0h0ja	2025-07-05 21:56:44.99
cmcr2ucag0005lb04k0kuy70o	cmcc95riu0009jo04u63lle1h	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:39.725
cmcr2ue5l0009lb04seaxqebz	cmcc952y00007jo04zp28emh0	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:42.137
cmcr2ugxp000dlb04mw8fmtfy	cmcc930b30003jo04gzqq041b	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:45.745
cmcr2uifm000hlb04d9klkekb	cmcc92f9g0001jo04yol93884	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:47.686
cmcr2ul9i000llb041y86hfds	cmc9nqfsp0007l8044mou5y4f	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:51.352
cmcr2ummc000plb04uw4vsy15	cmc9nrbmn0009l804z9ma9kow	cmc9xc7h20000l404q4obhe6e	2025-07-06 02:52:53.113
cmcxf5pxc0001u51vujol03ij	cmcc95riu0009jo04u63lle1h	cmc2utm630000u56mr2eaja74	2025-07-10 13:24:03.029
cmcxf68z40005u51vm79f6194	cmccpz5qy0001jl04fg1kfnoo	cmc2utm630000u56mr2eaja74	2025-07-10 13:24:27.716
cmd1dpcmk000bu5lpzu15p8vk	cmc9nouga0003l804vpvlx5bo	cmc2u6sc60004u5y6arw0h0ja	2025-07-13 07:54:24.344
cmd6ogfzy0001u5fi7gqspbjz	cmcc952y00007jo04zp28emh0	cmc2u6sc60004u5y6arw0h0ja	2025-07-17 00:54:15.501
cmdc9c6l30001u5eyknkwmy1i	cmcved3cy0003jp042e0dwvwv	cmc2u6sc60004u5y6arw0h0ja	2025-07-20 22:37:39.508
cmdc9n0nk0007u5eyocs5ll5r	cmcr2u8tl0003lb0476ifgoc5	cmc2u6sc60004u5y6arw0h0ja	2025-07-20 22:46:05.037
cmdc9n56x000bu5ey304jri6r	cmcc95riu0009jo04u63lle1h	cmc2u6sc60004u5y6arw0h0ja	2025-07-20 22:46:10.918
cmdg88ou50001u57ef15cu09q	cmdceg7m90007u5ap3j3cd27o	cmc2u6sc60004u5y6arw0h0ja	2025-07-23 17:18:01.66
cmdgay9b50003u55qld6r1qbn	cmdg8pbam0005u57efozwhobh	cmc2utm630000u56mr2eaja74	2025-07-23 18:33:53.783
cmdgaycl40009u55qeoc570ck	cmdceg7m90007u5ap3j3cd27o	cmc2utm630000u56mr2eaja74	2025-07-23 18:33:58.033
cmdgayeew000du55qfmrsgan8	cmdce4prf0003u5apnp6ihab0	cmc2utm630000u56mr2eaja74	2025-07-23 18:34:00.391
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Message" (id, "conversationId", "senderId", content, read, "createdAt") FROM stdin;
cmc9kno4x0005u5xd93j7lp7n	cmc9kndh00000u5xdzxi6gd01	cmc2utm630000u56mr2eaja74	I like your dog	f	2025-06-23 20:51:30.417
cmckz52ij0001if046y0dgn09	cmccr1qwy0000l704xfr3uqrd	cmcc8kd3o0000l40482ybot2g	hi bummy	f	2025-07-01 20:22:24.763
cmcl9crep0001l104cizgawhq	cmccr1qwy0000l704xfr3uqrd	cmc9xc7h20000l404q4obhe6e	hi bums!	f	2025-07-02 01:08:19.777
cmcl9gtci0001jr04q00m9vpz	cmccr1qwy0000l704xfr3uqrd	cmcc8kd3o0000l40482ybot2g	hi	f	2025-07-02 01:11:28.915
cmcqdi4f10001l1046zi36df2	cmccr1qwy0000l704xfr3uqrd	cmc9xc7h20000l404q4obhe6e	love you bums	f	2025-07-05 15:03:19.261
cmcqo01aq000fu5o9dsawpeb9	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	Save this pet!	f	2025-07-05 19:57:11.186
cmcqo2e05000hu5o9a4lteck2	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	Save this pet!\nhttp://localhost:3000/pet/e41537e6-7bfb-428e-818d-595b2a57091d	f	2025-07-05 19:59:00.962
cmcqoi241000ju5o9vwqhmrrl	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	Save this pet!	f	2025-07-05 20:11:12.048
cmcqoi2bg000lu5o9br6amx67	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	[Otis](http://localhost:3000/pet/3fb75041-17a8-4164-ab30-1edb9914f7cb)	f	2025-07-05 20:11:12.317
cmcramvfp0001ie046p4fcl97	cmccr1qwy0000l704xfr3uqrd	cmcc8kd3o0000l40482ybot2g	i love you more baba	f	2025-07-06 06:30:48.229
cmcs42kc60001jl042v0xgr3d	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	Save this pet!	f	2025-07-06 20:14:49.206
cmcs42kiq0003jl04v85oyzuu	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	[Max](https://www.thepetnet.co/pet/ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1)	f	2025-07-06 20:14:49.442
cmcvednml0005jp04zanha0jb	cmccr1qwy0000l704xfr3uqrd	cmc9xc7h20000l404q4obhe6e	missing you!	f	2025-07-09 03:26:41.373
cmd2cyyen0001u5b9289kxc2q	cmc9kndh00000u5xdzxi6gd01	cmc2u6sc60004u5y6arw0h0ja	I want your dog	f	2025-07-14 00:21:39.118
cmd5dt4hv0007jx04snsasrfh	cmccr1qwy0000l704xfr3uqrd	cmcc8kd3o0000l40482ybot2g	i miss you bummy	f	2025-07-16 03:08:25.219
cmd5dt7ud0009jx04unn3cpfd	cmccr1qwy0000l704xfr3uqrd	cmcc8kd3o0000l40482ybot2g	i love you 	f	2025-07-16 03:08:29.557
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Notification" (id, "userId", "creatorId", type, read, "postId", "commentId", "createdAt") FROM stdin;
cmc9o3baw000hl804o3suufqs	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2w83210003l504yflkyl4a	\N	2025-06-23 22:27:39.114
cmc9oj6m90005u5s8b8w8rhik	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2w8xce0005l504tf67ick7	\N	2025-06-23 22:39:59.506
cmc9owgrx000bu5s8rv8ud97y	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2unjpf0001u5q2sqmrptxs	\N	2025-06-23 22:50:19.183
cmc9p54gs000fu5s8c9za9ffc	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2w798r0001l504dj0wqb61	\N	2025-06-23 22:57:03.094
cmc9phq84000lu5s872g1fg5d	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2unjpf0001u5q2sqmrptxs	\N	2025-06-23 23:06:51.225
cmc9pu53k000vu5s8jn7q9ftx	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2w8xce0005l504tf67ick7	\N	2025-06-23 23:16:30.376
cmc9ql3r20009u52mvgv5qy5o	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	COMMENT	t	cmc2w83210003l504yflkyl4a	cmc9ql3ok0007u52mcynjk2k5	2025-06-23 23:37:28.382
cmc9wo0lo000du52mplxokhmz	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	COMMENT	t	cmc2unjpf0001u5q2sqmrptxs	cmc9wo0je000bu52mczkdlg12	2025-06-24 02:27:41.964
cmc9xcr9u0001ky04v286yrx8	cmc2u6sc60004u5y6arw0h0ja	cmc9xc7h20000l404q4obhe6e	FOLLOW	t	\N	\N	2025-06-24 02:46:56.262
cmcbb4ig00001u57duvowhpiz	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	FOLLOW	t	\N	\N	2025-06-25 02:00:12.34
cmcbb4mfk0005u57dmmochrlv	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 02:00:17.492
cmcbb7pkx0009u57d4nglp9hw	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 02:02:41.567
cmcbby3qq000du57d856ayj4j	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 02:23:12.927
cmcbby5td000hu57dni6ipz1i	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 02:23:15.663
cmcbby81m000lu57dxml00ib3	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 02:23:18.549
cmcbdkcyq000vu57dlf4ocxoj	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmc2w798r0001l504dj0wqb61	\N	2025-06-25 03:08:30.968
cmcbdklbn000zu57dvg335c6p	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcasnjtm0001ji047axvahev	\N	2025-06-25 03:08:41.791
cmccomk6r0005u5z8obqk32hz	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmc9nq54r0005l8040ad7w8mo	\N	2025-06-26 01:05:55.591
cmccopv3s0009u5z8mtqjh25x	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmc9nnnvk0001l804alzhvk58	\N	2025-06-26 01:08:29.704
cmccow6ac000du5z8eis7224x	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmc9nqfsp0007l8044mou5y4f	\N	2025-06-26 01:13:24.127
cmccpujp00005ih04m8oi3u2v	cmc2utm630000u56mr2eaja74	cmc9xc7h20000l404q4obhe6e	FOLLOW	f	\N	\N	2025-06-26 01:40:07.848
cmccpuk6p0007ih046yjreevr	cmcajxll50000l70ayd9bbcmb	cmc9xc7h20000l404q4obhe6e	FOLLOW	f	\N	\N	2025-06-26 01:40:08.485
cmcck2lho0003l404qb71wwfw	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc930b30003jo04gzqq041b	\N	2025-06-25 22:58:25.727
cmcck2plr0007l404sa0tl2wt	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc9475m0005jo0412zgpcvk	\N	2025-06-25 22:58:31.058
cmcck2red000bl404prkudsih	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc952y00007jo04zp28emh0	\N	2025-06-25 22:58:33.384
cmcck2wke000fl404gitxgwj0	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	FOLLOW	t	\N	\N	2025-06-25 22:58:40.08
cmcck30in000jl4046yvhtakc	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc95riu0009jo04u63lle1h	\N	2025-06-25 22:58:45.201
cmcck3560000nl404764e24ps	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc92f9g0001jo04yol93884	\N	2025-06-25 22:58:51.227
cmcck441q0003jy046ku1m4lb	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc95riu0009jo04u63lle1h	\N	2025-06-25 22:59:36.43
cmcck47rg0007jy04o800417m	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc952y00007jo04zp28emh0	\N	2025-06-25 22:59:41.245
cmcck48ql000bjy04z9ty9zbq	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc9475m0005jo0412zgpcvk	\N	2025-06-25 22:59:42.51
cmcck49j1000fjy04p4ng99th	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc930b30003jo04gzqq041b	\N	2025-06-25 22:59:43.534
cmcck4b7i000jjy04t70a5h2m	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcc92f9g0001jo04yol93884	\N	2025-06-25 22:59:45.712
cmccpuku30009ih04bnb9lcej	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	FOLLOW	t	\N	\N	2025-06-26 01:40:09.328
cmccpuez20001ih04z2qmu7rn	cmc2u6sc60004u5y6arw0h0ja	cmcc8kd3o0000l40482ybot2g	FOLLOW	t	\N	\N	2025-06-26 01:40:01.731
cmccq1zof0005jl04zy7nyc0n	cmc2u6sc60004u5y6arw0h0ja	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmccpz5qy0001jl04fg1kfnoo	\N	2025-06-26 01:45:55.154
cmccq21pj0009jl04sbrfirfq	cmc2u6sc60004u5y6arw0h0ja	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmccpz5qy0001jl04fg1kfnoo	\N	2025-06-26 01:45:57.786
cmcck2uzd000dl404r4534169	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	FOLLOW	t	\N	\N	2025-06-25 22:58:38.027
cmccpufil0003ih04j47n9l9u	cmc9xc7h20000l404q4obhe6e	cmcc8kd3o0000l40482ybot2g	FOLLOW	t	\N	\N	2025-06-26 01:40:02.434
cmccqalnz000hjl04pgbyl38w	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmc9nrbmn0009l804z9ma9kow	\N	2025-06-26 01:52:36.898
cmcxf5pxd0003u51vh40l5ecl	cmcc8kd3o0000l40482ybot2g	cmc2utm630000u56mr2eaja74	LIKE	t	cmcc95riu0009jo04u63lle1h	\N	2025-07-10 13:24:03.029
cmccq22ji000djl04ro4xwl4c	cmc2u6sc60004u5y6arw0h0ja	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmccn7exu0001jx04rlmrywgt	\N	2025-06-26 01:45:58.866
cmcij0hzg0003u5n0c6h2yf82	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmccn7exu0001jx04rlmrywgt	\N	2025-06-30 03:15:25.272
cmcjzhhyo0003u56f1jh7cckj	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	t	cmcjuygvg0001u5n7up3c2f2u	\N	2025-07-01 03:44:18.383
cmcqamf5y0004l404fb4gw7sj	cmc2utm630000u56mr2eaja74	cmcqalrvk0000l404w5hm36sj	LIKE	f	cmc9nqfsp0007l8044mou5y4f	\N	2025-07-05 13:42:40.954
cmcqn8k680001u5o9b21etk87	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	FOLLOW	f	\N	\N	2025-07-05 19:35:49.231
cmcr2svo10001lb0453vprc4f	cmcqalrvk0000l404w5hm36sj	cmc9xc7h20000l404q4obhe6e	FOLLOW	f	\N	\N	2025-07-06 02:51:31.522
cmcr2ul9i000nlb04ounjrqnp	cmc2utm630000u56mr2eaja74	cmc9xc7h20000l404q4obhe6e	LIKE	f	cmc9nqfsp0007l8044mou5y4f	\N	2025-07-06 02:52:51.352
cmcr2ummc000rlb04qzqyqz9n	cmc2utm630000u56mr2eaja74	cmc9xc7h20000l404q4obhe6e	LIKE	f	cmc9nrbmn0009l804z9ma9kow	\N	2025-07-06 02:52:53.113
cmcmpk7mo0003ld04v0w4fxp0	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcmpfs610001ky04eqcd5gd7	\N	2025-07-03 01:29:47.414
cmcmpkg490007ld045o11u6sz	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	COMMENT	t	cmcmpfs610001ky04eqcd5gd7	cmcmpkg3j0005ld04hyzb98j2	2025-07-03 01:29:58.425
cmcmpwxj60003u56u1udsymn6	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcmpfs610001ky04eqcd5gd7	\N	2025-07-03 01:39:40.821
cmcmsfecu0003l204378n62rz	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc9475m0005jo0412zgpcvk	\N	2025-07-03 02:50:01.699
cmcmsfh5l0007l204is32ispk	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc9475m0005jo0412zgpcvk	\N	2025-07-03 02:50:05.326
cmcr2ucag0007lb04wayyds4l	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc95riu0009jo04u63lle1h	\N	2025-07-06 02:52:39.725
cmcr2ue5l000blb04m8xmqin2	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc952y00007jo04zp28emh0	\N	2025-07-06 02:52:42.137
cmcr2ugxp000flb04i8cqc273	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc930b30003jo04gzqq041b	\N	2025-07-06 02:52:45.745
cmcr2uifm000jlb04taadbsea	cmcc8kd3o0000l40482ybot2g	cmc9xc7h20000l404q4obhe6e	LIKE	t	cmcc92f9g0001jo04yol93884	\N	2025-07-06 02:52:47.686
cmcj81m3u0005ic04u1ymq9fj	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmccr5jv30005l7041unwkgc8	\N	2025-06-30 14:56:07.709
cmck15b0k0003l804thep6kdq	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmccr5jv30005l7041unwkgc8	\N	2025-07-01 04:30:48.819
cmclbg72y0003u5gpgifncr86	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcla0cja0001jy04fsqlkqed	\N	2025-07-02 02:06:59.249
cmcqm2ztg0003u52chszz4f0g	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcpbu5310001jj041l8xrrds	\N	2025-07-05 19:03:29.931
cmcqs9sos0003u5lntbcxtszi	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	t	cmcmn8cd00001l6048y616rbl	\N	2025-07-05 21:56:44.99
cmcxf68z40007u51vm1tgxihk	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	f	cmccpz5qy0001jl04fg1kfnoo	\N	2025-07-10 13:24:27.716
cmd10gv5r0003u5kih0ojiezh	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 01:43:53.491
cmd1doq4k0005u5lpb79xp0ep	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 07:53:55.221
cmd1dosns0009u5lpopt1vzhe	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcr2u8tl0003lb0476ifgoc5	\N	2025-07-13 07:53:58.508
cmd1dpcmk000du5lpff23xaa7	cmc2utm630000u56mr2eaja74	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmc9nouga0003l804vpvlx5bo	\N	2025-07-13 07:54:24.344
cmd1dsyjh000hu5lpxt2pe0ip	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 07:57:12.746
cmd1dxbm70003u5gail13dbni	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:00:36.303
cmd1dxhvr0007u5gai1fn8h51	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:00:44.409
cmd1dxjus000bu5gaj5z92eh1	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:00:47.003
cmd1dxqwb000fu5gacaceyzlo	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:00:56.057
cmd1ea6vt000ju5ga3z3ux8ey	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:10:36.176
cmd1efhk2000nu5gagavcoqn8	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-13 08:14:43.744
cmd27oi7k000pu5gapmnqfyi1	cmcajxll50000l70ayd9bbcmb	cmc2u6sc60004u5y6arw0h0ja	FOLLOW	f	\N	\N	2025-07-13 21:53:33.318
cmd5ds29k0001jx047fkahcbd	cmc2utm630000u56mr2eaja74	cmcc8kd3o0000l40482ybot2g	FOLLOW	f	\N	\N	2025-07-16 03:07:35.658
cmd5ds3lz0003jx04ypp2rsak	cmcqalrvk0000l404w5hm36sj	cmcc8kd3o0000l40482ybot2g	FOLLOW	f	\N	\N	2025-07-16 03:07:37.402
cmd5ds4iw0005jx041wqnvhmo	cmcajxll50000l70ayd9bbcmb	cmcc8kd3o0000l40482ybot2g	FOLLOW	f	\N	\N	2025-07-16 03:07:38.585
cmd6ogfzy0003u5fi5oh4hgol	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcc952y00007jo04zp28emh0	\N	2025-07-17 00:54:15.501
cmd7gs8qy0009u5firnon8h38	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-17 14:07:15.233
cmdc9c6l30003u5eyjjh3yyzy	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcved3cy0003jp042e0dwvwv	\N	2025-07-20 22:37:39.508
cmdc9n0nl0009u5eyjvx2wjrr	cmc9xc7h20000l404q4obhe6e	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcr2u8tl0003lb0476ifgoc5	\N	2025-07-20 22:46:05.037
cmdc9n56x000du5eys87apzzi	cmcc8kd3o0000l40482ybot2g	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmcc95riu0009jo04u63lle1h	\N	2025-07-20 22:46:10.918
cmdgay9b50005u55qc0p1mrpx	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	f	cmdg8pbam0005u57efozwhobh	\N	2025-07-23 18:33:53.783
cmdgaycl5000bu55q1kenj5ew	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	f	cmdceg7m90007u5ap3j3cd27o	\N	2025-07-23 18:33:58.033
cmdgayeew000fu55qoq9dbr6z	cmc2u6sc60004u5y6arw0h0ja	cmc2utm630000u56mr2eaja74	LIKE	f	cmdce4prf0003u5apnp6ihab0	\N	2025-07-23 18:34:00.391
cmdgeng9a0003u5lwldost7z8	cmc2u6sc60004u5y6arw0h0ja	cmdgbub1r000iu55quiraxb10	COMMENT	f	cmdg8pbam0005u57efozwhobh	cmdgeng6e0001u5lwwnt0blfj	2025-07-23 20:17:28.078
cmdgkxhjy0003u5mmvlyhxf08	cmdgbub1r000iu55quiraxb10	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmdgcuaud000su55quck2hq8e	\N	2025-07-23 23:13:13.962
cmdgmexnh0003l5049pif8syp	cmdgbub1r000iu55quiraxb10	cmc2u6sc60004u5y6arw0h0ja	LIKE	f	cmdgcuaud000su55quck2hq8e	\N	2025-07-23 23:54:47.63
\.


--
-- Data for Name: Pet; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Pet" (id, "userId", name, species, breed, age, bio, "imageUrl", "createdAt", "updatedAt", "loveCount", streak, "lastLogin", level, "loginStreak", prestige, xp, "evolutionImageUrl") FROM stdin;
ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1	user_2yw6G8gzGr2sDg3ZPdPv64670UT	Max	dog	Labrador Retriever	1	A true hero and explorer	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPxJUxFrRvO1LAWTRNn6aYehKqpdbIMwJCDgVf	2025-06-24 02:55:14.508	2025-07-13 06:56:45.569	12	0	\N	1	0	BRONZE	0	\N
7886d091-404b-44f3-bb92-516d0817b164	user_2xL1rizQzCtRlnBO6hQOuIcSDfl	Chip	dog	Chihuahua	7	chip	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPgkvt5omLk7qIbeXcTBldhwxzSnGQ2JKfZNyV	2025-06-19 03:54:09.369	2025-07-05 19:22:52.067	6	0	\N	1	0	BRONZE	0	\N
ffca819f-df1c-4e5b-b4e9-097ee50ae359	user_2xL1rizQzCtRlnBO6hQOuIcSDfl	Buck	dog	Other	11	Call of the Wild	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP3wDOFlLF7cvHKN9EmVhgxL8fCDJqaTRktsl5	2025-06-19 04:32:21.499	2025-07-05 20:18:13.063	5	0	\N	1	0	BRONZE	0	\N
3fb75041-17a8-4164-ab30-1edb9914f7cb	user_2z0faypQDWsviSQKgsS6KmRFkzV	Otis	dog	Other	4	Silly and goofy but the biggest baby you'll ver meet. Loves being carried, hugged and cuddled. Always looking for friends!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPjQYruCEef4iyhUVYODZaPmcn3J5d6xzlNpEK	2025-06-25 17:41:00.856	2025-07-13 07:24:46.081	0	0	\N	1	0	BRONZE	0	\N
47d8b619-dfc6-457f-ae43-b3efc6c92741	user_2xWO71IVlouIMXNm4Er5ps6ST6L	Doge	dog	Golden Retriever	1	doggo	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPxyTLi4RvO1LAWTRNn6aYehKqpdbIMwJCDgVf	2025-06-23 22:12:35.956	2025-07-14 00:21:25.546	13	0	\N	1	0	BRONZE	0	\N
84e0211b-96b8-4214-b6f0-c18f8e1806ce	user_2xL1rizQzCtRlnBO6hQOuIcSDfl	Buddy	dog	Golden Retriever	5	good boy	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPSO0FtwNW2xXvbOZDANmj1IUnagd5GYueKlBt	2025-06-19 04:33:58.955	2025-07-14 00:22:37.183	6	0	\N	1	0	BRONZE	0	\N
e41537e6-7bfb-428e-818d-595b2a57091d	user_2xL1rizQzCtRlnBO6hQOuIcSDfl	Rocco	dog	German Shepherd	20	Man's best friend	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPKxBaBwU8BYwLp0xj7sJVr2ZSuRGaCtekqAc8	2025-06-19 04:34:22.815	2025-07-23 17:30:57.455	14	1	\N	1	0	BRONZE	0	\N
d5e332c0-cd23-47db-8709-cb6caf0712fd	user_2xTYmNpkVPcEc1fGiLFyr7PCLtk	Collin	dog	Collie	13	Meet Collin the Collie!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPn9DTZLhx2bVWJvuCDfE9OBRrKdZk70m8wjnp	2025-07-23 19:25:48.231	2025-07-23 21:44:05.554	0	1	\N	1	0	BRONZE	0	\N
\.


--
-- Data for Name: PetNetShare; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PetNetShare" (id, "senderId", recipient, "sentAt") FROM stdin;
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Post" (id, "authorId", "petId", content, image, "createdAt", "updatedAt", "mediaType", "affiliateCode", "affiliateLink", category, condition, description, "isAffiliate", location, price, "priceType", title, type) FROM stdin;
cmc2unjpf0001u5q2sqmrptxs	cmc2u6sc60004u5y6arw0h0ja	7886d091-404b-44f3-bb92-516d0817b164		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPwGNf22598yn4d02Tm5RoGjUZi6CHasEIF3zg	2025-06-19 03:56:57.598	2025-06-19 03:56:57.598	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2unzmc0003u5q2s1faqchb	cmc2u6sc60004u5y6arw0h0ja	7886d091-404b-44f3-bb92-516d0817b164		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP2jXByHKuVlWMDkKJ1HZbPL96SztExR5df4ov	2025-06-19 03:57:18.229	2025-06-19 03:57:18.229	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w3deg0001le04ra6xamx5	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d	Hello world!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPXb6bCa0EKN6YZmvbBM2nuOePgG08UI4xLiTj	2025-06-19 04:37:15.544	2025-06-19 04:37:15.544	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w3pgt0003le04tr207j36	cmc2u6sc60004u5y6arw0h0ja	ffca819f-df1c-4e5b-b4e9-097ee50ae359	I love snow!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPg7Os9ImLk7qIbeXcTBldhwxzSnGQ2JKfZNyV	2025-06-19 04:37:31.181	2025-06-19 04:37:31.181	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w48ub0005le04ltumzug2	cmc2u6sc60004u5y6arw0h0ja	84e0211b-96b8-4214-b6f0-c18f8e1806ce	Me as a pup! #timeflies	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPwhuw22x598yn4d02Tm5RoGjUZi6CHasEIF3z	2025-06-19 04:37:56.291	2025-06-19 04:37:56.291	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w4sdk0007le049izk03vi	cmc2u6sc60004u5y6arw0h0ja	7886d091-404b-44f3-bb92-516d0817b164	Me and my wife	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPNw3wqvCeA92lYJnH1mqspWSgEGDbc4hCj5VM	2025-06-19 04:38:21.609	2025-06-19 04:38:21.609	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w798r0001l504dj0wqb61	cmc2u6sc60004u5y6arw0h0ja	84e0211b-96b8-4214-b6f0-c18f8e1806ce		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPpJXzf6juxTR0DWS59GzXgM2nHrJBdk3oiYwC	2025-06-19 04:40:16.779	2025-06-19 04:40:16.779	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w83210003l504yflkyl4a	cmc2u6sc60004u5y6arw0h0ja	84e0211b-96b8-4214-b6f0-c18f8e1806ce		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPAWQvYu3NCaRUIXouPE6QAjJv704DYeTdgFKm	2025-06-19 04:40:55.417	2025-06-19 04:40:55.417	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc2w8xce0005l504tf67ick7	cmc2u6sc60004u5y6arw0h0ja	ffca819f-df1c-4e5b-b4e9-097ee50ae359		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP5SjpOgngoLEJvZjNas9DWfl1bOqtxG8CXh6R	2025-06-19 04:41:34.67	2025-06-19 04:41:34.67	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc9nnnvk0001l804alzhvk58	cmc2utm630000u56mr2eaja74	\N	first video!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPDGbBDIcq8Ylsoi0jKPHhvGzTeXmIpEnWUZwr	2025-06-23 22:15:28.928	2025-06-23 22:15:28.928	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc9nouga0003l804vpvlx5bo	cmc2utm630000u56mr2eaja74	47d8b619-dfc6-457f-ae43-b3efc6c92741		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPlOlSefYwTe7RAJhmGpQXVj9ik4d5ornlSxY0	2025-06-23 22:16:24.107	2025-06-23 22:16:24.107	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc9nq54r0005l8040ad7w8mo	cmc2utm630000u56mr2eaja74	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPl4N3HowYwTe7RAJhmGpQXVj9ik4d5ornlSxY	2025-06-23 22:17:24.603	2025-06-23 22:17:24.603	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc9nqfsp0007l8044mou5y4f	cmc2utm630000u56mr2eaja74	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP5YAD7mngoLEJvZjNas9DWfl1bOqtxG8CXh6R	2025-06-23 22:17:38.426	2025-06-23 22:17:38.426	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmc9nrbmn0009l804z9ma9kow	cmc2utm630000u56mr2eaja74	47d8b619-dfc6-457f-ae43-b3efc6c92741		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPRlj8bR7B7HfzcuJT0Nso6dOeSkFix8UAIy42	2025-06-23 22:18:19.68	2025-06-23 22:18:19.68	video/mp4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcasjvds0005u5xeylg1oc2k	cmc2utm630000u56mr2eaja74	47d8b619-dfc6-457f-ae43-b3efc6c92741		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPythRD1R4N3Sut94GvriDnmV5FTqZE7KxdHXz	2025-06-24 17:20:16.287	2025-06-24 17:20:16.287	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcasnjtm0001ji047axvahev	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP1ihNSTx7vuNORAThkWMxSzcpJi6Cqy0DKEVd	2025-06-24 17:23:07.93	2025-06-24 17:23:07.93	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcc92f9g0001jo04yol93884	cmcc8kd3o0000l40482ybot2g	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPxENEhYRvO1LAWTRNn6aYehKqpdbIMwJCDgVf	2025-06-25 17:50:21.892	2025-06-25 17:50:21.892	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcc930b30003jo04gzqq041b	cmcc8kd3o0000l40482ybot2g	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPmrjIYWbnaquflUYdtyg3O58C290DPsQWjoMF	2025-06-25 17:50:49.167	2025-06-25 17:50:49.167	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcc9475m0005jo0412zgpcvk	cmcc8kd3o0000l40482ybot2g	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPphV6SBjuxTR0DWS59GzXgM2nHrJBdk3oiYwC	2025-06-25 17:51:44.698	2025-06-25 17:51:44.698	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcc952y00007jo04zp28emh0	cmcc8kd3o0000l40482ybot2g	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPClfZkcqWcVuiUsn7mTpZKjdSaDzOq28evwfF	2025-06-25 17:52:25.896	2025-06-25 17:52:25.896	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcc95riu0009jo04u63lle1h	cmcc8kd3o0000l40482ybot2g	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPG9tAIymCUCerXlLZQsD7kYI8jOfKxFuvBWig	2025-06-25 17:52:57.751	2025-06-25 17:52:57.751	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmccn7exu0001jx04rlmrywgt	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPeJ30MBUTNDzpldgJPEwWrRstXLbqjvFknfHZ	2025-06-26 00:26:09.378	2025-06-26 00:26:09.378	image/avif	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmccpz5qy0001jl04fg1kfnoo	cmc2u6sc60004u5y6arw0h0ja	84e0211b-96b8-4214-b6f0-c18f8e1806ce		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPoB8ZNGpzjJwuZ5fMKNLeaFIhDRWg0s8H9bU7	2025-06-26 01:43:43.066	2025-06-26 01:43:43.066	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmccr5jv30005l7041unwkgc8	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1	100 degree Wed	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPPWPG18TOgL2QoXT4NwY7mGuh8WnStKsaU0e3	2025-06-26 02:16:40.911	2025-06-26 02:16:40.911	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcij6myx0005u5n0wkw2d5rp	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPeG5EG6UTNDzpldgJPEwWrRstXLbqjvFknfHZ	2025-06-30 03:20:11.72	2025-06-30 03:20:11.72	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcjuygvg0001u5n7up3c2f2u	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPKCXUPc8BYwLp0xj7sJVr2ZSuRGaCtekqAc8N	2025-07-01 01:37:32.139	2025-07-01 02:34:40.649	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcla0cja0001jy04fsqlkqed	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPXf37nB0EKN6YZmvbBM2nuOePgG08UI4xLiTj	2025-07-02 01:26:40.247	2025-07-02 01:26:40.247	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmclchlov0001u56a2a9ovxql	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPIILQEFvZ7IpH12veyzbo8MsTkiSqKFENWxjP	2025-07-02 02:36:04.49	2025-07-02 02:36:04.49	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmclcicnx0003u56aexezi8fk	cmc2u6sc60004u5y6arw0h0ja	84e0211b-96b8-4214-b6f0-c18f8e1806ce		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP17joIwkx7vuNORAThkWMxSzcpJi6Cqy0DKEV	2025-07-02 02:36:39.453	2025-07-02 02:36:39.453	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcmn8cd00001l6048y616rbl	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPYoOnMDyr3QebkFB9jLvlUIpPDA5XCW6cMqKN	2025-07-03 00:24:34.452	2025-07-03 00:24:34.452	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcmpfs610001ky04eqcd5gd7	cmcc8kd3o0000l40482ybot2g	3fb75041-17a8-4164-ab30-1edb9914f7cb		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPJYaMb2zSzx2ReIviGc9HYrpmMuKoPjU0kw8Q	2025-07-03 01:26:20.762	2025-07-03 01:26:20.762	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcpbu5310001jj041l8xrrds	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPhLLR37VA9mcVtsbiDvNLJuYd0g1kO8aq2KEp	2025-07-04 21:28:54.59	2025-07-04 21:28:54.59	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcr2u8tl0003lb0476ifgoc5	cmc9xc7h20000l404q4obhe6e	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPITDxtkvZ7IpH12veyzbo8MsTkiSqKFENWxjP	2025-07-06 02:52:35.241	2025-07-06 02:52:35.241	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcr2wb7s000tlb04r06iwpwv	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPUnXWjLCwIKDTcXxktjC18sAaNPU9WpVegGdb	2025-07-06 02:54:11.656	2025-07-06 02:54:11.656	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcvecfje0001jp04cmfxqwy2	cmc9xc7h20000l404q4obhe6e	ae9d11d9-2e8d-4291-9b1a-837ae46d0ee1		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPLYZtkaXCmxPbpX8q6nKWuG07dfrglaUQ2Dsy	2025-07-09 03:25:44.235	2025-07-09 03:25:44.235	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmcved3cy0003jp042e0dwvwv	cmc9xc7h20000l404q4obhe6e	\N		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPJwMxtlzSzx2ReIviGc9HYrpmMuKoPjU0kw8Q	2025-07-09 03:26:15.106	2025-07-09 03:26:15.106	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmd15x6an0005u5kg8dg091iw	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPlBhXVgYwTe7RAJhmGpQXVj9ik4d5ornlSxY0	2025-07-13 04:16:32.543	2025-07-13 04:16:32.543	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmdcdt2nm0001u5apnke85bhv	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPU60yK3wIKDTcXxktjC18sAaNPU9WpVegGdb3	2025-07-21 00:42:46.066	2025-07-21 00:42:46.066	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmdce4prf0003u5apnp6ihab0	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d	Climbed a mountain today!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxP7sv2NgrhcGSoy9wu0ZClfAeOgnFIBbmjUvzJ	2025-07-21 00:51:49.226	2025-07-21 00:51:49.226	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmdceg7m90007u5ap3j3cd27o	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d	Hiked a mountain today!	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPNdJOtDeA92lYJnH1mqspWSgEGDbc4hCj5VMx	2025-07-21 01:00:45.583	2025-07-21 01:00:45.583	image/webp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmdg8pbam0005u57efozwhobh	cmc2u6sc60004u5y6arw0h0ja	e41537e6-7bfb-428e-818d-595b2a57091d		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPfUwvNvSUFXfsC8KGz5Nt2uwdqjZera4PpvhB	2025-07-23 17:30:57.261	2025-07-23 17:30:57.261	image/png	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
cmdgcuaud000su55quck2hq8e	cmdgbub1r000iu55quiraxb10	d5e332c0-cd23-47db-8709-cb6caf0712fd		https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPhLTCfjQA9mcVtsbiDvNLJuYd0g1kO8aq2KEp	2025-07-23 19:26:48.418	2025-07-23 20:19:47.203	image/jpeg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	REGULAR
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, email, username, "clerkId", name, bio, image, location, website, "createdAt", "updatedAt", "isAdmin", "lastLocationUpdate", latitude, "locationSharingEnabled", longitude, "totalXp", "useEvolutionImages") FROM stdin;
cmc9xc7h20000l404q4obhe6e	mitchng77@gmail.com	mitchng77	user_2yw6G8gzGr2sDg3ZPdPv64670UT	Mitchell Ng	\N	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18yeXc2RzdFZ3czYm1nenlwc21wajUwRkwxcmMifQ	\N	\N	2025-06-24 02:46:30.615	2025-07-24 01:38:06.857	f	\N	\N	f	\N	10	f
cmcajxll50000l70ayd9bbcmb	bcblmtd1@gmail.com	bcblmtd1	user_2y3lYyXPgWSa3S4ahxGraOwAPjq	 	\N	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yeEt3Nk4wanE1Nk9FeThTN3drTHpYOWRnd0QiLCJyaWQiOiJ1c2VyXzJ5M2xZeVhQZ1dTYTNTNGFoeEdyYU93QVBqcSJ9	\N	\N	2025-06-24 13:19:00.233	2025-06-24 13:19:00.233	f	\N	\N	f	\N	0	f
cmc2u6sc60004u5y6arw0h0ja	bb7906@princeton.edu	bb7906	user_2xL1rizQzCtRlnBO6hQOuIcSDfl	Brian Boler		https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18yeEwxcnBLM1l4eEZUc2owSExET3hWTVNlVXUifQ			2025-06-19 03:43:55.639	2025-07-24 01:49:00.31	f	\N	40.74788630604635	f	-74.42489765742148	85	t
cmdgbub1r000iu55quiraxb10	dougmcfargo@gmail.com	dougmcfargo	user_2xTYmNpkVPcEc1fGiLFyr7PCLtk	 	\N	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yeEt3Nk4wanE1Nk9FeThTN3drTHpYOWRnd0QiLCJyaWQiOiJ1c2VyXzJ4VFltTnBrVlBjRWMxZkdpTEZ5cjdQQ0x0ayJ9	\N	\N	2025-07-23 18:58:49.071	2025-07-23 19:01:51.021	f	\N	\N	f	\N	30	f
cmcqalrvk0000l404w5hm36sj	brian.boler01@gmail.com	brian.boler01	user_2xViNIrx1O2oiCFoejNgoPoWvfj	Brian Boler	\N	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18yeFZpTkN6Y0dLaERJclFncGtBUktEbTBhWmgifQ	\N	\N	2025-07-05 13:42:10.784	2025-07-05 13:42:10.784	f	\N	\N	f	\N	0	f
cmc2utm630000u56mr2eaja74	brian.boler340@gmail.com	brian.boler340	user_2xWO71IVlouIMXNm4Er5ps6ST6L	 Brian		https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yeEt3Nk4wanE1Nk9FeThTN3drTHpYOWRnd0QiLCJyaWQiOiJ1c2VyXzJ4V083MUlWbG91SU1YTm00RXI1cHM2U1Q2TCJ9	Princeton, NJ		2025-06-19 04:01:40.731	2025-07-23 22:27:39.168	f	2025-06-25 23:32:43.009	40.74793671585905	t	-74.424899655328	45	f
cmcc8kd3o0000l40482ybot2g	luisa.marfori@gmail.com	luisa.marfori	user_2z0faypQDWsviSQKgsS6KmRFkzV	Gabriela Marfori	Side kick to Otis 	https://zjg8rm558i.ufs.sh/f/LFcpjUQXCmxPaX8CmTBNcoAOen8IwmyQqrFTZl6s4gPkLYxa	Victoria BC 		2025-06-25 17:36:19.285	2025-07-24 01:31:13.837	f	\N	\N	f	\N	10	f
\.


--
-- Data for Name: UserChallenge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UserChallenge" (id, "userId", "challengeName", type, progress, goal, completed, "lastUpdated", "seasonId") FROM stdin;
cmdgaxwcb0001u55qinxrrkp8	cmc2utm630000u56mr2eaja74	daily_login	DAILY	1	1	t	2025-07-23 22:27:45.209	\N
cmdce4q400005u5apifk4oo7y	cmc2u6sc60004u5y6arw0h0ja	daily_post_photo	DAILY	1	1	t	2025-07-23 17:30:57.655	\N
cmdga6i9c0007u57exufv3keq	cmc2u6sc60004u5y6arw0h0ja	daily_expand_petnet	DAILY	1	1	t	2025-07-23 18:12:19.055	\N
cmdgaya760007u55q8t352jg6	cmc2utm630000u56mr2eaja74	daily_like_3_posts	DAILY	3	3	t	2025-07-23 18:34:00.867	\N
cmdgaz0xf000hu55qy45s53gy	cmc2utm630000u56mr2eaja74	daily_expand_petnet	DAILY	1	1	t	2025-07-23 18:34:29.619	\N
cmdc9c7430005u5eyu76bo5in	cmc2u6sc60004u5y6arw0h0ja	daily_like_3_posts	DAILY	3	3	t	2025-07-24 00:49:32.238	\N
cmdgby7al000mu55qc3ga01c7	cmdgbub1r000iu55quiraxb10	daily_expand_petnet	DAILY	1	1	t	2025-07-23 19:01:50.827	\N
cmdgpuy9f0001k0042uxcq0xy	cmcc8kd3o0000l40482ybot2g	daily_login	DAILY	1	1	t	2025-07-24 01:31:13.779	\N
cmdgcub6s000uu55qth9fmdnt	cmdgbub1r000iu55quiraxb10	daily_post_photo	DAILY	1	1	t	2025-07-23 19:26:48.868	\N
cmdgq3sy50001lb04gmni1pei	cmc9xc7h20000l404q4obhe6e	daily_login	DAILY	1	1	t	2025-07-24 01:38:06.797	\N
cmdgm20k20003u5k4xlq7dhxv	cmc2u6sc60004u5y6arw0h0ja	weekly_comment_20_posts	WEEKLY	4	20	f	2025-07-24 01:42:50.892	\N
cmd7grvtj0005u5fidssi4qiv	cmc2u6sc60004u5y6arw0h0ja	daily_login	DAILY	1	1	t	2025-07-24 01:58:29.002	\N
cmdgejiwr000yu55qbw2vtx6a	cmdgbub1r000iu55quiraxb10	daily_like_3_posts	DAILY	2	3	f	2025-07-23 20:18:03.106	\N
cmdgbub7x000ku55q9efngp5a	cmdgbub1r000iu55quiraxb10	daily_login	DAILY	1	1	t	2025-07-23 21:45:44.615	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b27f4060-a42d-4b56-89be-5ebc63adf30c	e36587fc4bb6ea0d2d81a9a684c08a6e4bcbbc02a3da933cdadb0647048c6e51	2025-06-19 03:37:27.252549+00	20250524193106_init	\N	\N	2025-06-19 03:37:26.93911+00	1
ccd88746-cda2-4b4b-a311-50cffbcdf60a	c5b49c600bee62f256d8d37c96c0b203e95e2c50693beaea5de5a7c7b2fc7665	2025-06-19 03:37:27.603818+00	20250524195422_add_media_type_to_post	\N	\N	2025-06-19 03:37:27.354885+00	1
a73db17b-3273-407e-bfa3-d197a5dc2091	c6691a3768aa51a78e4b31ba64d1519addc5201057bf0815cca44b06a9c43fae	2025-06-19 03:37:27.934748+00	20250524200823_make_pet_fields_optional	\N	\N	2025-06-19 03:37:27.692664+00	1
124e356f-ce2f-42b0-987e-8041221a7a11	9d7b9ec02fd66aee0ab55e395c037b11f3d24b184b02d5bf11b39cc98d7a4070	2025-06-19 03:37:28.288804+00	20250526202016_simplify_marketplace	\N	\N	2025-06-19 03:37:28.041291+00	1
cc356811-9fe9-43f8-8144-531073afdb99	a7c12b40b86eaf6761e26fab266445e8a1cb528b333e96a175feaee36f1cfa38	2025-06-19 03:37:28.648434+00	20250527031910_add_direct_messages	\N	\N	2025-06-19 03:37:28.386516+00	1
523ac57d-2381-4692-b231-205dedce4a21	4aa91d54a2c97e317a333d84f8e3f9e95aec56cd44e293aca30e8014c05781b7	2025-06-19 03:37:29.009627+00	20250531025215_add_bark_forum	\N	\N	2025-06-19 03:37:28.742956+00	1
c20f334e-f609-4200-8655-85ab25ba3257	9cec62bc6127f8239f0742f3a05399c27879f912ef6c630c699b00434b5df3a6	2025-06-19 03:37:29.343462+00	20250601003326_add_bark_votes	\N	\N	2025-06-19 03:37:29.100692+00	1
7870a0bd-b46f-4912-b7c5-150abce2ea69	c8daefe484ce98ff814f5779f59b18b1b43a8a295009aa80957cf86320cf22dd	2025-06-19 03:37:29.695474+00	20250601005114_add_bark_comments	\N	\N	2025-06-19 03:37:29.444017+00	1
a8ef2c9a-7979-4cf6-9288-76de3907adb5	49b896b4850fc24223560bbf41e6ae82fd1521ae95b19f512d38b0abef43edb3	2025-06-19 03:37:30.025593+00	20250601021815_add_bark_comment_votes	\N	\N	2025-06-19 03:37:29.785886+00	1
385d7393-bfa6-41dc-9567-6a889f4894ef	623dd5e8c1d0e8ea1bf390f865808ad54d101d1aef4fa26d025a28540c782468	2025-06-19 03:37:30.361117+00	20250601192707_community_creator_optional	\N	\N	2025-06-19 03:37:30.126984+00	1
b44c1f24-af09-4b18-a32b-511f6bf5ec32	3e4e6ed336cc6c59e03e4fd5aa011971284db4512debe2e54ac1f0b1f71e29d1	2025-06-19 03:37:51.26786+00	20250619033747_add_pet_streak	\N	\N	2025-06-19 03:37:50.905032+00	1
\.


--
-- Name: BarkCommentVote BarkCommentVote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkCommentVote"
    ADD CONSTRAINT "BarkCommentVote_pkey" PRIMARY KEY (id);


--
-- Name: BarkComment BarkComment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkComment"
    ADD CONSTRAINT "BarkComment_pkey" PRIMARY KEY (id);


--
-- Name: BarkVote BarkVote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkVote"
    ADD CONSTRAINT "BarkVote_pkey" PRIMARY KEY (id);


--
-- Name: Bark Bark_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Bark"
    ADD CONSTRAINT "Bark_pkey" PRIMARY KEY (id);


--
-- Name: ChallengeConfig ChallengeConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ChallengeConfig"
    ADD CONSTRAINT "ChallengeConfig_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Community Community_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Community"
    ADD CONSTRAINT "Community_pkey" PRIMARY KEY (id);


--
-- Name: ConversationParticipant ConversationParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Follows Follows_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_pkey" PRIMARY KEY ("followerId", "followingId");


--
-- Name: Like Like_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PetNetShare PetNetShare_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PetNetShare"
    ADD CONSTRAINT "PetNetShare_pkey" PRIMARY KEY (id);


--
-- Name: Pet Pet_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Pet"
    ADD CONSTRAINT "Pet_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: UserChallenge UserChallenge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserChallenge"
    ADD CONSTRAINT "UserChallenge_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: BarkCommentVote_userId_commentId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "BarkCommentVote_userId_commentId_key" ON public."BarkCommentVote" USING btree ("userId", "commentId");


--
-- Name: BarkComment_barkId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "BarkComment_barkId_idx" ON public."BarkComment" USING btree ("barkId");


--
-- Name: BarkComment_parentId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "BarkComment_parentId_idx" ON public."BarkComment" USING btree ("parentId");


--
-- Name: BarkVote_userId_barkId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "BarkVote_userId_barkId_key" ON public."BarkVote" USING btree ("userId", "barkId");


--
-- Name: Comment_authorId_postId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Comment_authorId_postId_idx" ON public."Comment" USING btree ("authorId", "postId");


--
-- Name: Community_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Community_name_key" ON public."Community" USING btree (name);


--
-- Name: ConversationParticipant_userId_conversationId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ConversationParticipant_userId_conversationId_key" ON public."ConversationParticipant" USING btree ("userId", "conversationId");


--
-- Name: Follows_followerId_followingId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Follows_followerId_followingId_idx" ON public."Follows" USING btree ("followerId", "followingId");


--
-- Name: Like_userId_postId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Like_userId_postId_idx" ON public."Like" USING btree ("userId", "postId");


--
-- Name: Like_userId_postId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Like_userId_postId_key" ON public."Like" USING btree ("userId", "postId");


--
-- Name: Notification_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Notification_userId_createdAt_idx" ON public."Notification" USING btree ("userId", "createdAt");


--
-- Name: PetNetShare_senderId_recipient_sentAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PetNetShare_senderId_recipient_sentAt_idx" ON public."PetNetShare" USING btree ("senderId", recipient, "sentAt");


--
-- Name: PetNetShare_senderId_recipient_sentAt_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PetNetShare_senderId_recipient_sentAt_key" ON public."PetNetShare" USING btree ("senderId", recipient, "sentAt");


--
-- Name: Pet_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Pet_userId_idx" ON public."Pet" USING btree ("userId");


--
-- Name: UserChallenge_userId_challengeName_type_seasonId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "UserChallenge_userId_challengeName_type_seasonId_idx" ON public."UserChallenge" USING btree ("userId", "challengeName", type, "seasonId");


--
-- Name: User_clerkId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_clerkId_key" ON public."User" USING btree ("clerkId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_latitude_longitude_idx" ON public."User" USING btree (latitude, longitude);


--
-- Name: User_locationSharingEnabled_lastLocationUpdate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "User_locationSharingEnabled_lastLocationUpdate_idx" ON public."User" USING btree ("locationSharingEnabled", "lastLocationUpdate");


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: BarkCommentVote BarkCommentVote_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkCommentVote"
    ADD CONSTRAINT "BarkCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."BarkComment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BarkCommentVote BarkCommentVote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkCommentVote"
    ADD CONSTRAINT "BarkCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BarkComment BarkComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkComment"
    ADD CONSTRAINT "BarkComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BarkComment BarkComment_barkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkComment"
    ADD CONSTRAINT "BarkComment_barkId_fkey" FOREIGN KEY ("barkId") REFERENCES public."Bark"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BarkComment BarkComment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkComment"
    ADD CONSTRAINT "BarkComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."BarkComment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BarkVote BarkVote_barkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkVote"
    ADD CONSTRAINT "BarkVote_barkId_fkey" FOREIGN KEY ("barkId") REFERENCES public."Bark"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BarkVote BarkVote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BarkVote"
    ADD CONSTRAINT "BarkVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bark Bark_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Bark"
    ADD CONSTRAINT "Bark_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bark Bark_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Bark"
    ADD CONSTRAINT "Bark_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public."Community"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Community Community_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Community"
    ADD CONSTRAINT "Community_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ConversationParticipant ConversationParticipant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationParticipant ConversationParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follows Follows_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follows Follows_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PetNetShare PetNetShare_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PetNetShare"
    ADD CONSTRAINT "PetNetShare_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_petId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_petId_fkey" FOREIGN KEY ("petId") REFERENCES public."Pet"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserChallenge UserChallenge_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UserChallenge"
    ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

