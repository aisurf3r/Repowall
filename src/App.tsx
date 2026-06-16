import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { CircleAlert as AlertCircle, RefreshCw, TrendingUp, Clock, Loader as Loader2, FileSliders as Sliders, ChevronDown, Zap, Clock3 } from "lucide-react"
import { RepoCard, type Repo } from "@/components/RepoCard"
import { Masonry } from "@/components/Masonry"
import { ModeToggle } from "@/components/mode-toggle"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const DATA_URL = import.meta.env.VITE_API_URL || ""
const PAGE_SIZE = 50

const PRIMARY_LANGUAGE_FILTERS = [
  "All",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "JavaScript",
] as const

const SECONDARY_LANGUAGE_FILTERS = [
  "C++",
  "C#",
  "PHP",
  "HTML",
  "CSS",
  "Shell",
  "Java",
  "Kotlin",
  "Swift",
  "Other",
] as const

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  "C#": "#9b4f96",
  PHP: "#8892be",
  HTML: "#e34c26",
  CSS: "#264de4",
  Shell: "#e8a838",
  Java: "#b07219",
  Kotlin: "#7f52ff",
  Swift: "#f05138",
  Other: "#6b7280",
}

const AGE_OPTIONS = [
  { label: "Any age", value: 0 },
  { label: "Last month", value: 30 },
  { label: "Last 3 months", value: 90 },
  { label: "Last 6 months", value: 180 },
  { label: "Last year", value: 365 },
]

type SortMode = "velocity" | "recent"

interface RepoData {
  repos: Repo[]
  last_updated: string
}

