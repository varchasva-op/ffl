# Football Friday League — Live Auction Platform

## Project structure

```text
ffl-auction-platform/
├── README.md
├── .gitignore
├── package.json
├── package-lock.json
├── vercel.json
├── frontend/
│   ├── .env.example                 # Public API/socket URLs only
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types.ts
│       ├── vite-env.d.ts
│       ├── context/AuthContext.tsx
│       ├── lib/api.ts
│       ├── lib/socket.ts
│       └── components/
│           ├── AdminAuctionDashboard.tsx
│           ├── AuthPanel.tsx
│           ├── AuctionRoom.tsx
│           ├── ImageUpload.tsx
│           ├── PlayerCard.tsx
│           ├── PlayerDashboard.tsx
│           ├── PlayerDirectory.tsx
│           └── TeamManager.tsx
└── backend/
    ├── .env.example                 # Copy to .env locally; never commit secrets
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app.ts
        ├── server.ts
        ├── config/
        │   ├── db.ts
        │   └── imagekit.ts
        ├── controllers/
        │   ├── auth.controller.ts
        │   ├── auction.controller.ts
        │   ├── player.controller.ts
        │   ├── team.controller.ts
        │   └── upload.controller.ts
        ├── middleware/
        │   ├── auth.ts
        │   ├── errorHandler.ts
        │   └── upload.ts
        ├── models/
        │   ├── Auction.ts
        │   ├── Player.ts
        │   ├── Team.ts
        │   ├── Transaction.ts
        │   └── User.ts
        ├── routes/
        │   ├── auth.routes.ts
        │   ├── auction.routes.ts
        │   ├── player.routes.ts
        │   ├── team.routes.ts
        │   ├── transactions.routes.ts
        │   └── upload.routes.ts
        ├── services/
        │   ├── auction.service.ts
        │   ├── auth.service.ts
        │   ├── httpError.ts
        │   ├── imagekit.service.ts
        │   └── seed.service.ts
        ├── socket/index.ts
        ├── types/express.d.ts
        └── scripts/
            ├── seedAdmin.ts
            └── seedDemo.ts
```

## Credentials: the one file you edit

`backend/.env.example` is the credential template. Copy it to `backend/.env` for local work, then fill in your Atlas URI, ImageKit values, JWT secret, and admin email/password. The actual `.env` is ignored by Git. On Vercel/your Node host, add the same values in the host's Environment Variables settings rather than uploading `.env`.

`frontend/.env.example` is deliberately limited to public URLs (`VITE_API_URL` and `VITE_SOCKET_URL`). **Never** put a MongoDB URI, ImageKit private key, or JWT secret in a `VITE_` variable or frontend file.

## Local development

1. Copy `backend/.env.example` → `backend/.env` and set the private values.
2. Copy `frontend/.env.example` → `frontend/.env.local`. Leave the two URL values blank for local development; Vite proxies `/api` and `/socket.io` to `http://localhost:4000`.
3. From the project root:

   ```bash
   npm install
   npm run dev
   ```

   Frontend: `http://localhost:5173` · backend REST + Socket.IO: `http://localhost:4000`.

The backend bootstraps the first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` and idempotently seeds 10 demo players, three example franchises, and a Messi opening lot. You can also run `npm run seed:admin` or `npm run seed:demo` from the root; both scripts are safe to repeat.

## Deployment

- **Frontend — Vercel:** Import this repository with the repository root as the project root. `vercel.json` builds the Vite app and applies an SPA fallback. Add `VITE_API_URL=https://YOUR-NODE-BACKEND-HOST` and `VITE_SOCKET_URL=https://YOUR-NODE-BACKEND-HOST` under Vercel → Project Settings → Environment Variables, then redeploy.
- **Backend — persistent Node host:** Deploy the `backend` workspace to Render, Railway, Fly.io, or another long-running Node.js host. Build command: `npm run build`; start command: `npm start`. Add the variables from `backend/.env.example` as private environment variables. `FRONTEND_URL` must include the exact Vercel origin; for previews, use a comma-separated allowlist.
- **MongoDB Atlas:** Create a database user and database, set `MONGODB_URI` and `MONGODB_DB` on the backend host, and allow network access from that host. The auction's multi-document sale and team-deletion operations use MongoDB transactions, so use a replica-set deployment such as Atlas.
- **ImageKit:** Set `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, and optionally `IMAGEKIT_FOLDER` on the backend host. The photo input posts multipart data to Express; the server uploads it to ImageKit, then saves the returned URL and file id in the player's MongoDB record (`photoUrl`, `imageKitFileId`). The private key never reaches the browser.
- **JWT/admin:** Set a long random `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Admin self-registration is disabled; the configured bootstrap admin is created on backend startup.

The Socket.IO server must run on a persistent Node host; Vercel serves the React frontend only. The app uses the configured backend host for both REST and WebSocket traffic.

## Included functionality

- JWT login and protected admin/player routes; public player/scouting and auction views.
- Admin auction controls: start a lot, final call, end/transfer winner, or mark unsold.
- Socket.IO broadcasts auction, player, team, and transaction updates to connected clients.
- Optimistic-version bidding, supported increments, purse checks, roster caps, and transactional sale assignment.
- Admin full team CRUD. Deleting a club clears its live bids, releases signed players to the unsold pool, and preserves the transaction ledger.
- Player dashboard with editable profile details, read-only auction status, and ImageKit upload.
- Mongoose persistence for User, Player, Team, Auction, and Transaction records.
- Git-safe environment templates, local Vite proxy, and Vercel SPA configuration.
