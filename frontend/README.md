# Adaptive Secure Data Transmission Dashboard - React Frontend

This is the research-grade Security Operations Center (SOC) / Network Operations Center (NOC) dashboard designed to monitor and control the ESP8266 lightweight blockchain mesh network.

## Requirements

- Node.js 18.x or higher
- NPM 9.x or higher

## Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

## Running the Application

Start the Vite dev server on port `3000`:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

## Features

1. **Sleek SIEM/SOC Theme**: Built using a premium dark navy color scheme, custom typography (Outfit and Inter), glowing highlights, and micro-interactions fit for cybersecurity evaluations.
2. **Dynamic Live SVG Topology**: Visually traces HELLO beacons, mesh data packets, replay/tampered attack vectors, and blockchain validation checkmarks. Blacklisted nodes turn red and dynamically lose links.
3. **Interactive Serial Monitor**: Aggregates continuous JSON feeds and raw debug bytes from nodes. Supports logs pausing, clear buffers, regex searching, event filters, and JSON log downloads.
4. **Escalation Timeline**: Animates the security threat progression lifecycle (Standard Mesh -> Attack -> Firewall Drop -> Blockchain Activate -> Node Isolation).
5. **Ledger Visualizer**: Renders block height, mining statistics, blocks verification metrics, and chronological block cards. Includes a client-side chain integrity validation engine that re-implements the ESP8266's djb2 hash.
6. **Analytics charts**: Recharts visualizing packets traffic volume, latency jitter, trust progression, and node multi-hop relay count.
7. **Audit PDF/CSV Reports**: Provides downloadable reporting worksheets.
