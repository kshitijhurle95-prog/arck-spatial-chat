# Project Guidelines & Autonomous Obsidian Sync

## 🌌 NEBULA 2046 — Architecture & Maintenance Guidelines

This repository (`c:\Users\HP\Documents\antigravity\serene-meitner`) hosts **NEBULA 2046**, a futuristic real-time spatial communication platform.

### 🔄 Mandatory Obsidian Vault Synchronization Rule
Whenever any changes, bug fixes, features, refactors, schema modifications, or operational updates are made to this project:
1. **Always Update Obsidian**:
   Mirror and document all changes in the user's active Obsidian Vault at:
   `C:\Users\HP\Documents\Obsidian Vault\Projects\NEBULA 2046\`
2. **Relevant Documentation Notes**:
   - `00 - NEBULA 2046 Master Overview.md`: High-level vision, architecture diagram, ports, tech stack.
   - `01 - Design System & UI Engine.md`: Dual themes (light & dark), glassmorphism, Three.js 3D orb.
   - `02 - Real-Time Architecture & Socket.IO.md`: WebSocket events, typing indicators, room management.
   - `03 - WebRTC Audio & Video Calling Engine.md`: Signaling, STUN mesh, resilient virtual fallbacks.
   - `04 - Database, Prisma & Security Model.md`: SQLite schema, relations, seeds, auth.
   - `05 - AI Copilot & Synthetic Intelligence.md`: NEBULA AI v2046.4, summarization, tone rewrite.
   - `06 - Changelog, Bug Fixes & Diagnostics.md`: Record of fixes, edge-case resolutions, and diagnostics.
3. **Automated Sync Script**:
   Execute `C:\Users\HP\Documents\Obsidian Vault\scripts\sync_project_to_obsidian.ps1` to update timestamps and active process telemetry.

### 🛡️ Engineering & Quality Standards
- **Functional Before Decorative**: Do not introduce visual effects that hinder readability, composing, or accessibility.
- **Resilient Media**: Never call `getUserMedia` without the fail-safe `getResilientUserMedia` fallback. Never show blocking `alert()` popups for hardware device unavailability.
- **Pointer Events**: Ensure the root application container NEVER carries `pointer-events: none`.
- **Theme Consistency**: Maintain 100% geometric and structural parity between Light (Dawn Pastel) and Dark (Deep Space Cosmic) modes.
