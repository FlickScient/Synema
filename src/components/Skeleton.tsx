export function SkeletonMovieCard() {
  return (
    <div className="flex-shrink-0 w-32 md:w-40 animate-pulse">
      <div className="aspect-[2/3] bg-synema-card rounded-xl" />
      <div className="mt-2 space-y-2">
        <div className="h-4 bg-synema-card rounded w-3/4" />
        <div className="h-3 bg-synema-card rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-synema-card" />
      <div className="absolute inset-0 flex items-end pb-32">
        <div className="max-w-7xl mx-auto px-16 w-full">
          <div className="max-w-2xl space-y-4">
            <div className="h-6 bg-synema-surface rounded-full w-20" />
            <div className="h-14 bg-synema-surface rounded-lg w-3/4" />
            <div className="h-6 bg-synema-surface rounded-lg w-1/2" />
            <div className="h-20 bg-synema-surface rounded-lg" />
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-synema-surface rounded-lg" />
              <div className="h-12 w-32 bg-synema-surface rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse">
      <div className="relative h-[50vh] md:h-[60vh]">
        <div className="absolute inset-0 bg-synema-card" />
        <div className="absolute inset-0 bg-gradient-to-t from-synema-bg via-synema-bg/50 to-transparent" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-64 aspect-[2/3] bg-synema-card rounded-xl" />
          <div className="flex-1 space-y-4">
            <div className="h-10 bg-synema-card rounded-lg w-2/3" />
            <div className="h-4 bg-synema-card rounded w-1/2" />
            <div className="h-4 bg-synema-card rounded w-1/4" />
            <div className="h-32 bg-synema-card rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[2/3] bg-synema-card rounded-xl" />
          <div className="h-4 bg-synema-card rounded w-3/4" />
          <div className="h-3 bg-synema-card rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
