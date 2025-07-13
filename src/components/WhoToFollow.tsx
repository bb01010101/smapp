import { getRandomUsers } from "@/actions/user.action";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";
import ProfileLink from "./ProfileLink";
import { isUserVerified, isUserVerifiedShelter } from "@/lib/utils";
import BlueCheckIcon from "./BlueCheckIcon";
import RedCheckIcon from "./RedCheckIcon";

async function WhoToFollow() {
    
  const users = await getRandomUsers();

  if(users.length == 0) return null;


  return (
    <Card>
        <CardHeader>
            <CardTitle>Who to Follow</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex gap-2 items-center justify-between ">
              <div className="flex items-center gap-1">
                <ProfileLink href={`/profile/${user.username}`}>
                  <Avatar>
                    <AvatarImage src={user.image ?? "/avatar.png"} />
                  </Avatar>
                </ProfileLink>
                <div className="text-xs">
                  <div className="flex items-center gap-1">
                    <ProfileLink href={`/profile/${user.username}`} className="font-medium cursor-pointer">
                      {user.name}
                    </ProfileLink>
                    {isUserVerified(user.username) && (
                      <BlueCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                    )}
                    {isUserVerifiedShelter(user.username) && (
                      <RedCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <p className="text-muted-foreground">{user._count.followers} followers</p>
                </div>
              </div>
              <FollowButton userId={user.id} /> 
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

  );
}
export default WhoToFollow