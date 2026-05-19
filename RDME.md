# ScreenerAI — Company Screener

A full-stack prototype that lets you browse companies, filter by sector, and ask AI-powered questions about any company — answered live by **Llama 3.3-70b** via the **Groq API**.

---

## What Works

- ✅ Spring Boot REST API (`/api/companies`, `/{id}`, `/{id}/ask`, `/sectors`)
- ✅ PostgreSQL database with 30 seeded companies via Flyway migrations
- ✅ Server-side pagination, search, and sector filtering
- ✅ Angular 18 frontend with standalone components and Signals
- ✅ Company list with live search + sector filter pills
- ✅ Company detail page with full profile
- ✅ AI chat with full conversation history (ChatGPT-style thread)
- ✅ Input cleared after each message; chat scrolls to the latest message
- ✅ Suggested one-click questions shown when chat is empty
- ✅ Loading indicator (animated dots) while AI responds
- ✅ Error messages shown inline inside the chat thread
- ✅ Docker Compose setup (backend + PostgreSQL + Angular/Nginx)
- ✅ Angular production build passes (`npm run build:prod`)

## What Is Not Implemented

- ❌ User authentication (would add Spring Security + JWT)
- ❌ Add / edit companies via a UI form
- ❌ Watchlist with `localStorage`
- ❌ Sector breakdown chart
- ❌ Rate limiting on the AI endpoint
- ❌ Backend unit/integration tests (`mvn test` could not run — Maven not available in this environment)
- ❌ Frontend `.spec.ts` tests

---

## Tech Stack

| Layer    | Technology                                 |
|----------|--------------------------------------------|
| Frontend | Angular 18, Standalone Components, Signals |
| Backend  | Spring Boot 3, Java 17, Spring Data JPA    |
| Database | PostgreSQL 16, Flyway migrations           |
| AI       | Groq API · `llama-3.3-70b-versatile`       |
| DevOps   | Docker, Docker Compose, Nginx              |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Browser (Angular 18)                │
│  Company List ──► Company Detail ──► AI Chat Thread  │
└─────────────────────────┬────────────────────────────┘
                          │  HTTP/JSON
┌─────────────────────────▼────────────────────────────┐
│              Spring Boot Backend (:8080)             │
│  CompanyController → CompanyService → CompanyRepo    │
│                    → AiService → Groq API            │
└────────────────┬─────────────────────────────────────┘
                 │  JPA/JDBC (Flyway)
┌────────────────▼──────┐     ┌──────────────────────┐
│   PostgreSQL (:5432)  │     │   Groq Cloud API     │
│   companies table     │     │   llama-3.3-70b      │
└───────────────────────┘     └──────────────────────┘
```

---

## Prerequisites

- Java 17+
- Maven 3.9+
- Node 20+ & npm
- PostgreSQL 16 (or Docker)
- A free [Groq API key](https://console.groq.com)

---

## Environment Variables

| Variable                | Description                           | Default                                          |
|-------------------------|---------------------------------------|--------------------------------------------------|
| `GROQ_API_KEY`          | Groq API key (**required**)           | —                                                |
| `DATABASE_URL`          | PostgreSQL JDBC URL                   | `jdbc:postgresql://localhost:5432/companyscreener` |
| `DATABASE_USERNAME`     | Database user                         | `postgres`                                       |
| `DATABASE_PASSWORD`     | Database password                     | `postgres`                                       |
| `CORS_ALLOWED_ORIGINS`  | Allowed frontend origin(s)            | `http://localhost:4200`                          |

---

## Running with Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/you/company-screener.git
cd company-screener

# 2. Create your .env file
cp .env.example .env
# Edit .env → set GROQ_API_KEY=gsk_...

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:8081
# Backend  → http://localhost:8080
```

> **Note:** The frontend Docker image runs on port **8081** (not 80) to avoid conflicts.
> Both URLs are added to `CORS_ALLOWED_ORIGINS` automatically when using `.env.example`.

### Why Docker Compose works

The `backend` service receives `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`
as environment variables — exactly the names read by `application.properties`.
The URL uses the Docker network hostname `postgres` (not `localhost`), so the
backend reaches the database container correctly.

---

## Running Locally (without Docker)

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE companyscreener;"
```

### 2. Backend

```bash
# Windows
set GROQ_API_KEY=gsk_your_key_here
set DATABASE_PASSWORD=postgres

# macOS / Linux
export GROQ_API_KEY=gsk_your_key_here
export DATABASE_PASSWORD=postgres

cd backend
mvn spring-boot:run
# API available at http://localhost:8080
```

Flyway runs automatically on startup and applies all three migrations:
- `V1__init_schema.sql` — creates the `companies` table
- `V2__seed_companies.sql` — inserts 30 companies
- `V3__company_search_indexes.sql` — adds trigram + pagination indexes

### 3. Frontend

```bash
cd frontend
npm install
npm start
# App available at http://localhost:4200
```

A dev proxy (`proxy.conf.json`) forwards `/api/**` to `http://localhost:8080`,
so no CORS issues during local development.

---

## API Endpoints

| Method | Endpoint                       | Description                              |
|--------|--------------------------------|------------------------------------------|
| GET    | `/api/companies`               | Paginated list (search, sector, page)    |
| GET    | `/api/companies/sectors`       | List of distinct sectors                 |
| GET    | `/api/companies/{id}`          | Full company detail                      |
| POST   | `/api/companies/{id}/ask`      | Ask AI a question about a company        |

### Query Parameters — `GET /api/companies`

