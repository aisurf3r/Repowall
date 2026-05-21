import { memo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Star, GitFork, Eye, Clock, Zap, ExternalLink, CalendarDays } from "lucide-react"

export interface Repo {
  id: number
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  subscribers_count?: number
  topics?: string[]
  pushed_at: string
  first_seen: string
  created_at?: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "oklch(0.62 0.19 254)",
  JavaScript: "oklch(0.82 0.18 84)",
  Python: "oklch(0.72 0.16 240)",
  Rust: "oklch(0.65 0.16 45)",
  Go: "oklch(0.65 0.16 200)",
  "C++": "oklch(0.58 0.22 358)",
  Zig: "oklch(0.75 0.16 80)",
  Markdown: "oklch(0.42 0.15 254)",
  Ruby: "oklch(0.50 0.18 20)",
  Java: "oklch(0.60 0.15 42)",
  "C#": "oklch(0.55 0.16 120)",
  C: "oklch(0.50 0.02 0)",
  Shell: "oklch(0.70 0.18 110)",
  Swift: "oklch(0.65 0.20 15)",
  Kotlin: "oklch(0.60 0.20 280)",
  Dart: "oklch(0.68 0.18 180)",
  Vue: "oklch(0.65 0.20 100)",
  HTML: "oklch(0.60 0.20 25)",
  CSS: "oklch(0.50 0.18 250)",
  Lua: "oklch(0.30 0.08 250)",
  Haskell: "oklch(0.45 0.18 280)",
  Elixir: "oklch(0.55 0.18 280)",
  Scala: "oklch(0.50 0.18 15)",
  PHP: "oklch(0.50 0.18 260)",
}

const DEFAULT_COLOR = "oklch(0.92 0.004 264)"
const NEW_THRESHOLD_HOURS = 48

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return n.toString()
}

interface RepoCardProps {
  repo: Repo
  style?: React.CSSProperties
}

export const RepoCard = memo(({ repo, style }: RepoCardProps) => {
  const topics = repo.topics ?? []
  const visibleTopics = topics.slice(0, 4)
  const extraTopics = topics.length - 4
  const langColor = LANGUAGE_COLORS[repo.language ?? ""] ?? DEFAULT_COLOR

  const isNew = (Date.now() - new Date(repo.first_seen).getTime()) < NEW_THRESHOLD_HOURS * 3600000

  return (
    <div
      className="repo-card repo-card-animate flex flex-col gap-3 rounded-xl border-2 bg-card p-4"
      style={{ ...style, "--lang-color": langColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link flex min-w-0 items-center gap-1.5 font-semibold text-foreground transition-colors hover:text-primary"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", lineHeight: "1.4" }}
        >
          <span className="truncate">{repo.full_name}</span>
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
        </a>
        {isNew && (
          <span
            className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            NEW
          </span>
        )}
      </div>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{
          fontFamily: "Inter, sans-serif",
          color: "var(--muted-foreground)",
          opacity: repo.description ? 1 : 0.45,
        }}
      >
        {repo.description ?? "No description"}
      </p>

      {/* Language badge */}
      {repo.language && (
        <div
          className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1"
          style={{ background: `color-mix(in oklch, ${langColor} 12%, transparent)` }}
        >
          <span
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: langColor }}
          />
          <span className="text-xs font-medium text-foreground/80" style={{ fontFamily: "Inter, sans-serif" }}>
            {repo.language}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="size-3.5" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{formatNum(repo.stargazers_count)}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="size-3.5" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{formatNum(repo.forks_count)}</span>
        </span>
        {repo.subscribers_count != null && (
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            <span style={{ fontFamily: "Inter, sans-serif" }}>{formatNum(repo.subscribers_count)}</span>
          </span>
        )}
      </div>

      {/* Topics */}
      {visibleTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTopics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {topic}
            </span>
          ))}
          {extraTopics > 0 && (
            <span
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              +{extraTopics} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>
            Pushed {formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true })}
          </span>
        </div>
        {repo.created_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <CalendarDays className="size-3" />
            <span style={{ fontFamily: "Inter, sans-serif" }}>
              Created {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <Zap className="size-3" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>
            Discovered {formatDistanceToNow(new Date(repo.first_seen), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
})
