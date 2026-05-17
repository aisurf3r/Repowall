import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { CircleAlert as AlertCircle, RefreshCw, TrendingUp, Clock, Loader as Loader2, FileSliders as Sliders } from "lucide-react"
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

const DATA_URL =
  "https://gist.githubusercontent.com/aisurf3r/f89f5ae8d011f4a3ced06234288d25e2/raw/repowall.json"

const LANGUAGE_FILTERS = [
  "All",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "JavaScript",
  "C++",
  "Zig",
] as const

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  Zig: "#ec915c",
}

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

  useEffect(() => {
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

    // Sort by first_seen descending (newest first)
    repos.sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())

    // Filter by language
    if (!selectedLangs.has("All")) {
      repos = repos.filter((r) => selectedLangs.has(r.language ?? ""))
    }

    // Filter by stars
    repos = repos.filter((r) => r.stargazers_count >= minStars)

    // Filter by forks
    repos = repos.filter((r) => r.forks_count >= minForks)

    return repos
  }, [data, selectedLangs, minStars, minForks])

  const maxStars = data ? Math.max(...data.repos.map(r => r.stargazers_count), 100000) : 100000
  const maxForks = data ? Math.max(...data.repos.map(r => r.forks_count), 10000) : 10000

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
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
        {/* Background glow - intensified */}
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
                  <span
                    className="text-xs font-semibold text-primary"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    TRENDING
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-green-400" />
                  <span
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Live
                  </span>
                </div>
              </div>
              <h1
                className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Repo
                <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-1 bg-clip-text text-transparent">
                  Wall
                </span>
              </h1>
              <p
                className="mt-2 text-base text-muted-foreground"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Discover the hottest GitHub repositories — curated &amp; updated daily
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Language filter bar + stats */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="mr-1 text-xs font-medium text-muted-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Filter:
            </span>
            {LANGUAGE_FILTERS.map((lang) => {
              const isActive =
                lang === "All"
                  ? selectedLangs.has("All")
                  : selectedLangs.has(lang)
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
                      style={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.7)"
                          : LANGUAGE_COLORS[lang] ?? "#888",
                      }}
                    />
                  )}
                  {lang}
                </button>
              )
            })}

            {/* Advanced filters dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  style={{ fontFamily: "Inter, sans-serif" }}>
                  <Sliders className="size-3" />
                  Filters
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Stars slider */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Minimum Stars
                      </label>
                      <span className="text-sm font-semibold text-primary">
                        {minStars.toLocaleString()}+
                      </span>
                    </div>
                    <Slider
                      value={[minStars]}
                      onValueChange={(val) => setMinStars(val[0])}
                      max={maxStars}
                      step={1000}
                      className="w-full"
                    />
                  </div>

                  {/* Forks slider */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Minimum Forks
                      </label>
                      <span className="text-sm font-semibold text-primary">
                        {minForks.toLocaleString()}+
                      </span>
                    </div>
                    <Slider
                      value={[minForks]}
                      onValueChange={(val) => setMinForks(val[0])}
                      max={maxForks}
                      step={500}
                      className="w-full"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="ml-auto flex items-end gap-3 pl-2">
  {data && (
    <span
      className="text-xs text-muted-foreground"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {filteredRepos.length} repo{filteredRepos.length !== 1 ? "s" : ""}
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
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Loading trending repositories...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <div>
                <p
                  className="font-medium text-foreground"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Failed to load repositories
                </p>
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {error}
                </p>
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
            <p
              className="font-medium text-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              No repositories found
            </p>
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Try adjusting your filters
            </p>
          </div>
        )}

        {!loading && !error && filteredRepos.length > 0 && (
          <Masonry
            items={filteredRepos}
            columnWidth={300}
            gap={16}
            renderItem={(repo, i) => (
              <RepoCard
                repo={repo}
                style={{ animationDelay: `${i * 35}ms` }}
              />
            )}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="font-semibold text-foreground"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                RepoWall
              </span>
              <span>·</span>
              <span style={{ fontFamily: "Inter, sans-serif" }}>
                GitHub Trending Aggregator
              </span>
            </div>
            {data?.last_updated && (
              <div
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Clock className="size-3" />
                <span>
                  Last updated{" "}
                  {formatDistanceToNow(new Date(data.last_updated), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
