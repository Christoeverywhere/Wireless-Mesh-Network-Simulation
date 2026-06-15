# Master Run & Deployment Guide

This guide details how to compile, flash, and run the **Adaptive Secure Data Transmission in a Wireless Mesh Network Using Event-Triggered Lightweight Blockchain on ESP8266** system, including the FastAPI backend and React SOC Dashboard.

---

## 🛠️ Hardware Setup & Flashing ESP8266 NodeMCUs

The physical system uses three ESP8266 NodeMCU boards representing **Node A**, **Node B**, and **Node C**.

### 1. WiFi Hotspot Configuration
The ESP8266 firmware is configured to connect to a WiFi hotspot. Set up a mobile hotspot or router with the following credentials:
- **SSID**: `Meshdemo`
- **Password**: `bingbong`

*(If you want to use a different network, update lines 4 & 5 in the Arduino sketch `lightweight-blockchain-mesh-main/Light-Blockchain-MeshNetworkproject.ino` before flashing).*

### 2. Flashing the Boards
Open `lightweight-blockchain-mesh-main/Light-Blockchain-MeshNetworkproject.ino` in the Arduino IDE and flash each board with the configuration below:

| Board | Node ID (Line 13) | Attack Mode (Line 14) | Role in System |
| :--- | :--- | :--- | :--- |
| **Node A** | `String NODE_ID = "A";` | `bool ENABLE_ATTACK = false;` | Regular Mesh Node (Receiver & Miner) |
| **Node B** | `String NODE_ID = "B";` | `bool ENABLE_ATTACK = false;` | Regular Mesh Node (Receiver & Miner) |
| **Node C** | `String NODE_ID = "C";` | `bool ENABLE_ATTACK = true;` | Attacker Node (Simulates Malicious Injection) |

*Instructions:*
1. Connect Board 1, set `NODE_ID` to `"A"` and `ENABLE_ATTACK` to `false`, then flash.
2. Connect Board 2, set `NODE_ID` to `"B"` and `ENABLE_ATTACK` to `false`, then flash.
3. Connect Board 3, set `NODE_ID` to `"C"` and `ENABLE_ATTACK` to `true`, then flash.

---

## 🚀 Orchestrating the Full-Stack Application

The dashboard operates in two modes:
- **Simulated Demo Mode**: Runs out-of-the-box without hardware attached. Allows testing all features (attacks, firewall drops, blockchain escalation, node isolation).
- **Physical Hardware Mode**: Connects to the ESP8266 nodes via USB COM ports and processes real-time serial logs and packets.

### Step 1: Run the FastAPI Backend
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   python main.py
   ```
   *(The API will start at `http://localhost:8000` and the WebSocket at `ws://localhost:8000/ws`)*

### Step 2: Run the React Dashboard
1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

---

## 🛡️ Demonstration Walkthrough Sequence

For academic evaluations and project showcases, follow this sequence:

1. **Stable Initialization (Normal Mesh Mode)**
   - Boot the backend and frontend. The top status bar will display **NORMAL MESH MODE** and **LOW** threat level.
   - The SVG topology shows Node A, B, and C with green pulsing links exchanging packets.
   - The Blockchain status displays **INACTIVE**.

2. **Intrusion Injection**
   - Go to the **Attack Simulator** tab.
   - Select **Inject Tampered Packet** (Simulates Node C sending anomalous sensor data `MALICIOUS_TEMP=99C` and corrupt previous hash).
   - In **Hardware Mode**, Node C physically broadcasts this over UDP; in **Demo Mode**, the backend simulator takes care of it.

3. **Intrusion Quarantine & Firewall Drop**
   - The Firewall matches the malicious hash.
   - The threat level jumps to **HIGH**.
   - The logs in the **Serial Monitor** print: `[FIREWALL] Intrusion detected from Node C! Packet dropped. Threat Type: tampered_packet`.

4. **Distributed Event Blockchain Activation**
   - The security escalation triggers the distributed blockchain mode. The top status bar shifts to **SECURE BLOCKCHAIN MODE**.
   - The system generates the **Genesis Block** (`GENESIS_SECURITY_ESC_BLOCK`) and broadcasts it.
   - The dashboard ledger tab updates to show the Genesis block blockcard in blue.
   - Subsequent mesh data transmissions are encrypted/chained, and nodes perform consensus checks.

5. **Cryptographic Validation & Logical Isolation**
   - In the ledger tab, click **Validate Chain**. The system will perform client-side djb2 hash evaluations across the ledger blocks.
   - If Node C attempts further tampered block submissions, the consensus rejects the block, increments Node C's malicious count, and drops its trust score.
   - Once Node C's malicious count reaches `2`, the system triggers logical node isolation:
     - Log: `[LOGICAL ISOLATION] Node C logically isolated from network mesh`.
     - In the **Live Topology**, Node C turns red, and all its active routing links disappear.
     - Node C is now blacklisted and cannot communicate with the mesh.
