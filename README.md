# Koinonia (κοινωνία)

> *Greek: "sharing in common, fellowship"*

**Shop smarter, together.**

Koinonia enables parallel grocery shopping - multiple people can shop the same list simultaneously, marking items as they find them. Real-time peer-to-peer synchronization means everyone sees updates instantly, making household shopping more efficient.

## Why Koinonia?

**The Problem:** Traditional shopping lists are sequential - one person shops while others wait, or you split the list manually and hope you don't duplicate purchases.

**The Solution:** Share a single list, shop in parallel across different store sections (or different stores!), and watch items get checked off in real-time as your household/roommates/friends find them.

## Features

- 🔄 **Real-time P2P Sync** - No central server, your data stays on your devices
- 🏃 **Parallel Shopping** - Multiple people shop simultaneously from the same list
- ✅ **Instant Updates** - Check off items and everyone sees it immediately
- 📱 **Share via Link** - Send a deep link to join your list
- 🔌 **Offline-First** - Works without internet, syncs when reconnected
- 🔒 **Privacy-Focused** - No tracking, no accounts, no data collection
- 🆓 **100% FOSS** - Licensed under AGPLv3

## Perfect For

- **Households** splitting up grocery runs between store sections
- **Roommates** coordinating shopping without overlap
- **Couples** where one shops while the other remembers items
- **Groups** buying supplies for events or trips

## Technology

Built with:
- **Yjs** - CRDT for conflict-free synchronization
- **WebRTC** - Direct peer-to-peer connections
- **Ionic + Capacitor** - Cross-platform mobile framework
- **React** - UI component architecture

## Installation

Available on [F-Droid](https://f-droid.org) (coming soon)

Or build from source:
```bash
git clone https://github.com/yourusername/koinonia.git
cd koinonia
npm install
npm run build
npx cap sync
```

## How It Works

1. **Create a list** - Generate a unique room ID
2. **Share the link** - Send to anyone you want to shop with
3. **Shop together** - Everyone sees real-time updates
4. **No coordination needed** - Items are automatically marked when found

The magic: **CRDT (Conflict-free Replicated Data Types)** ensures that concurrent edits (like two people checking off different items simultaneously) merge automatically without conflicts.

## Philosophy

Koinonia embodies the FOSS principle of *true* peer-to-peer collaboration - no intermediaries, no surveillance, just people working together efficiently. Your grocery list shouldn't need a corporation's server.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

AGPLv3 - See [LICENSE](LICENSE) for details.

## Etymology

*Koinonia* (κοινωνία) - From ancient Greek, meaning "sharing in common" or "fellowship." Used historically to describe communities pooling resources and working together. Perfect for a collaborative shopping app that enables true peer-to-peer sharing.

---

**Made with ❤️ for efficient households everywhere**