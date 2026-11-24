/**
 * RepoWall — feed updater
 * Runs via GitHub Actions once a day.
 *
 * Query strategy:
 *   Q1 — New projects already exploding (stars >500, born in 2025, real forks + content)
 *   Q2 — Recent projects with solid traction (stars >100, born last 3 months)
 *   Q3 — Emerging projects before everyone knows them (stars 50-500, born last 3 months)
 *
 * Filters applied to all queries:
 *   forks — ensures real community interest, not just inflated stars
 *   size  — eliminates pure README repos with no real code
 *
 * Adjust thresholds based on feed quality:
 *   Too much noise → raise minimums
 *   Too few new repos → lower minimums or extend date range
 */

const GIST_ID = process.env.GIST_ID;
const TOKEN = process.env.GIST_TOKEN;
const GIST_FILENAME = "repowall.json";

// Tope de repos guardados en el Gist. Evita que el archivo crezca sin límite
// y supere el umbral de 1 MB de la API de Gist.
const MAX_REPOS = 1000;

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
  `stars:>500+created:>2025-01-01+forks:>50+size:>200&sort=stars&order=desc&per_page=30`,
  `stars:>100+created:>${recentDate}+forks:>20+size:>200&sort=stars&order=desc&per_page=30`,
  `stars:50..500+created:>${recentDate}+forks:>10+size:>200&sort=stars&order=desc&per_page=30`,
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
  if (!res.ok) throw new Error(`GET gist respondió ${res.status}`);

  const gist = await res.json();
  const file = gist.files?.[GIST_FILENAME];
  if (!file) return { repos: [] };

  // La API recorta el contenido de archivos grandes: hay que leer raw_url
  let text = file.content;
  if (file.truncated) {
    const rawRes = await fetch(file.raw_url, { headers });
    if (!rawRes.ok) throw new Error(`raw_url respondió ${rawRes.status}`);
    text = await rawRes.text();
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${GIST_FILENAME} inválido (${e.message}); no se escribe el Gist`);
  }
}

async function saveGist(data) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH gist respondió ${res.status}: ${body}`);
  }
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
      topics: repo.topics ?? [],
      pushed_at: repo.pushed_at,
      created_at: repo.created_at,
      first_seen: map.has(repo.id) ? map.get(repo.id).first_seen : new Date().toISOString(),
    });
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen));
}

async function main() {
  console.log("Fetching trending repos...");
  const raw = await fetchRepos();
  console.log(`Fetched ${raw.length} repos`);

  // Filter out suspicious repos:
  // - More forks than stars: physically impossible organically
  // - Fork ratio >40%: anomalously high for any legitimate project
  const fresh = raw.filter((repo) => {
    const ratio = repo.forks_count / repo.stargazers_count;
    return ratio <= 0.40;
  });
  console.log(`After filter: ${fresh.length} repos`);

  console.log("Loading Gist...");
  const current = await loadGist();
  console.log(`Gist has ${current.repos.length} repos`);

  const updated = upsert(current.repos, fresh).slice(0, MAX_REPOS);
  console.log(`After upsert: ${updated.length} repos total`);

  await saveGist({ repos: updated, last_updated: new Date().toISOString() });
  console.log("Gist updated successfully");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
