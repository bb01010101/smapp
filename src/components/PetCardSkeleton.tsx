import { Skeleton } from "@/components/ui/skeleton";

export function PetCardSkeleton() {
  return (
    <div className="relative w-full max-w-[370px] h-[70vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden bg-white">
      {/* Image skeleton */}
      <div className="relative w-full h-full min-h-[60vh] max-h-[80vh] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Overlay info skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-20 bg-white/20" />
          <Skeleton className="h-4 w-8 bg-white/20" />
        </div>
        <Skeleton className="h-4 w-full mb-2 bg-white/20" />
        <Skeleton className="h-3 w-24 mb-2 bg-white/20" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-5 bg-white/20" />
          <Skeleton className="h-4 w-8 bg-white/20" />
        </div>
      </div>
    </div>
  );
} 