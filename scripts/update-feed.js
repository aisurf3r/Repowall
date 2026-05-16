/**
 * RepoWall — feed updater
 * Runs via GitHub Actions once a day.
 * Fetches trending repos from GitHub API, upserts into a Gist JSON.
 *
 * Required env vars (repo secrets):
 *   GIST_ID    — ID of your Gist
 *   GIST_TOKEN — PAT with scopes: public_repo + gist
 *
 * Compressed field map:
 *   n  = full_name
 *   d  = description
 *   u  = html_url
 *   l  = language
 *   s  = stargazers_count
 *   f  = forks_count
 *   w  = subscribers_count (real watchers)
 *   t  = topics
 *   p  = pushed_at
 *   fs = first_seen (discovery date, never overwritten)
 */

const GIST_ID = process.env.GIST_ID;
const TOKEN = process.env.GIST_TOKEN;
const GIST_FILENAME = "repowall.json";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const QUERIES = [
  "stars:>500+pushed:>2024-01-01&sort=stars&order=desc",
  "stars:>100+created:>2025-01-01&sort=stars&order=desc",
  "stars:>50+created:>2025-03-01&sort=stars&order=desc",
];

async function fetchRepos() {
  const results = await Promise.all(
    QUERIES.map((q) =>
      fetch(`https://api.github.com/search/repositories?q=${q}&per_page=30`, { headers })
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
        [GIST_FILENAME]: {
          content: JSON.stringify(data),
        },
      },
    }),
  });
}

function upsert(existing, fresh) {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const repo of fresh) {
    map.set(repo.id, {
      id: repo.id,
      n: repo.full_name,
      d: repo.description,
      u: repo.html_url,
      l: repo.language,
      s: repo.stargazers_count,
      f: repo.forks_count,
      w: repo.subscribers_count,
      t: repo.topics ?? [],
      p: repo.pushed_at,
      fs: map.has(repo.id) ? map.get(repo.id).fs : new Date().toISOString(),
    });
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.fs) - new Date(a.fs));
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
