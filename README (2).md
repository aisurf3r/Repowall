# repowall-infra

GitHub Actions cron que alimenta el Gist de RepoWall cada 6 horas.

## Estructura

```
.github/
  workflows/
    update-feed.yml   ← el cron
scripts/
  update-feed.js      ← la lógica
```

## Setup (una sola vez)

### 1. Crea el Gist
Ve a https://gist.github.com y crea un Gist **privado** con:
- Filename: `repowall.json`
- Content: `{"repos":[]}`

Copia el ID del Gist (está en la URL: `gist.github.com/{user}/{GIST_ID}`)

### 2. Crea un PAT
Ve a https://github.com/settings/tokens y crea un token **Classic** con scopes:
- `public_repo`
- `gist`

### 3. Añade los secrets al repo
Ve a Settings → Secrets and variables → Actions y añade:
- `GIST_ID` → el ID del Gist del paso 1
- `GIST_TOKEN` → el PAT del paso 2

### 4. Primer run manual
Ve a Actions → Update RepoWall Feed → Run workflow.
El Gist quedará relleno con los primeros repos.

### 5. A partir de aquí
El Action corre solo cada 6 horas. Puedes forzar un run manual desde la UI de Actions cuando quieras.

## URL pública del Gist (para la app)

```
https://gist.githubusercontent.com/{tu_usuario}/{GIST_ID}/raw/repowall.json
```

Esta URL es la que usa la app frontend para leer el feed. No requiere auth.
