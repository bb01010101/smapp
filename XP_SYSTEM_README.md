# XP System Documentation

## Overview

The XP system has been completely rewritten to be simpler, more intuitive, and actually functional. The new system integrates seamlessly with the existing pet leveling system and provides a clean, modern UI for tracking progress.

## Key Features

### 1. Challenge Types

**Daily Challenges (reset every 24 hours):**
- **Daily Login** - Log in today (10 XP)
- **Like 3 Posts** - Like 3 posts today (15 XP)
- **Post a Photo** - Post a timeline photo (25 XP)

**Seasonal Challenges (reset every ~90 days):**
- **Gain 100 Followers** - Gain 100 followers (500 XP)
- **Post 20 Photos** - Post 20 timeline photos (300 XP)
- **Comment on 50 Posts** - Comment on 50 posts (200 XP)

### 2. XP Integration

- XP is stored in pet profiles (existing system)
- XP directly upgrades pet levels and prestige
- Progress is tracked with percentage bars
- Toast notifications show XP gains

### 3. UI Components

- **ChallengeSidebar** - Clean, collapsible sidebar showing challenges
- **XpToast** - Custom toast notifications for XP gains
- **Progress bars** - Visual progress tracking for each challenge

## File Structure

```
src/
├── lib/
│   ├── xpSystem.ts           # Core XP system logic
│   └── useXpTracking.ts      # React hooks for XP tracking
├── components/
│   ├── ChallengeSidebar.tsx  # Main challenge UI component
│   ├── XpToast.tsx          # Custom XP toast component
│   └── ui/
│       └── progress.tsx      # Progress bar component
├── app/
│   ├── api/xp/
│   │   ├── user/[userId]/    # Get user XP and progress
│   │   └── track/            # Track challenge progress
│   └── xp-test/              # Test page for XP system
```

## API Endpoints

### GET `/api/xp/user/[userId]`
Returns user's XP progress and challenge status.

**Response:**
```json
{
  "totalXp": 150,
  "level": 2,
  "challenges": [
    {
      "id": "daily_login",
      "name": "Daily Login",
      "description": "Log in today",
      "type": "daily",
      "xp": 10,
      "goal": 1,
      "progress": 1,
      "completed": true
    }
  ]
}
```

### POST `/api/xp/track`
Track progress for a specific challenge.

**Request:**
```json
{
  "challengeId": "daily_like_3_posts",
  "increment": 1,
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "xpGained": 15,
  "challenge": {
    "id": "daily_like_3_posts",
    "name": "Like 3 Posts",
    "completed": true,
    "xp": 15
  },
  "message": "🎉 Challenge completed! +15 XP",
  "showToast": true
}
```

## Integration Points

### Automatic XP Tracking

The system automatically tracks XP for common actions:

1. **Posting Photos** - Tracks `daily_post_photo` challenge
2. **Liking Posts** - Tracks `daily_like_3_posts` challenge  
3. **Commenting** - Tracks `seasonal_comment_50_posts` challenge
4. **Gaining Followers** - Tracks `seasonal_gain_100_followers` challenge
5. **Daily Login** - Tracks `daily_login` challenge

### Manual XP Tracking

Use the `useXpActions` hook for manual tracking:

```typescript
import { useXpActions } from '@/lib/useXpTracking';

const { trackLogin, trackLike, trackPost } = useXpActions();

// Track specific actions
await trackLogin();
await trackLike();
await trackPost();
```

## Database Schema

The system uses the existing `UserChallenge` model:

```prisma
model UserChallenge {
  id            String   @id @default(cuid())
  userId        String
  challengeName String
  type          ChallengeType
  progress      Int      @default(0)
  goal          Int
  completed     Boolean  @default(false)
  lastUpdated   DateTime @default(now())
  seasonId      String?
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, challengeName, type, seasonId])
}
```

## Level System

XP levels are calculated as: `Math.floor(totalXp / 100) + 1`

- Level 1: 0-99 XP
- Level 2: 100-199 XP
- Level 3: 200-299 XP
- etc.

## Testing

Visit `/xp-test` to test the XP system manually. This page provides buttons to trigger various XP actions and verify the system is working correctly.

## Migration from Old System

The old XP system has been completely replaced:

- ❌ `src/lib/xpChallenges.ts` - Removed
- ❌ `src/lib/challengeProgress.ts` - Removed  
- ❌ `src/components/ChallengeList.tsx` - Removed
- ❌ `src/app/api/challenges/route.ts` - Removed

All functionality has been consolidated into the new, simplified system.

## Future Enhancements

1. **Challenge Reset Logic** - Implement proper daily/seasonal resets
2. **More Challenge Types** - Add new challenges easily
3. **Achievement System** - Add badges and achievements
4. **Leaderboards** - Show top XP earners
5. **Seasonal Events** - Special time-limited challenges

## Troubleshooting

### Common Issues

1. **XP not updating** - Check that the user has pets in the database
2. **Challenges not showing** - Verify the API endpoints are working
3. **Toast not appearing** - Check browser console for errors

### Debug Steps

1. Check browser network tab for API calls
2. Verify user authentication is working
3. Check database for UserChallenge records
4. Test with the `/xp-test` page 