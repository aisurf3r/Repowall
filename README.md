# **🐙 RepoWall — GitHub Trending Aggregator**  (english ver ▼ down)

⚡ **Descubre los repositorios más calientes de GitHub antes de que se vuelvan virales.**

**RepoWall** es un agregador público de solo lectura que detecta automáticamente proyectos emergentes y virales en GitHub, ordenados mediante **Star Velocity (Velocidad de Estrellas)**. Esta métrica es la única capaz de capturar el verdadero impacto de un software naciente de forma honesta. Sin registros, sin bases de datos tradicionales y sin infraestructura compleja de backend. Solo señal pura y directa.

<img width="1392" height="941" alt="{741BE3D3-FCDE-464E-B745-A0573783BACB}" src="https://github.com/user-attachments/assets/b54ca57d-24b2-4f46-9020-54ff694ab1dc" />


## **⚙️ Cómo Funciona**

El ecosistema de RepoWall está dividido en dos piezas completamente independientes:

### **1\. 🌐 El Pipeline de Datos (repowall-infra)**

Un flujo automatizado en **GitHub Actions** que se ejecuta **diariamente a las 08:00 UTC**.

* **Búsqueda Inteligente:** Consulta la API de GitHub en paralelo usando tres búsquedas minuciosamente calibradas.  
* **Filtro Anti-Spam:** Limpia los resultados de repositorios inflados artificialmente o granjas de bots.  
* **Persistencia:** Guarda instantáneamente la captura consolidada en un archivo JSON alojado en un **GitHub Gist privado**. Este Gist actúa como nuestra base de datos histórica e indestructible. Si la interfaz web se apaga mañana, tus datos sobreviven intactos en el Gist.

### **2\. 💻 La Aplicación Frontend**

Una interfaz moderna construida sobre **React \+ Vite**. Al cargar la página, consulta la URL cruda del Gist, procesa la información y renderiza las tarjetas en un muro adaptativo estilo *Masonry* con cálculo dinámico de alturas. Al ser un sitio estático puro, se puede desplegar gratis en cualquier lugar (**Vercel**, Netlify, Cloudflare Pages) sin costes de servidor.

## **🔍 Consultas de Descubrimiento**

Cada mañana, el pipeline procesa tres niveles de búsqueda automatizada para capturar el software en sus distintas fases de madurez:

| Tipo de Señal | Consulta API (GitHub Search) | Objetivo de Captura |
| :---- | :---- | :---- |
| **💥 Explosión Inmediata** | stars:\>500 created:\>2025-01-01 forks:\>50 size:\>200 | Proyectos nacidos este año que ya han explotado de forma masiva. |
| **📈 Tracción Temprana** | stars:\>100 created:\>last 3 months forks:\>20 size:\>200 | Software muy reciente que mantiene un crecimiento sólido y orgánico. |
| **🌱 Radar de Emergencias** | stars:50..500 created:\>last 3 months forks:\>10 size:\>200 | Joyas ocultas en su fase más temprana (aquí nacen los virales reales). |

## **🛡️ Filtros de Calidad e Integridad**

Los datos brutos de las tendencias en GitHub suelen estar llenos de ruido y bots. Para garantizar un *feed* de alta calidad, RepoWall aplica filtros estrictos antes de registrar cualquier repositorio en el Gist:

### **🤖 Filtro de Ratio de Horquillas (*Fork Ratio*)**

![][image1]Los proyectos legítimos rara vez superan un ratio del 40% de forks sobre estrellas. Los repositorios que superan este umbral suelen estar inflados artificialmente (los bots añaden *stars* pero no hacen *fork*). Esta regla elimina de raíz el spam más agresivo del feed.

### **📦 Filtro de Peso Mínimo**

* Al aplicar size:\>200 directamente en las consultas, excluimos repositorios fantasma o que solo contienen un archivo README.md vacío. Un proyecto con código real debe pesar al menos 200KB.

## **📊 Algoritmo de Ordenamiento: Star Velocity**

En el cliente, los repositorios no se ordenan por su volumen total de estrellas, sino por su **velocidad de crecimiento por día desde su creación**:

velocity \= stargazers\_count / Math.max(age\_in\_days, 1\)

