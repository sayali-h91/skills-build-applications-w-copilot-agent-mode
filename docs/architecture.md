# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each route component responsible for its view and use the shared API client for requests and accessible loading, empty, and error states.
- Logic tier decision: Keep validation and capability behavior in the service layer; routes return service results and deliberate 4xx errors.
- Data tier decision: Enforce required fields and basic value constraints in Mongoose schemas; preserve seed upserts and unrelated records.
- Activity tracking approach: Validate IDs and existing user/team references, derive points from minutes, and persist a timestamped activity.
- Team management approach: Require a non-empty name and mascot, preserve member references, and return member IDs in list results.
- Leaderboard approach: Sum activity points by team and assign ranks in descending point order.
- Workout suggestions approach: Find the user by email, prefer workouts matching their goal or recent activity, and explain the recommendation.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` (schema validation or seed behavior)
- API command: `npm run test:api --prefix octofit-tracker/backend` (route/service contracts)
- Frontend command: `npm test --prefix octofit-tracker/frontend` (rendering and request states)
- Backend build command: `npm run build --prefix octofit-tracker/backend` (TypeScript errors)
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` (TypeScript or Vite build errors)
