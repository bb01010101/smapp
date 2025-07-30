"use client";

import { useEffect, useState, useRef } from "react";
import { HeartIcon, XIcon, Bone, ZapIcon, ChevronLeft, ChevronRight, TrophyIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { isUserVerifiedShelter, isUserVerified } from "@/lib/utils";
import { SecureImage } from "@/lib/useSecureImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BlueCheckIcon from "@/components/BlueCheckIcon";
import RedCheckIcon from "@/components/RedCheckIcon";
import { PetCardSkeleton } from "@/components/PetCardSkeleton";

// Types for new tabs
type ChallengePost = {
  id: string;
  content: string;
  image: string;
  mediaType: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  pet?: {
    id: string;
    name: string;
    species: string;
    breed: string;
    imageUrl: string;
    loveCount: number;
  };
  upvotes: number;
  downvotes: number;
  netVotes: number;
  userVote: number | null;
  challengePostId: string | null;
};

type LeaderboardEntry = {
  rank: number;
  user: {
    id: string;
    username: string;
    name: string;
    image: string;
  };
  pet?: {
    id: string;
    name: string;
    species: string;
    breed: string;
    imageUrl: string;
    loveCount: number;
  };
  boneCount: number;
  totalUpvotes?: number;
  netVotes?: number;
  postCount?: number;
};

// DoubleHeartIcon SVG
function DoubleHeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" {...props}>
      <path d="M20 36s-7.5-6.5-12-11C3.5 22 2 19.5 2 16.5 2 12.4 5.4 9 9.5 9c2.2 0 4.2 1 5.5 2.6C16.3 10 18.3 9 20.5 9 24.6 9 28 12.4 28 16.5c0 3-1.5 5.5-6 8.5-4.5-3-6-5.5-6-8.5C16 12.4 19.4 9 23.5 9c4.1 0 7.5 3.4 7.5 7.5 0 3-1.5 5.5-6 8.5-4.5 4.5-12 11-12 11z" fill="#EC4899" stroke="#EC4899" strokeWidth="2"/>
      <path d="M28 36s-4.5-3.5-7-6c-2.5-2.5-3.5-4.5-3.5-7 0-3.6 2.9-6.5 6.5-6.5S30.5 19.4 30.5 23c0 2.5-1 4.5-3.5 7-2.5 2.5-7 6-7 6z" fill="#F472B6" stroke="#F472B6" strokeWidth="2"/>
    </svg>
  );
}