export default function App() {
  const [data, setData] = useState<RepoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set(["All"]))
  const [minStars, setMinStars] = useState(0)
  const [minForks, setMinForks] = useState(0)
  const [maxAgeDays, setMaxAgeDays] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sortMode, setSortMode] = useState<SortMode>("velocity")

  useEffect(() => {
    if (!DATA_URL) {
      setError("API URL is not defined in environment variables")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: RepoData) => {
        setData(json)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message ?? "Failed to load data")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedLangs, minStars, minForks, maxAgeDays, sortMode])

  const toggleLang = (lang: string) => {
    if (lang === "All") {
      setSelectedLangs(new Set(["All"]))
      return
    }
    const next = new Set(selectedLangs)
    next.delete("All")
    if (next.has(lang)) {
      next.delete(lang)
      if (next.size === 0) next.add("All")
    } else {
      next.add(lang)
    }
    setSelectedLangs(next)
  }

  const filteredRepos = useMemo(() => {
    if (!data) return []
    let repos = [...data.repos]

    if (sortMode === "velocity") {
      repos.sort((a, b) => {
        const ageA = Math.max((Date.now() - new Date(a.created_at ?? a.first_seen).getTime()) / 86400000, 1)
        const ageB = Math.max((Date.now() - new Date(b.created_at ?? b.first_seen).getTime()) / 86400000, 1)
        return (b.stargazers_count / ageB) - (a.stargazers_count / ageA)
      })
    } else {
      repos.sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())
    }

    if (!selectedLangs.has("All")) {
      repos = repos.filter((r) => {
        const lang = r.language ?? ""
        if (!lang) return selectedLangs.has("Other")
        return selectedLangs.has(lang)
      })
    }
    repos = repos.filter((r) => r.stargazers_count >= minStars)
    repos = repos.filter((r) => r.forks_count >= minForks)
    if (maxAgeDays > 0) {
      const cutoff = Date.now() - maxAgeDays * 86400000
      repos = repos.filter((r) => new Date(r.created_at ?? r.first_seen).getTime() >= cutoff)
    }

    return repos
  }, [data, selectedLangs, minStars, minForks, maxAgeDays, sortMode])

  const visibleRepos = filteredRepos.slice(0, visibleCount)
  const hasMore = visibleCount < filteredRepos.length
  const maxStars = data ? Math.max(...data.repos.map(r => r.stargazers_count), 100000) : 100000
  const maxForks = data ? Math.max(...data.repos.map(r => r.forks_count), 10000) : 10000
  const activeFilterCount = [minStars > 0, minForks > 0, maxAgeDays > 0].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,.02) 2px, rgba(255,255,255,.02) 4px)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Hero header */}
      <header className="relative z-10 overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-80 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -top-20 left-1/4 h-40 w-48 rounded-full bg-chart-2/8 blur-2xl" />
          <div className="absolute -top-20 right-1/4 h-40 w-48 rounded-full bg-chart-5/8 blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                  <TrendingUp className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
                    TRENDING
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-green-400" />
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>Live</span>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl" style={{ fontFamily: "Inter, sans-serif" }}>
                Repo
                <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-1 bg-clip-text text-transparent">Wall</span>
              </h1>
              <p className="mt-2 text-base text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                Discover the hottest GitHub repositories — curated &amp; updated daily
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto md:flex-wrap items-center gap-2 pb-2 md:pb-0 scrollbar-none">
            <span className="mr-1 text-xs font-medium text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
              Code:
            </span>
            {PRIMARY_LANGUAGE_FILTERS.map((lang) => {
              const isActive = lang === "All" ? selectedLangs.has("All") : selectedLangs.has(lang)
              return (
                <button
                  key={lang}
                  onClick={() => toggleLang(lang)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {lang !== "All" && (
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : LANGUAGE_COLORS[lang] ?? "#888" }}
                    />
                  )}
                  {lang}
                </button>
              )
            })}

            {/* Secondary languages dropdown */}
            {(() => {
              const activeSecondary = SECONDARY_LANGUAGE_FILTERS.filter(l => selectedLangs.has(l))
              const hasActive = activeSecondary.length > 0
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                        hasActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {hasActive ? (
                        <span className="flex items-center gap-1">
                          {activeSecondary.slice(0, 2).map(l => (
                            <span key={l} className="inline-block size-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.7)" }} />
                          ))}
                          {activeSecondary.length > 2 && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[9px] font-bold text-primary-foreground">
                              +{activeSecondary.length - 2}
                            </span>
                          )}
                        </span>
                      ) : null}
                      More
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="w-40">
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground">More languages</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {SECONDARY_LANGUAGE_FILTERS.map((lang) => (
                      <DropdownMenuCheckboxItem
                        key={lang}
                        checked={selectedLangs.has(lang)}
                        onCheckedChange={() => toggleLang(lang)}
                        className="gap-2 text-xs"
                      >
                        <span
                          className="inline-block size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: LANGUAGE_COLORS[lang] ?? "#888" }}
                        />
                        {lang}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })()}

            {/* Sort toggle */}
            <div className="ml-2 flex items-center rounded-full border border-border bg-secondary p-0.5">
              <button
                onClick={() => setSortMode("velocity")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  sortMode === "velocity"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Zap className="size-3" />
                Velocity
              </button>
              <button
                onClick={() => setSortMode("recent")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  sortMode === "recent"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Clock3 className="size-3" />
                Recent
              </button>
            </div>

            {/* Advanced filters */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  style={{ fontFamily: "Inter, sans-serif" }}
                  className={`ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground ${
                    activeFilterCount > 0
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  <Sliders className="size-3" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Minimum Stars</label>
                      <span className="text-sm font-semibold text-primary">{minStars.toLocaleString()}+</span>
                    </div>
                    <Slider value={[minStars]} onValueChange={(val) => setMinStars(val[0])} max={maxStars} step={1000} className="w-full" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Minimum Forks</label>
                      <span className="text-sm font-semibold text-primary">{minForks.toLocaleString()}+</span>
                    </div>
                    <Slider value={[minForks]} onValueChange={(val) => setMinForks(val[0])} max={maxForks} step={500} className="w-full" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Created within</label>
                    <div className="flex flex-wrap gap-2">
                      {AGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMaxAgeDays(opt.value)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            maxAgeDays === opt.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setMinStars(0); setMinForks(0); setMaxAgeDays(0) }}
                      className="w-full rounded-lg border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div className="ml-auto flex items-center gap-3">
              {data && (
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                  {visibleCount < filteredRepos.length
                    ? `${visibleCount} of ${filteredRepos.length} repos`
                    : `${filteredRepos.length} repo${filteredRepos.length !== 1 ? "s" : ""}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
              <Loader2 className="relative size-10 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
              Loading trending repositories...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>Failed to load repositories</p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredRepos.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="rounded-full border border-border bg-secondary p-4">
              <TrendingUp className="size-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>No repositories found</p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>Try adjusting your filters</p>
          </div>
        )}

        {!loading && !error && visibleRepos.length > 0 && (
          <>
            <Masonry
              items={visibleRepos}
              columnWidth={300}
              gap={16}
              renderItem={(repo, i) => (
                <RepoCard repo={repo} style={{ animationDelay: `${i * 35}ms` }} />
              )}
            />
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <ChevronDown className="size-4" />
                  Load more ({filteredRepos.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
  <a 
    href="https://github.com/aisurf3r/Repowall" 
    target="_blank" 
    rel="noreferrer" 
    className="font-semibold text-foreground hover:text-primary transition-colors" 
    style={{ fontFamily: "Inter, sans-serif" }}
  >
    RepoWall
  </a>
  <span>·</span>
  <span style={{ fontFamily: "Inter, sans-serif" }}>
  GitHub Trending Aggregator * Made with ❤️ by{" "}
  <a 
    href="mailto:aisurf3r@gmail.com" 
    className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
  >
    Aisurf3r
  </a>{" "}
  *
</span>
</div>
            {data?.last_updated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                <Clock className="size-3" />
                <span>Last updated {formatDistanceToNow(new Date(data.last_updated), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
