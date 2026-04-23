
## Backend Setup

### Architecture

```
React Native (Expo) App
       ↓  HTTP (Axios)
Express.js REST API  (/backend)
       ↓  Mongoose ODM
MongoDB Atlas (cloud-hosted, free tier)
```

### Prerequisites

- **Node.js 18+** — [download](https://nodejs.org)
- **MongoDB Atlas account** (free tier) — [signup](https://www.mongodb.com/cloud/atlas/register)
- **npm** (comes with Node.js)

### Step-by-Step Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new **Free Tier** cluster (M0)
   - Click **Connect** → **Drivers** → **Node.js**
   - Copy the connection string
   - Replace `<username>`, `<password>`, and database name in your `.env`:
     ```
     MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/touristguide?retryWrites=true&w=majority
     ```
   - Under **Network Access**, whitelist your IP (or `0.0.0.0/0` for development)

5. **Set a JWT secret:**
   Generate a random secret and add it to `.env`:
   ```
   JWT_SECRET=your_long_random_string_here
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

### Running Both Frontend and Backend

Open **two terminals**:

| Terminal 1 (Backend)         | Terminal 2 (Frontend)    |
|------------------------------|--------------------------|
| `cd backend`                 | (project root)           |
| `npm run dev`                | `npx expo start`         |

The React Native app reads the API URL from `EXPO_PUBLIC_API_BASE_URL` in the root `.env` file.
For development, set it to: `http://<your-local-ip>:5000/api`

### API Endpoint Reference

#### Auth — `/api/auth`

| Method | Endpoint     | Auth  | Description                          |
|--------|-------------|-------|--------------------------------------|
| POST   | /register   | No    | Register new user → returns JWT      |
| POST   | /login      | No    | Login → returns JWT + user           |
| GET    | /me         | Yes   | Get current user profile             |
| PATCH  | /me         | Yes   | Update name, avatar, bio, language   |
| POST   | /logout     | Yes   | Blacklist token                      |

#### Translations — `/api/translations`

| Method | Endpoint     | Auth  | Description                          |
|--------|-------------|-------|--------------------------------------|
| POST   | /           | Yes   | Save translation to history          |
| GET    | /           | Yes   | Get paginated history                |
| DELETE | /:id        | Yes   | Delete single entry                  |
| DELETE | /           | Yes   | Clear all history                    |

#### Destinations — `/api/destinations`

| Method | Endpoint     | Auth  | Description                          |
|--------|-------------|-------|--------------------------------------|
| GET    | /           | No    | List all (filter by category/state)  |
| GET    | /featured   | No    | Featured destinations                |
| GET    | /nearby     | No    | Geospatial: ?lat=&lng=&radius=       |
| GET    | /search     | No    | Text search: ?q=                     |
| GET    | /:id        | No    | Single destination + reviews         |
| POST   | /           | Yes   | Create destination                   |

#### Reviews — `/api/reviews`

| Method | Endpoint          | Auth  | Description                      |
|--------|------------------|-------|----------------------------------|
| GET    | /destination/:id | No    | Reviews for a destination        |
| POST   | /destination/:id | Yes   | Create review                    |
| PATCH  | /:id             | Yes   | Edit own review                  |
| DELETE | /:id             | Yes   | Delete own review                |
| POST   | /:id/helpful     | Yes   | Upvote a review                  |

#### Saved Places — `/api/saved`

| Method | Endpoint          | Auth  | Description                      |
|--------|------------------|-------|----------------------------------|
| GET    | /                | Yes   | Get all saved places             |
| POST   | /:destinationId  | Yes   | Save a place                     |
| DELETE | /:destinationId  | Yes   | Unsave a place                   |
| PATCH  | /:destinationId  | Yes   | Update personal note             |

#### Health Check

```
GET /api/health  → { success: true, message: "TouristGuide API is running" }
```
