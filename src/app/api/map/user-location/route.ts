import { NextRequest, NextResponse } from "next/server";
import { getUserLocation } from "@/actions/map.action";

export async function GET(request: NextRequest) {
  try {
    const userLocation = await getUserLocation();
    
    return NextResponse.json(userLocation);
  } catch (error) {
    console.error("Error fetching user location:", error);
    return NextResponse.json(
      { error: "Failed to fetch user location" },
      { status: 500 }
    );
  }
} 