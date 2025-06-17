"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;
    const image = formData.get("image") as string;
    const isAffiliate = formData.get("isAffiliate") === "true";
    const affiliateLink = formData.get("affiliateLink") as string;
    const affiliateCode = formData.get("affiliateCode") as string;

    console.log("Creating product with data:", { title, description, price, category, condition, location, image, isAffiliate, affiliateLink, affiliateCode });

    const product = await prisma.post.create({
      data: {
        title,
        description,
        price,
        category,
        condition,
        location,
        image,
        isAffiliate,
        affiliateLink,
        affiliateCode,
        type: "PRODUCT",
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/marketplace");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function createService(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const priceType = formData.get("priceType") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;

    console.log("Creating service with data:", { title, description, price, priceType, category, location });

    const service = await prisma.post.create({
      data: {
        title,
        description,
        price,
        priceType,
        category,
        location,
        type: "SERVICE",
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/marketplace");
    return { success: true, service };
  } catch (error) {
    console.error("Failed to create service:", error);
    return { success: false, error: "Failed to create service" };
  }
}

export async function getProducts() {
  try {
    const products = await prisma.post.findMany({
      where: {
        type: "PRODUCT",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getServices() {
  try {
    const services = await prisma.post.findMany({
      where: {
        type: "SERVICE",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return services;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.post.findUnique({
      where: { 
        id,
        type: "PRODUCT",
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}

export async function getServiceById(id: string) {
  try {
    const service = await prisma.post.findUnique({
      where: { 
        id,
        type: "SERVICE",
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return service;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw new Error("Failed to fetch service");
  }
}

export async function deleteListing(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const listing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }

    if (listing.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/marketplace");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return { success: false, error: "Failed to delete listing" };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const listing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }

    if (listing.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;
    const image = formData.get("image") as string;
    const isAffiliate = formData.get("isAffiliate") === "true";
    const affiliateLink = formData.get("affiliateLink") as string;
    const affiliateCode = formData.get("affiliateCode") as string;

    const product = await prisma.post.update({
      where: { id },
      data: {
        title,
        description,
        price,
        category,
        condition,
        location,
        image,
        isAffiliate,
        affiliateLink,
        affiliateCode,
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/marketplace");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function updateService(id: string, formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const listing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }

    if (listing.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const priceType = formData.get("priceType") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;

    const service = await prisma.post.update({
      where: { id },
      data: {
        title,
        description,
        price,
        priceType,
        category,
        location,
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/marketplace");
    return { success: true, service };
  } catch (error) {
    console.error("Failed to update service:", error);
    return { success: false, error: "Failed to update service" };
  }
} 