function PetCard({ pet, loveCount, onImageError }: any) {
  const [images, setImages] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    async function fetchPetPosts() {
      if (!pet.pet?.id) return setImages([pet.image || pet.pet?.imageUrl || "/default-pet.png"]);
      try {
        const res = await fetch(`/api/pets/${pet.pet.id}`);
        if (!res.ok) throw new Error('Failed to fetch pet posts');
        const data = await res.json();
        // Get up to 6 images from the pet's posts, most recent first
        const imgs = (data.posts || [])
          .filter((p: any) => p.image)
          .slice(0, 6)
          .map((p: any) => p.image);
        setImages(imgs.length ? imgs : [pet.image || pet.pet?.imageUrl || "/default-pet.png"]);
        setActiveIdx(0);
      } catch {
        setImages([pet.image || pet.pet?.imageUrl || "/default-pet.png"]);
        setActiveIdx(0);
      }
    }
    fetchPetPosts();
  }, [pet.pet?.id, pet.image, pet.pet?.imageUrl]);

  const goLeft = () => setActiveIdx((idx) => (idx === 0 ? images.length - 1 : idx - 1));
  const goRight = () => setActiveIdx((idx) => (idx === images.length - 1 ? 0 : idx + 1));

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden bg-white">
      {/* Image carousel */}
      <div className="relative w-full h-full min-h-[60vh] max-h-[80vh] flex items-center justify-center bg-black">
        {/* Top bar for image progress */}
        {images.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 z-20 w-[90%] max-w-xs">
            {images.map((_, i) => (
              <span
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-200 ${i === activeIdx ? 'bg-white' : 'bg-white/30'}`}
                style={{ marginLeft: i === 0 ? 0 : 2, marginRight: i === images.length - 1 ? 0 : 2 }}
              ></span>
            ))}
          </div>
        )}
        {images.length > 1 && (
          <button className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 rounded-full p-1" onClick={goLeft} aria-label="Previous photo">
            <ChevronLeft className="w-7 h-7 text-white" />
          </button>
        )}
        <SecureImage
          src={images[activeIdx]}
          alt={pet?.pet?.name || 'Dog'}
          className="object-cover w-full h-full bg-black"
          onError={onImageError}
        />
        {images.length > 1 && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 rounded-full p-1" onClick={goRight} aria-label="Next photo">
            <ChevronRight className="w-7 h-7 text-white" />
          </button>
        )}
      </div>
      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-2xl font-bold drop-shadow-lg">{pet?.pet?.name || 'Dog'}</span>
          {pet?.pet?.age && <span className="text-white text-lg">• {pet.pet.age}</span>}
        </div>
        {pet?.pet?.bio && <div className="text-white text-base mb-1 line-clamp-2 opacity-90">{pet.pet.bio}</div>}
        {pet?.pet?.breed && <span className="text-white text-sm opacity-80 mr-2">{pet.pet.breed}</span>}
        {pet?.pet?.species && <span className="text-white text-sm opacity-80">{pet.pet.species}</span>}
        {pet?.pet?.location && <span className="text-white text-sm opacity-80 ml-2">📍 {pet.pet.location}</span>}
        <div className="text-white text-sm mt-2 opacity-80">Owner: {pet?.author?.name || pet?.author?.username}</div>
        <div className="flex items-center gap-2 mt-2">
          <Bone className="w-5 h-5 text-blue-400" />
          <span className="text-blue-200 font-semibold">{loveCount || 0}</span>
        </div>
      </div>
    </div>
  );
}

// Challenge Post Card Component
function ChallengePostCard({ post, onVote }: { post: ChallengePost; onVote: (postId: string, vote: number) => void }) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: number) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      await onVote(post.id, vote);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.image} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{post.pet?.name || post.author.name}</h3>
            <p className="text-sm text-gray-500">@{post.author.username}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {post.netVotes > 0 ? `+${post.netVotes}` : post.netVotes}
          </Badge>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-gray-800">{post.content}</p>
          </div>
        )}

        {/* Media */}
        {post.image && (
          <div className="relative">
            <SecureImage
              src={post.image}
              alt="Challenge post"
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex items-center justify-between border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant={post.userVote === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote(post.userVote === 1 ? 0 : 1)}
              disabled={isVoting}
              className="flex items-center space-x-1"
            >
              <ArrowUpIcon className="w-4 h-4" />
              <span>{post.upvotes}</span>
            </Button>
            <Button
              variant={post.userVote === -1 ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleVote(post.userVote === -1 ? 0 : -1)}
              disabled={isVoting}
              className="flex items-center space-x-1"
            >
              <ArrowDownIcon className="w-4 h-4" />
              <span>{post.downvotes}</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Leaderboard Card Component
function LeaderboardCard({ entry, type }: { entry: LeaderboardEntry; type: 'celebs' | 'challengers' }) {
  const router = useRouter();
  


  const handleClick = () => {
    if (entry.pet?.id) {
      router.push(`/pet/${entry.pet.id}`);
    } else if (entry.user?.username) {
      router.push(`/profile/${entry.user.username}`);
    }
  };

  return (
    <div 
      className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
          entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
          entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
          'bg-gray-100 text-gray-600'
        }`}>
          {entry.rank}
        </div>
      </div>
      
      {/* Pet Profile Picture */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {entry.pet?.imageUrl ? (
          <SecureImage
            src={entry.pet.imageUrl}
            alt={entry.pet.name || 'Pet'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold text-gray-500">
            {entry.pet?.name?.[0] || 'P'}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Pet Name */}
        <h3 className="font-semibold truncate">
          {entry.pet?.name || entry.user?.name}
        </h3>
        {/* Owner Name with Verification Badges */}
        <div className="flex items-center space-x-1">
          <p className="text-sm text-gray-500 truncate">
            {entry.user?.name || entry.user?.username}
          </p>
          {entry.user?.username && isUserVerified(entry.user.username) && (
            <BlueCheckIcon className="w-4 h-4 flex-shrink-0" />
          )}
          {entry.user?.username && isUserVerifiedShelter(entry.user.username) && (
            <RedCheckIcon className="w-4 h-4 flex-shrink-0" />
          )}
        </div>
        {type === 'challengers' && entry.postCount && (
          <p className="text-xs text-gray-400">
            {entry.postCount} post{entry.postCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-end">
        <div className="flex items-center space-x-1 text-sm font-semibold">
          <Bone className="w-4 h-4 text-amber-500" />
          <span>{entry.boneCount}</span>
        </div>
        {type === 'challengers' && entry.netVotes !== undefined && (
          <div className="text-xs text-gray-500">
            {entry.netVotes > 0 ? `+${entry.netVotes}` : entry.netVotes} votes
          </div>
        )}
      </div>
    </div>
  );
}

export default function SwipeNSavePage() {
  const { user } = useUser();
  const router = useRouter();
  const [petCards, setPetCards] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]); // Store all fetched pets for recycling
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showBoneAnimation, setShowBoneAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [showHeartAnimation, setShowHeartAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [showXAnimation, setShowXAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [petCardSwipe, setPetCardSwipe] = useState<{dir: 'left' | 'right' | null, idx: number | null}>({dir: null, idx: null});
  const [loveCounts, setLoveCounts] = useState<{[petIdx: number]: number}>({});
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]); // mutual followers
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('Save this pet!');
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'pet-celebs' | 'pet-shelters' | 'challenges' | 'leaderboard'>('pet-celebs');
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [xedPets, setXedPets] = useState<Set<string>>(new Set()); // Track X'd pets by pet ID

  // New state for Challenges and Leaderboard tabs
  const [challengePosts, setChallengePosts] = useState<ChallengePost[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [petCelebs, setPetCelebs] = useState<LeaderboardEntry[]>([]);
  const [challengers, setChallengers] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [consecutiveFetchAttempts, setConsecutiveFetchAttempts] = useState(0);

  // Fetch pets (original logic)
  async function fetchPets() {
    setLoading(true);
    try {
      const petRes = await fetch('/api/pets/random-posts');
      const petData = await petRes.json();
      const allPetsData = petData.posts || [];
      
      console.log('All fetched pets:', allPetsData.map((pet: any) => ({
        petName: pet.pet?.name,
        owner: pet.author?.username,
        isShelter: isUserVerifiedShelter(pet.author?.username || '')
      })));
      
      // Filter pets based on active tab
      const filtered = allPetsData.filter((pet: any) => {
        const isShelter = isUserVerifiedShelter(pet.author?.username || '');
        return activeTab === 'pet-shelters' ? isShelter : !isShelter;
      });
      
      console.log(`${activeTab} filtered pets:`, filtered.map((pet: any) => ({
        petName: pet.pet?.name,
        owner: pet.author?.username
      })));
      
      // Remove X'd pets from the filtered list
      const availablePets = filtered.filter((pet: any) => {
        const petId = pet.pet?.id || pet.id;
        return !xedPets.has(petId);
      });
      
      setAllPets(filtered);
      setPetCards(availablePets);
      setFilteredPets(availablePets);
      
      // Reset fetch attempts if we successfully got pets
      if (availablePets.length > 0) {
        setConsecutiveFetchAttempts(0);
      } else {
        setConsecutiveFetchAttempts(prev => prev + 1);
      }
      
      const petLoveCounts: {[petIdx: number]: number} = {};
      availablePets.forEach((post: any, idx: number) => {
        petLoveCounts[idx] = post.pet?.loveCount || 0;
      });
      setLoveCounts(petLoveCounts);
      setCurrentIdx(0);
    } catch (err) {
      setPetCards([]);
      setFilteredPets([]);
      setAllPets([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch challenge posts
  async function fetchChallengePosts() {
    setChallengesLoading(true);
    try {
      const response = await fetch('/api/weekly-challenges/posts');
      const data = await response.json();
      
      if (response.ok) {
        setChallengePosts(data.posts || []);
        setCurrentChallenge(data.challenge);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching challenge posts:', error);
      toast.error('Failed to load challenge posts');
    } finally {
      setChallengesLoading(false);
    }
  }

  // Fetch leaderboard data
  async function fetchLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const response = await fetch('/api/weekly-challenges/leaderboard');
      const data = await response.json();
      

      
      if (response.ok) {
        setPetCelebs(data.petCelebs || []);
        setChallengers(data.challengers || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  }

  // Handle voting on challenge posts
  async function handleChallengePostVote(postId: string, vote: number) {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const response = await fetch('/api/weekly-challenges/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, vote })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the local state
        setChallengePosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                upvotes: data.upvotes,
                downvotes: data.downvotes,
                netVotes: data.netVotes,
                userVote: data.userVote
              }
            : post
        ));
        
        toast.success('Vote recorded!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      toast.error('Failed to record vote');
    }
  }

  useEffect(() => { 
    if (activeTab === 'pet-celebs' || activeTab === 'pet-shelters') {
      setXedPets(new Set()); // Reset X'd pets when switching tabs
      setConsecutiveFetchAttempts(0); // Reset fetch attempts
      fetchPets(); 
    } else if (activeTab === 'challenges') {
      fetchChallengePosts();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // Original swipe logic
  const handleSwipeLeft = (petIdx: number) => {
    const currentPet = petCards[petIdx];
    if (currentPet) {
      // Add pet to X'd set
      const petId = currentPet.pet?.id || currentPet.id;
      setXedPets(prev => new Set([...Array.from(prev), petId]));
    }
    
    setShowXAnimation({petIdx, show: true});
    setPetCardSwipe({dir: 'left', idx: petIdx});
    setTimeout(() => {
      setPetCardSwipe({dir: null, idx: null});
      setShowXAnimation({petIdx: -1, show: false});
      setCurrentIdx((prev) => prev + 1);
    }, 500);
  };

  const handleSwipeRight = async (pet: any) => {
    setShowBoneAnimation({petIdx: pet._petIdx, show: true});
    setPetCardSwipe({dir: 'right', idx: pet._petIdx});
    setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 0) + 1}));
    try {
      const petId = pet.pet?.id;
      if (!petId) throw new Error('Pet ID not found');
      const response = await fetch(`/api/pets/${petId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to like pet');
      const data = await response.json();
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: data.pet.loveCount}));
      toast.success('Pet loved! 💙');
    } catch (error) {
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: Math.max(0, (prev[pet._petIdx] || 1) - 1)}));
      toast.error('Failed to like pet');
    } finally {
      setTimeout(() => {
        setPetCardSwipe({dir: null, idx: null});
        setShowBoneAnimation({petIdx: -1, show: false});
        setCurrentIdx((prev) => prev + 1);
      }, 600);
    }
  };

  const handleSuperLove = async (pet: any) => {
    setShowHeartAnimation({petIdx: pet._petIdx, show: true});
    setPetCardSwipe({dir: 'right', idx: pet._petIdx});
    setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 0) + 1}));
    try {
      const petId = pet.pet?.id;
      if (!petId) throw new Error('Pet ID not found');
      const response = await fetch(`/api/pets/${petId}/super-like`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to super like pet');
      const data = await response.json();
      setTimeout(() => {
        setPetCardSwipe({dir: null, idx: null});
        setShowHeartAnimation({petIdx: -1, show: false});
        if (data.petOwner?.username) router.push(`/profile/${data.petOwner.username}`);
        else router.push('/messages');
      }, 600);
      toast.success('Super like! Opening DMs...');
    } catch (error) {
      setPetCardSwipe({dir: null, idx: null});
      setShowHeartAnimation({petIdx: -1, show: false});
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 1) - 1}));
      toast.error('Failed to super like pet');
    }
  };

  const handlePetImageError = () => {
    setCurrentIdx((prev) => prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) handleSwipeLeft(currentIdx);
      else if (dx > 0) handleSwipeRight(petCards[currentIdx]);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Fetch mutual friends (users you follow and who follow you back)
  const openShareModal = async () => {
    setLoadingFriends(true);
    setShowShareModal(true);
    try {
      const res = await fetch('/api/users/mutual-friends');
      if (!res.ok) throw new Error('Failed to fetch friends');
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (e) {
      setFriends([]);
      toast.error('Could not load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  // Share post with friend via DM
  const handleShare = async () => {
    if (!selectedFriend) return;
    const pet = petCards[currentIdx];
    if (!pet || !pet.id) {
      toast.error('Pet ID missing, cannot share.');
      return;
    }
    setSharing(true);
    try {
      // Create or get conversation (send { userId })
      const res = await fetch(`/api/messages/get-or-create-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedFriend })
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      const convo = await res.json();
      if (!convo.conversationId) throw new Error('No conversationId returned');
      // Compose pet profile link as markdown
      const petProfileUrl = `${window.location.origin}/pet/${pet.pet?.id || pet.id}`;
      const petName = pet.pet?.name || pet.name || 'Pet';
      const markdownLink = `[${petName}](${petProfileUrl})`;
      // Send first message (user's message)
      const messageRes1 = await fetch(`/api/messages/${convo.conversationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: shareMessage })
      });
      if (!messageRes1.ok) {
        const err = await messageRes1.json();
        throw new Error(err.error || 'Failed to send message');
      }
      // Send second message (pet profile link)
      const messageRes2 = await fetch(`/api/messages/${convo.conversationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: markdownLink })
      });
      if (!messageRes2.ok) {
        const err = await messageRes2.json();
        throw new Error(err.error || 'Failed to send pet link');
      }
      toast.success('Shared with your friend!');
      setShowShareModal(false);
      setSelectedFriend(null);
      setShareMessage('Save this pet!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to share.');
    } finally {
      setSharing(false);
    }
  };

  // When swiping past last pet, recycle available pets
  useEffect(() => {
    if (petCards.length > 0 && currentIdx >= petCards.length && !fetchingMore) {
      setFetchingMore(true);
      setTimeout(() => {
        // Recycle pets that haven't been X'd
        const availablePets = allPets.filter((pet: any) => {
          const petId = pet.pet?.id || pet.id;
          return !xedPets.has(petId);
        });
        
        if (availablePets.length > 0) {
          setPetCards(availablePets);
          setFilteredPets(availablePets);
          setCurrentIdx(0);
          
          const petLoveCounts: {[petIdx: number]: number} = {};
          availablePets.forEach((post: any, idx: number) => {
            petLoveCounts[idx] = post.pet?.loveCount || 0;
          });
          setLoveCounts(petLoveCounts);
        } else {
          // If all pets have been X'd, reset and fetch new ones (but prevent infinite loops)
          if (consecutiveFetchAttempts < 3) {
            setXedPets(new Set()); // Clear the X'd pets so we can show them again
            fetchPets();
          } else {
            // Stop fetching if we've tried too many times without success
            console.log('Stopping fetch attempts - insufficient pets available');
            setPetCards([]);
            setCurrentIdx(0);
          }
        }
        setFetchingMore(false);
      }, 400);
    }
  }, [currentIdx, petCards.length, fetchingMore, allPets, xedPets, consecutiveFetchAttempts]);

  // Render tab content
  const renderTabContent = () => {
    if (activeTab === 'challenges') {
      if (challengesLoading) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        );
      }

      if (!currentChallenge) {
        return (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <TrophyIcon className="w-16 h-16 text-gray-400 mb-4" />
              <div className="text-xl font-bold text-gray-700 mb-2">No Active Challenge</div>
              <p className="text-gray-500">Check back later for new challenges!</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="max-w-2xl mx-auto w-full">
            {/* Challenge header */}
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3 mb-3">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-purple-900">{currentChallenge.title}</h1>
              </div>
              <p className="text-purple-700 mb-2">{currentChallenge.description}</p>
              <div className="flex items-center space-x-4 text-sm text-purple-600">
                <span>#{currentChallenge.hashtag}</span>
                <span>•</span>
                <span>{challengePosts.length} posts</span>
              </div>
            </div>

            {/* Challenge posts */}
            {challengePosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts yet. Be the first to join this challenge!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {challengePosts.map((post) => (
                  <ChallengePostCard
                    key={post.id}
                    post={post}
                    onVote={handleChallengePostVote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'leaderboard') {
      if (leaderboardLoading) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="max-w-4xl mx-auto w-full">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pet Celebs */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-bold">Pet Celebs</h2>
                  <Badge variant="secondary">Top by Bones</Badge>
                </div>
                <div className="space-y-3">
                  {petCelebs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pet celebs yet!</p>
                  ) : (
                    petCelebs.map((entry) => (
                      <LeaderboardCard
                        key={entry.pet?.id || entry.user.id}
                        entry={entry}
                        type="celebs"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Challengers */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrophyIcon className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-bold">Challengers</h2>
                  <Badge variant="secondary">Top by Votes</Badge>
                </div>
                <div className="space-y-3">
                  {challengers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No challengers yet!</p>
                  ) : (
                    challengers.map((entry) => (
                      <LeaderboardCard
                        key={entry.pet?.id || entry.user.id}
                        entry={entry}
                        type="challengers"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Original pet swipe content for pet-celebs and pet-shelters tabs
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* Card */}
        {petCards.length > 0 && currentIdx < petCards.length ? (
          <div
            className={`relative w-full max-w-[370px] h-[70vh] flex flex-col items-center justify-end select-none transition-transform duration-300 ${petCardSwipe.idx === currentIdx && petCardSwipe.dir === 'left' ? '-translate-x-[500px] opacity-0' : ''} ${petCardSwipe.idx === currentIdx && petCardSwipe.dir === 'right' ? 'translate-x-[500px] opacity-0' : ''}`}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setTouchStart({ x: touch.clientX, y: touch.clientY });
              if (e.touches.length === 1) {
                longPressTimeout.current = setTimeout(() => handleSuperLove({ ...petCards[currentIdx], _petIdx: currentIdx }), 1200);
                (e.target as HTMLElement).setAttribute('data-touch-x', e.touches[0].clientX.toString());
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              setTouchEnd({ x: touch.clientX, y: touch.clientY });
            }}
            onTouchEnd={(e) => {
              if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
              const startX = parseFloat((e.target as HTMLElement).getAttribute('data-touch-x') || '0');
              const endX = e.changedTouches[0].clientX;
              if (startX && Math.abs(endX - startX) > 80) {
                if (endX < startX) handleSwipeLeft(currentIdx);
                else handleSwipeRight({ ...petCards[currentIdx], _petIdx: currentIdx });
              }
              // Also handle the new swipe logic
              if (touchStart && touchEnd) {
                const dx = touchEnd.x - touchStart.x;
                const dy = touchEnd.y - touchStart.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                  if (dx < 0) handleSwipeLeft(currentIdx);
                  else if (dx > 0) handleSwipeRight(petCards[currentIdx]);
                }
                setTouchStart(null);
                setTouchEnd(null);
              }
            }}
            onMouseDown={(e) => {
              longPressTimeout.current = setTimeout(() => handleSuperLove({ ...petCards[currentIdx], _petIdx: currentIdx }), 1200);
              (e.target as HTMLElement).setAttribute('data-mouse-x', e.clientX.toString());
            }}
            onMouseUp={(e) => {
              if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
              const startX = parseFloat((e.target as HTMLElement).getAttribute('data-mouse-x') || '0');
              const endX = e.clientX;
              if (startX && Math.abs(endX - startX) > 80) {
                if (endX < startX) handleSwipeLeft(currentIdx);
                else handleSwipeRight({ ...petCards[currentIdx], _petIdx: currentIdx });
              }
            }}
          >
            <PetCard pet={petCards[currentIdx]} loveCount={loveCounts[currentIdx]} onImageError={handlePetImageError} />
            {/* Overlay Action Buttons */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center items-end gap-6 z-20 pointer-events-auto">
              {/* X Button (Nope) */}
              <button
                className="bg-white border-2 border-red-400 hover:bg-red-100 rounded-full w-16 h-16 flex items-center justify-center shadow-xl text-3xl transition active:scale-90 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipeLeft(currentIdx);
                }}
                aria-label="Nope"
              >
                <XIcon className="w-8 h-8 text-red-500" />
              </button>
              {/* Bone Button (Love) */}
              <button
                className="bg-white border-2 border-blue-400 hover:bg-blue-100 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl text-3xl transition active:scale-90 relative"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwipeRight({ ...petCards[currentIdx], _petIdx: currentIdx });
                }}
                aria-label="Love"
              >
                <Bone className="w-9 h-9 text-blue-500" />
              </button>
              {/* Heart Button (Super Love) */}
              <button
                className="bg-white border-2 border-green-400 hover:bg-green-100 rounded-full w-16 h-16 flex items-center justify-center shadow-xl text-3xl transition active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuperLove({ ...petCards[currentIdx], _petIdx: currentIdx });
                }}
                aria-label="Super Love"
              >
                <HeartIcon className="w-8 h-8 text-green-500 fill-current" />
              </button>
              {/* Zap Button (Share) */}
              <button
                className="bg-white border-2 border-yellow-400 hover:bg-yellow-100 rounded-full w-14 h-14 flex items-center justify-center shadow-xl text-3xl transition active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  openShareModal();
                }}
                aria-label="Share with a friend"
              >
                <ZapIcon className="w-7 h-7 text-yellow-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            {activeTab === 'pet-shelters' ? (
              <>
                <div className="w-16 h-16 mb-4 text-gray-400">
                  🏠
                </div>
                <div className="text-xl font-bold text-gray-700 mb-2">No Pet Shelters Available</div>
                <p className="text-gray-500 max-w-md">
                  There are currently no certified pet shelter posts to display. Check back later!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mb-4 text-gray-400">
                  🐾
                </div>
                <div className="text-xl font-bold text-gray-700 mb-2">No More Pets</div>
                <p className="text-gray-500 max-w-md">
                  You've seen all available pets! Check back later for new ones.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading || (challengesLoading && activeTab === 'challenges') || (leaderboardLoading && activeTab === 'leaderboard')) return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-200 via-fuchsia-200 to-yellow-100">
      {/* Tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/20">
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-celebs'
                ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-celebs')}
          >
            Pet Celebs
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-shelters'
                ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-shelters')}
          >
            Pet Shelters
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="w-full h-full flex flex-col items-center justify-center px-4 mt-16">
        {activeTab === 'pet-celebs' || activeTab === 'pet-shelters' ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <PetCardSkeleton />
          </div>
        ) : activeTab === 'challenges' ? (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="max-w-2xl mx-auto w-full space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-gray-300 rounded mb-3"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-16 bg-gray-300 rounded"></div>
                      <div className="h-8 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="max-w-4xl mx-auto w-full">
              <div className="grid md:grid-cols-2 gap-8">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-white/30 rounded w-32 animate-pulse"></div>
                    {Array.from({ length: 5 }, (_, j) => (
                      <div key={j} className="flex items-center space-x-3 p-4 bg-white rounded-lg">
                        <div className="animate-pulse">
                          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                        </div>
                        <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="flex-1 animate-pulse">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-300 rounded w-8"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  if (['pet-celebs', 'pet-shelters'].includes(activeTab) && !petCards.length) return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-200 via-fuchsia-200 to-yellow-100">
      {/* Tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/20">
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-celebs'
                ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-celebs')}
          >
            Pet Celebs
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-shelters'
                ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-shelters')}
          >
            Pet Shelters
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full h-full">
        <PetCardSkeleton />
      </div>
    </div>
  );
  
  if (['pet-celebs', 'pet-shelters'].includes(activeTab) && currentIdx >= petCards.length) return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-200 via-fuchsia-200 to-yellow-100">
      {/* Tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/20">
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-celebs'
                ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-celebs')}
          >
            Pet Celebs
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-shelters'
                ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-shelters')}
          >
            Pet Shelters
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-2">Recycling pets...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4"></div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-200 via-fuchsia-200 to-yellow-100">
      {/* Enhanced Tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/20">
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-celebs'
                ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-celebs')}
          >
            Pet Celebs
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'pet-shelters'
                ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pet-shelters')}
          >
            Pet Shelters
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Animations */}
      {showHeartAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <HeartIcon className="w-32 h-32 text-red-500 fill-current drop-shadow-2xl" />
          </div>
        </div>
      )}
      {showBoneAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <Bone className="w-32 h-32 text-blue-500 drop-shadow-2xl" />
          </div>
        </div>
      )}
      {showXAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <XIcon className="w-32 h-32 text-red-500 drop-shadow-2xl" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full h-full flex flex-col items-center justify-center px-4 mt-16">
        {renderTabContent()}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-xs flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-yellow-500">Share with a Friend</h2>
            {loadingFriends ? (
              <div className="text-center py-8">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No mutual friends found.</div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-4 max-h-32 overflow-y-auto">
                  {friends.map(friend => (
                    <button
                      key={friend.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border ${selectedFriend === friend.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'} hover:bg-yellow-100`}
                      onClick={() => setSelectedFriend(friend.id)}
                    >
                      <SecureImage src={friend.image} alt={friend.name} className="w-8 h-8 rounded-full" />
                      <span className="font-semibold">{friend.name ? (friend.name.trim().split(' ').length === 1 ? friend.name : friend.name.split(' ')[0]) : friend.username}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full border rounded-lg p-2 mt-2 mb-2 text-gray-800"
                  rows={2}
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                  placeholder="Add a message..."
                />
              </>
            )}
            <div className="flex gap-2 mt-2">
              <button className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold" onClick={() => setShowShareModal(false)}>Cancel</button>
              <button className="flex-1 py-2 rounded-lg bg-yellow-500 text-white font-semibold disabled:opacity-50" disabled={!selectedFriend || sharing} onClick={handleShare}>{sharing ? 'Sharing...' : 'Share'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 