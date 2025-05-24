import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VideoFeed from "@/components/VideoFeed";
import VideoUpload from "@/components/VideoUpload";

export default async function PawPlaysPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const videos = await prisma.video.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      <VideoUpload />
      <VideoFeed videos={videos} />
    </div>
  );
}