| Parameter | Type    | Default | Description                        |
|-----------|---------|---------|------------------------------------|
| `page`    | integer | `0`     | Zero-based page index              |
| `size`    | integer | `12`    | Items per page (max 100)           |
| `search`  | string  | `""`    | Filter by name (trigram search)    |
| `sector`  | string  | `""`    | Filter by exact sector             |

### Example: Ask AI

```http
POST /api/companies/1/ask
Content-Type: application/json

{
  "question": "What is the business model of this company?"
}
```

```json
{
  "answer": "Stripe operates as a payment infrastructure provider, charging a percentage fee per transaction processed through its platform..."
}
```

---

## Project Structure

```
company-screener/
├── backend/
│   ├── src/main/java/com/example/companyscreener/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic + AI integration
│   │   ├── repository/     # Spring Data JPA repositories
│   │   ├── entity/         # JPA entities
│   │   ├── dto/            # CompanyListItemDto (list) + CompanyDto (detail)
│   │   ├── config/         # CORS, RestTemplate (with timeouts)
│   │   └── exception/      # Global exception handling
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/
│           ├── V1__init_schema.sql
│           ├── V2__seed_companies.sql   # 30 companies
│           └── V3__company_search_indexes.sql
│
├── frontend/
│   └── src/app/
│       ├── models/         # TypeScript interfaces (Company, ChatMessage, …)
│       ├── services/       # HttpClient service with request cancellation
│       ├── pages/
│       │   ├── company-list/    # Browse + filter + paginate companies
│       │   └── company-detail/  # Detail view + AI conversation thread
│       └── components/
│           └── company-card/    # Reusable card with OnPush
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Key Technical Choices

### Backend

| Choice | Reason |
|--------|--------|
| Spring Boot + Spring Data JPA | Standard Java REST stack; minimal boilerplate |
| Flyway migrations | Deterministic, versioned schema — safer than `spring.jpa.ddl-auto=create` |
| `CompanyListItemDto` (no `description`) | List endpoint omits heavy text field; full description returned only on detail |
| `PagedResponse<T>` wrapper | Decouples API from Spring's `Page<>` JSON shape |
| Groq + Llama 3.3-70b | Fast, free tier, excellent quality for Q&A |
| RestTemplate timeouts | Prevents the AI endpoint from blocking threads indefinitely |
| Single CORS config (`WebConfig`) | Removed a second `CorsConfig` bean that caused conflicting behavior |

### Frontend

| Choice | Reason |
|--------|--------|
| Angular Signals | Reactive state without NgRx; `ChangeDetectionStrategy.OnPush` on all components |
| `switchMap` + `debounce` | Cancels in-flight requests on rapid input; prevents stale-result overwrites |
| Page cache (`Map<string, Page>`) | Instant navigation to cached pages; next-page prefetch after each load |
| Chat history signal (`ChatMessage[]`) | Full conversation thread per company; mirrors ChatGPT/DeepSeek UX |
| Input cleared on send | Message pushed to history first, then input cleared — standard chatbot pattern |
| Server-side filtering | Search and sector params sent to the backend; all pages are filtered correctly |
| Angular dev proxy | `/api` requests forwarded to `:8080` — no CORS issues during local dev |

---

## Seeded Companies (30 total)

| Company      | Sector                  | Country     |
|--------------|-------------------------|-------------|
| Stripe       | FinTech                 | USA         |
| Spotify      | Media & Entertainment   | Sweden      |
| Tesla        | Automotive & Energy     | USA         |
| Airbnb       | Travel & Hospitality    | USA         |
| Shopify      | E-Commerce              | Canada      |
| OpenAI       | Artificial Intelligence | USA         |
| Klarna       | FinTech                 | Sweden      |
| Canva        | Design & SaaS           | Australia   |
| Google       | Technology              | USA         |
| Microsoft    | Technology              | USA         |
| Apple        | Technology              | USA         |
| Amazon       | E-Commerce & Cloud      | USA         |
| Meta         | Social Media            | USA         |
| PayPal       | FinTech                 | USA         |
| Revolut      | FinTech                 | UK          |
| Salesforce   | CRM & SaaS              | USA         |
| Notion       | Productivity            | USA         |
| Atlassian    | Software                | Australia   |
| Nvidia       | Semiconductors          | USA         |
| Palantir     | Data Analytics          | USA         |
| Databricks   | AI & Data               | USA         |
| SAP          | Enterprise Software     | Germany     |
| Figma        | Design Software         | USA         |
| Discord      | Communication           | USA         |
| GitHub       | Developer Tools         | USA         |
| LinkedIn     | Professional Network    | USA         |
| Uber         | Mobility                | USA         |
| Bolt         | Mobility                | Estonia     |
| Booking.com  | Travel                  | Netherlands |
| Snowflake    | Cloud & Data            | USA         |

---

## AI Tools Used

- **Claude (Anthropic)** — assisted with architecture decisions, optimization review, and code generation throughout the project.

---

## Future Improvements

- [ ] User authentication (Spring Security + JWT)
- [ ] Add / edit companies via UI form
- [ ] Watchlist with `localStorage` persistence
- [ ] Sector breakdown pie chart (Chart.js)
- [ ] Light / dark theme toggle
- [ ] Pagination for very large datasets (cursor-based)
- [ ] Rate limiting on the AI endpoint
- [ ] Backend unit tests (JUnit 5 + Mockito)
- [ ] Frontend component tests (Jasmine / Jest)
- [ ] Export company report as PDF

---

## License

MIT — free to use and modify.
