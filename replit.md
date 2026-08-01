# ParkEasy

A React + Vite web app for finding, booking, and navigating to parking spots using an interactive Leaflet map.

## How to run

```
npm run dev
```

The app runs on port 5000. The workflow **Start application** is configured and starts it automatically.

## Stack

- **Frontend:** React 18, Vite
- **Styling:** Tailwind CSS
- **Maps & Routing:** Leaflet, React-Leaflet, leaflet-routing-machine
- **State:** Zustand (persisted to localStorage)
- **Router:** React Router v6

## Routes

| Path | Description |
|---|---|
| `/` | Landing page (public) |
| `/login` | Login (redirects to `/main` if already logged in) |
| `/signup` | Sign up |
| `/main` | Main map screen (requires login) |
| `/driver` | Driver dashboard (requires login) |
| `/owner` | Owner dashboard (requires login) |
| `/create-slot` | Create a parking slot (requires login) |
| `/profile` | User profile (requires login) |

## Data

All data (users, bookings, parking slots, driver location) is stored in localStorage. There is no backend or external API — everything runs client-side.

## User preferences

_None recorded yet._
