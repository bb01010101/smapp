import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUserVerified(username: string): boolean {
  const verifiedUsers = ["bb7906", "mitchng77", "luisa.marfori"];
  return verifiedUsers.includes(username);
}

export function isUserVerifiedShelter(username: string): boolean {
  const verifiedShelters = ["brian.boler340"];
  return verifiedShelters.includes(username);
}
