# Adaptive Secure Data Transmission Backend - FastAPI

This is the backend server that coordinates the ESP8266 lightweight blockchain mesh network and broadcasts the network activities to the React dashboard over WebSockets.

## Requirements

- Python 3.9 or higher
- PySerial (for USB COM port communication)
- WebSockets
- FastAPI
- Uvicorn

## Installation

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/macOS
   # Or on Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the FastAPI application on port `8000`:

```bash
python main.py
```

Or run via Uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Features

1. **Auto COM Port Detection**: Periodically polls USB COM ports using PySerial.
2. **WebSocket Integration**: Automatically broadcasts ESP8266 events (`packet_sent`, `attack_detected`, `blockchain_activated`, etc.) to all connected clients.
3. **Mock Simulator Engine**: If real ESP8266 modules are not attached, the backend triggers an interactive simulation that replicates regular mesh packets, attack sequences, intrusion reports, and subsequent blockchain defense/isolation triggers.
4. **REST APIs**: Provides endpoints to toggle state, inject attacks, connect/disconnect serial ports, and generate research audit reports.