🎯 **Filosofía del Muro:** Un repositorio que ha conseguido **10k estrellas en 30 días** es infinitamente más rompedor y relevante que uno con **100k estrellas acumuladas a lo largo de 2 años**. Este cálculo posiciona las tendencias reales en la cima de tu muro sin importar el peso histórico de los gigantes antiguos.

## **🎴 Anatomía de una Tarjeta (RepoCard)**

Cada tarjeta en el muro interactivo despliega un set completo de señales analíticas directamente mapeadas desde la API de GitHub:

\+---------------------------------------------------------+  
|  🐙 username / repository-name                      🔗   | \-\> Enlace directo a GitHub  
|  Beautifully detailed app description text...             | \-\> Atenuado si está vacío  
|                                                           |  
|  \[● TypeScript\]                                         | \-\> Badge con color oficial  
|  ⭐ 12.4k     🔀 1.2k     👁️ 342                        | \-\> Métricas clave (Watchers reales)  
|  \[web\] \[react\] \[vite\] \[+2 more\]                   | \-\> Lista de hasta 4 tópicos  
|  \-----------------------------------------------------   |  
|  🕒 Pushed 2 hours ago                                   | \-\> Señal de actividad viva  
|  📅 Created 2 weeks ago                                  | \-\> Antigüedad del proyecto  
|  ⚡ Discovered 3 days ago                                | \-\> Registro de RepoWall  
\+---------------------------------------------------------+

*✨ **Efecto Visual:** Los bordes de las tarjetas se iluminan con un sutil resplandor dinámico utilizando el color exacto de su lenguaje de programación principal al pasar el cursor. Los repositorios sin lenguaje definido adoptan un elegante destello blanco.*

## **🏗️ Arquitectura del Sistema**

     ┌────────────────────────┐  
     │   GitHub Search API    │  
     └───────────┬────────────┘  
                 │  
                 ▼  (Ejecución Diaria Cron)  
     ┌────────────────────────┐  
     │  GitHub Actions Infra  │ ──► Filtro Ratio de Forks (≤ 0.40)  
     └───────────┬────────────┘  
                 │  
                 ▼  (Upsert Automatizado)  
     ┌────────────────────────┐  
     │ GitHub Gist (JSON DB)  │ ──► Base de datos serverless e incremental  
     └───────────┬────────────┘  
                 │  
                 ▼  (Carga dinámica / Fetch on mount)  
     ┌────────────────────────┐  
     │   React Frontend       │ ──► Ordena por Star Velocity  
     └───────────┬────────────┘     ──► Filtra por Idioma / Estrellas / Forks  
                 │  
                 ▼  (Despliegue Estático)  
     ┌────────────────────────┐  
     │   Vercel / Edge Host   │  
     └────────────────────────┘

## **🚀 Configuración del Entorno e Infraestructura**

### **1\. Variables del Repositorio de Infraestructura (repowall-infra)**

Crea un repositorio para el script automatizado e inyecta las siguientes claves dentro de tus **GitHub Repository Secrets**:

| Secreto | Descripción | Valor Requerido |
| :---- | :---- | :---- |
| GIST\_ID | Identificador único del almacenamiento. | El ID extraído de la URL de tu Gist privado. |
| GIST\_TOKEN | Token de autenticación seguro. | Tu Personal Access Token (PAT) de GitHub con permisos para gist y public\_repo. |

### **2\. Variables de Entorno del Frontend**

Para enlazar la aplicación de React con los datos del Gist de manera segura sin exponer la URL privada en tus commits, configura esta variable en tu archivo .env.local de desarrollo o en el panel de variables de Vercel:

