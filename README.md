# ScreenerAI — Company Screener

A full-stack prototype that lets you browse companies, filter by sector, and ask
AI-powered questions about any company — answered live by **Llama 3.3-70b** via
the **Groq API**.

---

## Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | Angular 18, Standalone Components, Signals |
| Backend    | Spring Boot 3, Java 17, Spring Data JPA    |
| Database   | PostgreSQL 16                              |
| AI         | Groq API · llama-3.3-70b-versatile         |
| DevOps     | Docker, Docker Compose, Nginx              |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Browser (Angular 18)                │
│  Company List ──► Company Detail ──► AI Chat Box     │
└─────────────────────────┬────────────────────────────┘
                          │  HTTP/JSON
┌─────────────────────────▼────────────────────────────┐
│              Spring Boot Backend (:8080)             │
│  CompanyController → CompanyService → CompanyRepo    │
│                    → AiService → Groq API            │
└────────────────┬─────────────────────────────────────┘
                 │  JPA/JDBC
┌────────────────▼──────┐     ┌──────────────────────┐
│   PostgreSQL (:5432)  │     │   Groq Cloud API     │
│   companies table     │     │   llama-3.3-70b      │
└───────────────────────┘     └──────────────────────┘
```

---

## Features

- **Company List** — responsive card grid with live search and sector filter pills
- **Company Detail** — full profile with founded year and employee count
- **AI Question Box** — ask anything about a company; answered by Llama 3.3
- **Suggested Questions** — one-click prompts to get started
- **Dark Mode UI** — polished design with Syne + DM Sans typography

---

## Prerequisites

- Java 17+
- Maven 3.9+
- Node 20+ & npm
- PostgreSQL 16 (or Docker)
- A free [Groq API key](https://console.groq.com)

---

## Environment Variables

| Variable       | Description                       | Default        |
|----------------|-----------------------------------|----------------|
| `GROQ_API_KEY` | Groq API key (**required**)       | —              |
| `DATABASE_URL` | PostgreSQL JDBC URL               | `jdbc:postgresql://localhost:5432/companyscreener` |
| `DATABASE_USERNAME` | Database user                | `postgres`     |
| `DATABASE_PASSWORD` | Database password            | `postgres`     |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origin(s) | `http://localhost:4200` |

---

## Running with Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/you/company-screener.git
cd company-screener

# 2. Set your Groq API key
cp .env.example .env
# Edit .env and set GROQ_API_KEY=gsk_...

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:80
# Backend  → http://localhost:8080
```

---

## Running Locally (without Docker)

### Backend

```bash
# Start PostgreSQL and create the database
psql -U postgres -c "CREATE DATABASE companyscreener;"

# Set environment variables
export GROQ_API_KEY=gsk_your_key_here
export DATABASE_PASSWORD=postgres

# Run the Spring Boot app
cd backend
mvn spring-boot:run
# API available at http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm start
# App available at http://localhost:4200
```

---

## API Endpoints

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/api/companies`             | List all companies                   |
| GET    | `/api/companies/sectors`     | List distinct company sectors        |
| GET    | `/api/companies/{id}`        | Get company by ID                    |
| POST   | `/api/companies/{id}/ask`    | Ask AI a question about a company    |

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
  "answer": "Stripe operates as a payment infrastructure provider, charging a percentage fee per transaction processed through its platform. It generates revenue primarily from payment processing, and additionally from its fraud detection, billing, and financial services products."
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
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── config/         # CORS, RestTemplate config
│   │   └── exception/      # Global exception handling
│   └── src/main/resources/
│       ├── application.properties
│       └── data.sql        # Seed data (8 companies)
│
├── frontend/
│   └── src/app/
│       ├── models/         # TypeScript interfaces
│       ├── services/       # HttpClient services
│       ├── pages/
│       │   ├── company-list/    # Browse + filter companies
│       │   └── company-detail/  # Detail view + AI chat
│       └── components/
│           └── company-card/    # Reusable card component
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Seeded Companies

| Company  | Sector                   | Country   |
|----------|--------------------------|-----------|
| Stripe   | FinTech                  | USA       |
| Spotify  | Media & Entertainment    | Sweden    |
| Tesla    | Automotive & Energy      | USA       |
| Airbnb   | Travel & Hospitality     | USA       |
| Shopify  | E-Commerce               | Canada    |
| OpenAI   | Artificial Intelligence  | USA       |
| Klarna   | FinTech                  | Sweden    |
| Canva    | Design & SaaS            | Australia |

---

## Future Improvements

- [ ] User authentication (Spring Security + JWT)
- [ ] Add / edit companies via UI form
- [ ] Watchlist with `localStorage` persistence
- [ ] Sector breakdown pie chart (Chart.js)
- [ ] Conversation history in the AI chat
- [ ] Export company report as PDF
- [ ] Light / dark theme toggle
- [ ] Pagination for large datasets
- [ ] Rate limiting on the AI endpoint

---

## License

MIT — free to use and modify.
