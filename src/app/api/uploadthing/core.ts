import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  // define routes for different upload types
  postImage: f({
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
    video: {
      maxFileSize: "128MB",
      maxFileCount: 1,
    }
  })
    .middleware(async () => {
      try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        return { userId };
      } catch (error) {
        console.error("Uploadthing middleware error:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload completed:", { fileUrl: file.url, fileType: file.type });
        return { fileUrl: file.url, fileType: file.type };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),

  petImage: f({
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        return { userId };
      } catch (error) {
        console.error("Uploadthing middleware error:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload completed:", { fileUrl: file.url });
        return { fileUrl: file.url };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
