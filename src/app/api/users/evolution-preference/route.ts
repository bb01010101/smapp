import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { useEvolutionImages: true },
    });

    return new Response(JSON.stringify({ 
      useEvolutionImages: user?.useEvolutionImages || false 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error getting evolution image preference:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { useEvolutionImages } = await request.json();

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, useEvolutionImages: true }
    });

    if (!existingUser) {
      return new Response(JSON.stringify({ error: "User not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    await prisma.user.update({
      where: { clerkId },
      data: { useEvolutionImages },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating evolution image preference:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 