VITE\_API\_URL=\[https://gist.githubusercontent.com/\](https://gist.githubusercontent.com/){tu\_usuario}/{id\_del\_gist}/raw/repowall.json

## **🛠️ Tecnologías Utilizadas**

* **Pipeline de Datos:** Node.js 24 & GitHub Actions CI/CD.  
* **Almacenamiento Core:** GitHub Gist (Persistencia JSON).  
* **Capas del Frontend:** React 18, Vite & TypeScript.  
* **Estilos e Interfaz:** Tailwind CSS v4 & componentes accesibles de shadcn/ui.  
* **Layout Dinámico:** Muro estructural *Masonry* adaptativo con caché de altura en el cliente.  
* **Tratamiento del Tiempo:** Formateo ágil de fechas relativas mediante date-fns.  
* **Paquete de Iconos:** Lucide React.  
* **Alojamiento:** Vercel (Optimizada para despliegues estáticos globales).

## **⚠️ Limitaciones Conocidas**

* **Detección de Granjas de Bots:** El filtro de ratio de horquillas es altamente efectivo pero no infalible frente a ataques de spam avanzados que imitan comportamiento humano coordinado.  
* **Límite de Almacenamiento del Gist:** GitHub limita los archivos individuales de Gist a un máximo de 1MB. Con un crecimiento estimado de \~3 nuevos repositorios válidos detectados al día, esto garantiza aproximadamente **2 años de historial continuo** antes de necesitar implementar compresión o paginación.  
* **Marcas de Tiempo Iniciales:** Tras la primera inicialización, todos los repositorios existentes heredarán el mismo timestamp de first\_seen. El rastreo y diferenciación cronológica empezará normalmente a partir de la segunda ejecución del script.

## **📝 Licencia**
Pensando...

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# **🐙 RepoWall — GitHub Trending Aggregator**

⚡ **Discover the hottest GitHub repositories before everyone else does.**

RepoWall is a read-only public aggregator that surfaces new and viral GitHub projects automatically, sorted by **star velocity** — the only metric that truly captures groundbreaking projects. No accounts, no database, no backend. Just signal.

<img width="1392" height="941" alt="{741BE3D3-FCDE-464E-B745-A0573783BACB}" src="https://github.com/user-attachments/assets/cfb943a7-6790-47df-b8ed-2b54ab4d7e8e" />


## **⚙️ How It Works**

RepoWall is split into two independent pieces:

### **1\. 🌐 The Data Pipeline (repowall-infra)**

A GitHub Actions workflow that runs **once a day at 08:00 UTC**.

* **Intelligent Querying:** It queries the GitHub Search API in parallel with three carefully tuned queries.  
* **Spam & Inflation Filter:** It filters out spam and artificially inflated repos.  
* **Database-less Storage:** Writes the results to a private GitHub Gist as a JSON snapshot. This Gist is the database. It grows over time, accumulating a permanent historical record. If you shut down the frontend app tomorrow, your data survives.

### **2\. 💻 The Frontend App**

A React \+ Vite app that reads the Gist at load time and renders the repos in a responsive masonry wall. Fully static, deployable anywhere (**Vercel**, Netlify, Cloudflare Pages) with zero hosting costs.

## **🔍 Discovery Queries**

Three GitHub Search API queries run in parallel on every daily update to capture projects at different life stages:

| Target Signal | API Query Structure | Purpose |
| :---- | :---- | :---- |
| **💥 Immediate Explosion** | stars:\>500 created:\>2025-01-01 forks:\>50 size:\>200 | New projects born in 2025 that already exploded |
| **📈 Early Traction** | stars:\>100 created:\>last 3 months forks:\>20 size:\>200 | Recent projects with solid early traction |
| **🌱 Emerging Radar** | stars:50..500 created:\>last 3 months forks:\>10 size:\>200 | Emerging projects before everyone knows them (where the real gold is) |

## **🛡️ Quality & Spam Filters**

Raw GitHub trending data is noisy. Star farming is real and widespread. RepoWall applies strict filters before anything enters the Gist:

### **🤖 Fork Ratio Filter**

![][image1]Legitimate projects rarely exceed a 40% fork-to-star ratio. Repos above this threshold are systematically inflated — bots star but don't fork. This single rule eliminates the most egregious spam from the feed.

### **📦 Size Filter**

* By applying size:\>200 in the queries, we exclude pure README repos with no real code. A project with substance has at least 200KB of content.

## **📊 Sorting — Star Velocity**

Repos are sorted client-side by **stars per day since creation**:

velocity \= stargazers\_count / Math.max(age\_in\_days, 1\)

🎯 **Mural Philosophy:** A repo with **10k stars in 30 days** is infinitely more disruptive and interesting than one with **100k stars accumulated over 2 years**. This surfaces genuinely new, exploding projects at the top regardless of their absolute star count.

## **🎴 Anatomy of a Card (RepoCard)**

Each card displays a comprehensive set of analytical signals directly mapped from the GitHub API:

\+---------------------------------------------------------+  
|  🐙 username / repository-name                      🔗   | \-\> Direct link to GitHub  
|  Beautifully detailed app description text...           | \-\> Muted if empty  
|                                                         |  
|  \[● TypeScript\]                                         | \-\> Badge with official color  
|  ⭐ 12.4k     🔀 1.2k     👁️ 342                        | \-\> Key stats (Real watchers)  
|  \[web\] \[react\] \[vite\] \[+2 more\]                         | \-\> Topic list (max 4 visible)  
|  \-----------------------------------------------------  |  
|  🕒 Pushed 2 hours ago                                  | \-\> Code activity signal  
|  📅 Created 2 weeks ago                                 | \-\> Project age  
|  ⚡ Discovered 3 days ago                                | \-\> First seen on RepoWall  
\+---------------------------------------------------------+

*✨ **Visual Feedback:** Card borders glow with a subtle dynamic outline in their primary language color on hover. Repos without a defined language get a sleek white border.*

## **🏗️ Architecture Setup**

     ┌────────────────────────┐  
     │   GitHub Search API    │  
     └───────────┬────────────┘  
                 │  
                 ▼  (Daily Cron Run)  
     ┌────────────────────────┐  
     │  GitHub Actions Infra  │ ──► Fork ratio filter (≤ 0.40)  
     └───────────┬────────────┘  
                 │  
                 ▼  (Automated Upsert)  
     ┌────────────────────────┐  
     │ GitHub Gist (JSON DB)  │ ──► Serverless persistent record  
     └───────────┬────────────┘  
                 │  
                 ▼  (Fetch on Mount)  
     ┌────────────────────────┐  
     │   React Frontend       │ ──► Sorts by Star Velocity  
     └───────────┬────────────┘     ──► Filter by Language / Stars / Forks  
                 │  
                 ▼  (Static Deploy)  
     ┌────────────────────────┐  
     │   Vercel / Edge Host   │  
     └────────────────────────┘

## **🚀 Setup & Installation**

### **1\. Infrastructure Secrets (repowall-infra)**

Add these to your **GitHub Repository Secrets**:

| Secret Key | Description | Required Value |
| :---- | :---- | :---- |
| GIST\_ID | The unique ID of your storage Gist. | The ID from your private Gist URL. |
| GIST\_TOKEN | Security authentication token. | Personal Access Token (PAT) with gist \+ public\_repo scopes. |

### **2\. Frontend Environment Variables**

To link your React app securely with your data Gist without exposing it in your public repository commits, configure this variable in your .env.local or Vercel dashboard:

VITE\_API\_URL=\[https://gist.githubusercontent.com/\](https://gist.githubusercontent.com/){your\_username}/{gist\_id}/raw/repowall.json

## **🛠️ Tech Stack**

* **Data Pipeline:** Node.js 24 & GitHub Actions  
* **Storage Core:** GitHub Gist (JSON persistence)  
* **Frontend Layers:** React 18, Vite & TypeScript  
* **Styling & UI:** Tailwind CSS v4 & custom shadcn/ui components  
* **Dynamic Layout:** Responsive Masonry with DOM measurement \+ height cache  
* **Dates & Timing:** Relative formatting with date-fns  
* **Icons Package:** Lucide React  
* **Hosting:** Vercel (Optimized static hosting)

## **⚠️ Known Limitations**

* **Star Farming Detection:** The fork ratio filter catches most automated operations but highly sophisticated farms can evade it.  
* **Gist Storage Limit:** GitHub limits individual Gist files to 1MB. At our current growth rate of \~3 new repos/day, this gives roughly **2 years of runtime** before needing data compression or pagination.  
* **Initial Discovery Timestamps:** On the very first run, all repos will receive the same first\_seen timestamp. Timestamps will differentiate normally starting from day two.

## **📝 License**
Thinking...
