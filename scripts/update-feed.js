/**
 * RepoWall — feed updater
 * Runs via GitHub Actions once a day.
 *
 * Query strategy:
 *   Q1 — New projects already exploding (stars >500, born in 2025)
 *   Q2 — Recent projects with solid traction (stars >100, born last 3 months)
 *   Q3 — Emerging projects before everyone knows them (stars 50-500, born last 3 months)
 *
 * Adjust thresholds based on feed quality:
 *   Too much noise → raise minimums
 *   Too few new repos → lower minimums or extend date range
 */

const GIST_ID = process.env.GIST_ID;
const TOKEN = process.env.GIST_TOKEN;
const GIST_FILENAME = "repowall.json";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const today = new Date();
const threeMonthsAgo = new Date(today);
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const recentDate = threeMonthsAgo.toISOString().split("T")[0];

const QUERIES = [
  `stars:>500+created:>2025-01-01&sort=stars&order=desc&per_page=30`,
  `stars:>100+created:>${recentDate}&sort=stars&order=desc&per_page=30`,
  `stars:50..500+created:>${recentDate}&sort=stars&order=desc&per_page=30`,
];

async function fetchRepos() {
  const results = await Promise.all(
    QUERIES.map((q) =>
      fetch(`https://api.github.com/search/repositories?q=${q}`, { headers })
        .then((r) => r.json())
        .then((d) => d.items ?? [])
    )
  );
  const seen = new Set();
  return results.flat().filter((repo) => {
    if (seen.has(repo.id)) return false;
    seen.add(repo.id);
    return true;
  });
}

async function loadGist() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
  const gist = await res.json();
  const raw = gist.files?.[GIST_FILENAME]?.content;
  return raw ? JSON.parse(raw) : { repos: [] };
}

async function saveGist(data) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(data) },
      },
    }),
  });
}

function upsert(existing, fresh) {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const repo of fresh) {
    map.set(repo.id, {
      id: repo.id,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      subscribers_count: repo.subscribers_count,
      topics: repo.topics ?? [],
      pushed_at: repo.pushed_at,
      first_seen: map.has(repo.id) ? map.get(repo.id).first_seen : new Date().toISOString(),
    });
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen));
}

async function main() {
  console.log("Fetching trending repos...");
  const fresh = await fetchRepos();
  console.log(`Fetched ${fresh.length} repos`);

  console.log("Loading Gist...");
  const current = await loadGist();
  console.log(`Gist has ${current.repos.length} repos`);

  const updated = upsert(current.repos, fresh);
  console.log(`After upsert: ${updated.length} repos total`);

  await saveGist({ repos: updated, last_updated: new Date().toISOString() });
  console.log("Gist updated successfully");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
