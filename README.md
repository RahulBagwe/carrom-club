# Carrom Club — Deploy & Run Guide

## 1. Run Locally (with Live 1v1 Online Rooms)
```bash
npm install
npm start
```
Then open `http://localhost:3000` in your browser! Click **Online 1v1 -> Create Room** and share the invite link (`?room=XXXXXX`) with a friend.

## 2. Deploy Live for Free (Online 1v1 + PWA)
Push this folder to GitHub, then connect the repo to **Render**, **Railway**, or **Fly.io** as a Node.js web service (`npm install` / `npm start`). Both HTTP static hosting and WebSockets work out of the box.

## 3. Install as Mobile App (PWA)
Once hosted on HTTPS, open the site in Chrome (Android) or Safari (iOS) and tap **Add to Home Screen** to install Carrom Club as a full-screen offline-ready app.
