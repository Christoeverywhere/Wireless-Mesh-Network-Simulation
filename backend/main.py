import asyncio
import json
import logging
import random
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Try to import serial. If not installed, we can still run in demo mode.
try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    logger.warning("pyserial is not installed. Running in Demo Mode only.")

app = FastAPI(
    title="Adaptive Secure Data Transmission Mesh Network Backend",
    description="Research-grade monitoring and control platform for event-triggered lightweight blockchain on ESP8266",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# GLOBAL STATES
# -------------------------------------------------------------------------

class SystemState:
    def __init__(self):
        self.mode = "NORMAL MESH MODE"  # NORMAL MESH MODE, SECURE BLOCKCHAIN MODE
        self.connected_count = 0
        self.peer_discovery_status = "DISCOVERING"  # DISCOVERING, STABLE, INCOMPLETE
        self.threat_level = "LOW"  # LOW, MEDIUM, HIGH, CRITICAL
        self.firewall_status = True
        self.blockchain_status = "INACTIVE"  # INACTIVE, ACTIVE
        self.hotspot_status = "ONLINE"
        self.uptime_start = time.time()
        self.demo_mode = True  # Fallback/active simulation mode
        
        # Node statuses
        self.nodes = {
            "A": {
                "id": "A",
                "com_port": "COM5",
                "status": "connected",
                "ip": "192.168.4.2",
                "wifi_status": "connected",
                "last_seen": "",
                "trust_score": 100,
                "blockchain_height": 0,
                "blacklisted": False,
                "packets_sent": 0,
                "packets_received": 0,
                "relay_count": 0,
                "forward_count": 0,
                "bad_count": 0
            },
            "B": {
                "id": "B",
                "com_port": "COM8",
                "status": "connected",
                "ip": "192.168.4.3",
                "wifi_status": "connected",
                "last_seen": "",
                "trust_score": 100,
                "blockchain_height": 0,
                "blacklisted": False,
                "packets_sent": 0,
                "packets_received": 0,
                "relay_count": 0,
                "forward_count": 0,
                "bad_count": 0
            },
            "C": {
                "id": "C",
                "com_port": "COM10",
                "status": "connected",
                "ip": "192.168.4.4",
                "wifi_status": "connected",
                "last_seen": "",
                "trust_score": 100,
                "blockchain_height": 0,
                "blacklisted": False,
                "packets_sent": 0,
                "packets_received": 0,
                "relay_count": 0,
                "forward_count": 0,
                "bad_count": 0
            }
        }
        
        # Blockchain Ledger
        self.blockchain = {
            "status": "INACTIVE",
            "chain": [],
            "height": 0,
            "blocks_generated": 0,
            "blocks_verified": 0,
            "invalid_blocks_rejected": 0,
            "hash_verification_rate": 100.0,
            "ledger_size_kb": 0.0
        }
        
        # Firewall metrics
        self.firewall = {
            "status": True,
            "threat_counter": 0,
            "dropped_packets": 0,
            "inspected_packets": 0,
            "detection_rate": 99.4
        }
        
        # Attack simulation metrics
        self.attacks = {
            "active_attack": None,
            "total_attacks": 0,
            "blocked_attacks": 0,
            "detection_rate": 100.0,
            "threat_history": [],
            "attack_timeline": []
        }
        
        # Real-time Serial Logs
        self.logs = []
        
        # Serial ports currently monitored
        self.active_serial_connections = {}  # port -> Serial object
        self.detected_ports = []
        
    def add_log(self, node: str, event_type: str, message: str):
        log_entry = {
            "id": str(random.randint(100000, 999999)),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "node": node,
            "event_type": event_type,
            "message": message
        }
        self.logs.append(log_entry)
        if len(self.logs) > 500:
            self.logs.pop(0)
        return log_entry

    def update_uptime(self) -> int:
        return int(time.time() - self.uptime_start)

state = SystemState()

# Initialize last_seen timestamps
for node_id in state.nodes:
    state.nodes[node_id]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# -------------------------------------------------------------------------
# WEBSOCKET MANAGER
# -------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        # We handle sending concurrently to avoid slow clients blocking the loop
        if not self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
                
        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()

# Helper to send system alert & log in one go
async def register_event(node: str, event_type: str, message: str, broadcast_type: str = "system_alert"):
    log_entry = state.add_log(node, event_type, message)
    event_payload = {
        "event": broadcast_type,
        "data": log_entry,
        "system": {
            "mode": state.mode,
            "threat_level": state.threat_level,
            "blockchain_status": state.blockchain_status,
            "firewall_status": state.firewall_status,
            "connected_count": state.connected_count,
            "peer_discovery_status": state.peer_discovery_status,
        }
    }
    await ws_manager.broadcast(event_payload)

# -------------------------------------------------------------------------
# MOCK SIMULATOR ENGINE (Background Loop)
# -------------------------------------------------------------------------

# Helper to compute simple djb2 hash to match Arduino
def compute_simple_hash(input_str: str) -> str:
    hash_val = 5381
    for char in input_str:
        hash_val = ((hash_val << 5) + hash_val) + ord(char)
        hash_val &= 0xFFFFFFFF
    return f"{hash_val:08X}"

async def run_mesh_simulation():
    """
    Background simulation simulating active ESP8266 nodes.
    Used when no real devices are connected.
    """
    logger.info("Starting Background Mesh Network Simulation Loop...")
    
    seq_numbers = {"A": 0, "B": 0, "C": 0}
    blockchain_seq = 0
    loop_counter = 0
    
    while True:
        await asyncio.sleep(2.0)
        loop_counter += 2
        
        if not state.demo_mode:
            continue
            
        # 1. Update system status
        connected_count = sum(1 for n in state.nodes.values() if n["status"] == "connected" and not n["blacklisted"])
        state.connected_count = connected_count
        
        # 2. Hello Broadcast (Peer Discovery) - runs every 6 seconds in simulation
        if loop_counter % 6 == 0:
            for node_id, node_info in state.nodes.items():
                if node_info["status"] == "connected" and not node_info["blacklisted"]:
                    node_info["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    msg = f"HELLO;{node_id};{node_info['ip']}"
                    await register_event(
                        node_id, 
                        "peer_discovered", 
                        f"[DISCOVERY] Broadcast: {msg}", 
                        "peer_discovered"
                    )
            
            # Update discovery status based on connected nodes
            if connected_count == 3:
                state.peer_discovery_status = "STABLE"
            elif connected_count > 0:
                state.peer_discovery_status = "INCOMPLETE"
            else:
                state.peer_discovery_status = "DISCOVERING"

        # 3. Simulate Regular Packet flow - runs every 10 seconds in normal mode
        if state.mode == "NORMAL MESH MODE" and loop_counter % 10 == 0:
            # Pick a random active node to send packet
            active_senders = [n for n in state.nodes.values() if n["status"] == "connected" and not n["blacklisted"]]
            if active_senders:
                sender = random.choice(active_senders)
                seq_numbers[sender["id"]] += 1
                sender["packets_sent"] += 1
                
                # Relayed by another node (multi-hop mesh simulation)
                relayers = [n for n in active_senders if n["id"] != sender["id"]]
                relayer_id = None
                if relayers:
                    relayer = random.choice(relayers)
                    relayer["relay_count"] += 1
                    relayer_id = relayer["id"]
                
                # Packet received by target
                receivers = [n for n in active_senders if n["id"] not in (sender["id"], relayer_id)]
                if receivers:
                    rcv = random.choice(receivers)
                    rcv["packets_received"] += 1
                
                await register_event(
                    sender["id"], 
                    "packet_sent", 
                    f"Mesh Data Packet Sent: Smart Home Data Node {sender['id']} Seq {seq_numbers[sender['id']]}", 
                    "packet_sent"
                )
                if relayer_id:
                    await asyncio.sleep(0.5)
                    await register_event(
                        relayer_id, 
                        "packet_relayed", 
                        f"Relaying mesh data packet from Node {sender['id']} (TTL: 1)", 
                        "packet_relayed"
                    )

        # 4. Simulate Attack / Intrusion injection
        if state.attacks["active_attack"] is not None:
            attack_type = state.attacks["active_attack"]
            # Attacker node is C, unless blacklisted, then B
            attacker_id = "C" if not state.nodes["C"]["blacklisted"] else "B"
            
            # Send attack log
            state.firewall["inspected_packets"] += 1
            await register_event(
                attacker_id,
                "attack_detected",
                f"[ATTACK SIMULATOR] Injecting {attack_type.upper()} into mesh...",
                "attack_detected"
            )
            
            if state.firewall_status:
                # Firewall is ON: detect and escalate
                state.firewall["threat_counter"] += 1
                state.firewall["dropped_packets"] += 1
                state.nodes[attacker_id]["bad_count"] += 1
                
                # Trust score decrease
                state.nodes[attacker_id]["trust_score"] = max(0, state.nodes[attacker_id]["trust_score"] - 35)
                
                await asyncio.sleep(0.8)
                await register_event(
                    "SYSTEM",
                    "firewall_triggered",
                    f"[FIREWALL] Intrusion detected from Node {attacker_id}! Packet dropped. Threat Type: {attack_type}",
                    "firewall_triggered"
                )
                
                # Trigger Security Escalation
                if state.mode == "NORMAL MESH MODE":
                    state.threat_level = "HIGH"
                    await asyncio.sleep(1.0)
                    await register_event(
                        "SYSTEM",
                        "system_alert",
                        "[SECURITY ESCALATION] Escalating network security levels. Activating blockchain mechanisms...",
                        "system_alert"
                    )
                    
                    # Create Genesis Block
                    state.mode = "SECURE BLOCKCHAIN MODE"
                    state.blockchain_status = "ACTIVE"
                    blockchain_seq = 0
                    
                    # Create Genesis block
                    genesis_payload = "GENESIS_SECURITY_ESC_BLOCK"
                    prev_hash = "00000000"
                    genesis_hash = compute_simple_hash(f"SYSTEM|0|{genesis_payload}|{prev_hash}")
                    
                    genesis_block = {
                        "index": 0,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "node": "SYSTEM",
                        "payload": genesis_payload,
                        "prev_hash": prev_hash,
                        "block_hash": genesis_hash,
                        "verification": "GENESIS"
                    }
                    state.blockchain["chain"] = [genesis_block]
                    state.blockchain["height"] = 1
                    state.blockchain["blocks_generated"] += 1
                    state.blockchain["ledger_size_kb"] = round(len(json.dumps(state.blockchain["chain"])) / 1024.0, 3)
                    
                    await asyncio.sleep(0.8)
                    await register_event(
                        "SYSTEM",
                        "genesis_block_created",
                        f"[BLOCKCHAIN] Genesis block created. Hash: {genesis_hash}",
                        "genesis_block_created"
                    )
                    
                    # Push ledger update
                    await ws_manager.broadcast({"event": "ledger_updated", "data": state.blockchain})

                # Check if attacker should be blacklisted
                if state.nodes[attacker_id]["bad_count"] >= 2 and not state.nodes[attacker_id]["blacklisted"]:
                    state.nodes[attacker_id]["blacklisted"] = True
                    state.nodes[attacker_id]["status"] = "disconnected"
                    state.nodes[attacker_id]["trust_score"] = 0
                    
                    await asyncio.sleep(1.2)
                    await register_event(
                        attacker_id,
                        "node_blacklisted",
                        f"[LOGICAL ISOLATION] Node {attacker_id} logically isolated from network mesh.",
                        "node_blacklisted"
                    )
                    # Stop active attack since node is isolated
                    state.attacks["active_attack"] = None
                    state.attacks["blocked_attacks"] += 1
                    state.threat_level = "MEDIUM"
                    
                    # Send node status update
                    await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
            else:
                # Firewall is OFF: attack succeeds, network compromised
                state.threat_level = "CRITICAL"
                state.nodes[attacker_id]["trust_score"] = max(0, state.nodes[attacker_id]["trust_score"] - 15)
                await register_event(
                    "SYSTEM",
                    "system_alert",
                    f"[WARNING] Firewall is disabled. Replay/Tampered attack from Node {attacker_id} bypassed security checkpoints!",
                    "system_alert"
                )

        # 5. Simulate Secure Blockchain Block generation - every 8 seconds in blockchain mode
        if state.blockchain_status == "ACTIVE" and loop_counter % 8 == 0:
            # Nodes generate blocks and distribute them
            active_blockchain_nodes = [n for n in state.nodes.values() if n["status"] == "connected" and not n["blacklisted"]]
            
            if active_blockchain_nodes:
                miner = random.choice(active_blockchain_nodes)
                blockchain_seq += 1
                miner["blockchain_height"] = blockchain_seq
                
                # Get last block
                last_block = state.blockchain["chain"][-1]
                prev_hash = last_block["block_hash"]
                payload = f"SECURE_TELEMETRY_DATA_FROM_{miner['id']}_SEQ_{blockchain_seq}"
                
                block_hash = compute_simple_hash(f"{miner['id']}|{blockchain_seq}|{payload}|{prev_hash}")
                
                # Check if node was trying to attack (if firewall disabled)
                is_invalid = False
                if state.attacks["active_attack"] in ["tampered_packet", "invalid_hash"] and miner["id"] == "C":
                    is_invalid = True
                    block_hash = "DEADBEEF"  # Invalidated hash
                    
                verification_status = "INVALID" if is_invalid else "VALID"
                
                new_block = {
                    "index": len(state.blockchain["chain"]),
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "node": miner["id"],
                    "payload": payload,
                    "prev_hash": prev_hash,
                    "block_hash": block_hash,
                    "verification": verification_status
                }
                
                state.blockchain["chain"].append(new_block)
                state.blockchain["height"] = len(state.blockchain["chain"])
                state.blockchain["blocks_generated"] += 1
                
                if verification_status == "VALID":
                    state.blockchain["blocks_verified"] += 1
                    await register_event(
                        miner["id"],
                        "block_verified",
                        f"[BLOCKCHAIN] Block {new_block['index']} verified by consensus. Hash: {block_hash}",
                        "block_verified"
                    )
                else:
                    state.blockchain["invalid_blocks_rejected"] += 1
                    state.blockchain["hash_verification_rate"] = round(
                        (state.blockchain["blocks_verified"] / (state.blockchain["blocks_generated"] or 1)) * 100, 2
                    )
                    await register_event(
                        miner["id"],
                        "system_alert",
                        f"[BLOCKCHAIN ERROR] Block validation failed for Node {miner['id']}. Invalid Hash detected: {block_hash}",
                        "system_alert"
                    )
                
                # Recalculate ledger metrics
                state.blockchain["ledger_size_kb"] = round(len(json.dumps(state.blockchain["chain"])) / 1024.0, 3)
                
                # Broadcast ledger update
                await ws_manager.broadcast({"event": "ledger_updated", "data": state.blockchain})

# Start the simulation loop in the background on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_mesh_simulation())
    # Try to scan ports in background
    if SERIAL_AVAILABLE:
        asyncio.create_task(serial_ports_auto_scan())

# -------------------------------------------------------------------------
# REAL ESP8266 SERIAL PORT MANAGEMENT
# -------------------------------------------------------------------------

async def serial_ports_auto_scan():
    """
    Scans COM ports looking for ESP8266 boards, periodically updates the list
    """
    while True:
        try:
            ports = list(serial.tools.list_ports.comports())
            state.detected_ports = [p.device for p in ports]
        except Exception as e:
            logger.error(f"Error listing COM ports: {e}")
        await asyncio.sleep(5.0)

def handle_serial_input(port_name: str, ser: serial.Serial):
    """
    Target for the background thread reading a specific serial port
    """
    logger.info(f"Started reading serial from port {port_name}")
    node_mapping = {"COM5": "A", "COM8": "B", "COM10": "C"}
    # Try to resolve which node this port belongs to
    assigned_node = "UNKNOWN"
    for port, nid in node_mapping.items():
        if port_name.upper() == port:
            assigned_node = nid

    buffer = ""
    while port_name in state.active_serial_connections:
        try:
            if ser.in_waiting > 0:
                data = ser.readline().decode('utf-8', errors='ignore')
                if not data:
                    continue
                
                logger.info(f"[{port_name}] Read: {data.strip()}")
                
                # 1. Parse JSON if applicable
                try:
                    json_data = json.loads(data)
                    asyncio.run_coroutine_threadsafe(
                        process_json_serial_message(assigned_node, json_data),
                        asyncio.get_event_loop()
                    )
                except json.JSONDecodeError:
                    # 2. Treat as raw debug text. Send raw log to frontend.
                    asyncio.run_coroutine_threadsafe(
                        register_event(
                            assigned_node, 
                            "serial_raw", 
                            f"[SERIAL] {data.strip()}", 
                            "system_alert"
                        ),
                        asyncio.get_event_loop()
                    )
            else:
                time.sleep(0.1)
        except Exception as e:
            logger.error(f"Error reading from serial port {port_name}: {e}")
            break

    # Cleanup
    ser.close()
    if port_name in state.active_serial_connections:
        del state.active_serial_connections[port_name]
    logger.info(f"Stopped reading serial from port {port_name}")

async def process_json_serial_message(node_id: str, data: dict):
    """
    Parses JSON output from an ESP8266 and maps it to system events
    """
    msg_type = data.get("type")
    node = data.get("node", node_id)
    
    if msg_type == "node_status":
        status = data.get("status", "connected")
        if node in state.nodes:
            state.nodes[node]["status"] = status
            state.nodes[node]["wifi_status"] = "connected" if status == "connected" else "disconnected"
            state.nodes[node]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        await register_event(
            node, 
            "node_status_update", 
            f"Node {node} status updated: {status}", 
            "node_status_update"
        )
        await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})

    elif msg_type == "packet":
        sent = data.get("sent", 0)
        received = data.get("received", 0)
        relayed = data.get("relayed", 0)
        
        if node in state.nodes:
            state.nodes[node]["packets_sent"] += sent
            state.nodes[node]["packets_received"] += received
            state.nodes[node]["relay_count"] += relayed
            state.nodes[node]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if sent > 0:
            await register_event(node, "packet_sent", f"Mesh Packet Sent: Count {sent}", "packet_sent")
        if received > 0:
            await register_event(node, "packet_received", f"Mesh Packet Received: Count {received}", "packet_received")
        if relayed > 0:
            await register_event(node, "packet_relayed", f"Mesh Packet Relayed: Count {relayed}", "packet_relayed")

    elif msg_type == "attack":
        attack_name = data.get("attack", "tampered_packet")
        state.firewall["threat_counter"] += 1
        state.firewall["inspected_packets"] += 1
        
        if node in state.nodes:
            state.nodes[node]["bad_count"] += 1
            state.nodes[node]["trust_score"] = max(0, state.nodes[node]["trust_score"] - 30)

        await register_event(
            node, 
            "attack_detected", 
            f"[ATTACK DETECTED] Intruding behavior: {attack_name} from Node {node}", 
            "attack_detected"
        )
        await register_event(
            "SYSTEM", 
            "firewall_triggered", 
            f"[FIREWALL] Deep inspection isolation triggered for node {node}", 
            "firewall_triggered"
        )

    elif msg_type == "block":
        height = data.get("height", 1)
        prev_hash = data.get("prev_hash", "000000")
        block_hash = data.get("hash", "000000")
        valid = data.get("valid", True)
        payload = data.get("payload", "TELEMETRY_DATA")
        
        if node in state.nodes:
            state.nodes[node]["blockchain_height"] = height
            state.nodes[node]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Activate blockchain if inactive
        if state.blockchain_status == "INACTIVE":
            state.mode = "SECURE BLOCKCHAIN MODE"
            state.blockchain_status = "ACTIVE"
            state.blockchain["status"] = "ACTIVE"
            # create genesis
            genesis_block = {
                "index": 0,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "node": "SYSTEM",
                "payload": "GENESIS_SECURITY_ESC_BLOCK",
                "prev_hash": "00000000",
                "block_hash": "00000000",
                "verification": "GENESIS"
            }
            state.blockchain["chain"] = [genesis_block]

        new_block = {
            "index": len(state.blockchain["chain"]),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "node": node,
            "payload": payload,
            "prev_hash": prev_hash,
            "block_hash": block_hash,
            "verification": "VALID" if valid else "INVALID"
        }
        
        state.blockchain["chain"].append(new_block)
        state.blockchain["height"] = len(state.blockchain["chain"])
        state.blockchain["blocks_generated"] += 1
        
        if valid:
            state.blockchain["blocks_verified"] += 1
            await register_event(
                node, 
                "block_verified", 
                f"[BLOCKCHAIN] Block {new_block['index']} verified by ESP8266. Hash: {block_hash}", 
                "block_verified"
            )
        else:
            state.blockchain["invalid_blocks_rejected"] += 1
            state.blockchain["hash_verification_rate"] = round(
                (state.blockchain["blocks_verified"] / state.blockchain["blocks_generated"]) * 100, 2
            )
            await register_event(
                node, 
                "system_alert", 
                f"[BLOCKCHAIN ERROR] Invalid block received from Node {node}.", 
                "system_alert"
            )

        # Broadcast update
        await ws_manager.broadcast({"event": "ledger_updated", "data": state.blockchain})

def send_serial_command(port_name: str, command: str):
    """
    Sends raw command down the serial pipeline
    """
    if not SERIAL_AVAILABLE:
        logger.warning("Serial not available. Command suppressed.")
        return False
        
    ser = state.active_serial_connections.get(port_name)
    if ser and ser.is_open:
        try:
            ser.write(f"{command}\n".encode('utf-8'))
            logger.info(f"Command '{command}' sent to {port_name}")
            return True
        except Exception as e:
            logger.error(f"Error sending command to {port_name}: {e}")
            return False
    return False

# -------------------------------------------------------------------------
# REST API ENDPOINTS
# -------------------------------------------------------------------------

class CommandRequest(BaseModel):
    node_id: str
    command: str  # DISCOVER, RESTART, ENABLE_FIREWALL, PING, etc.

class ConnectionRequest(BaseModel):
    node_id: str
    port: str

class AttackRequest(BaseModel):
    attack_type: str  # tampered_packet, replay_attack, invalid_hash, fake_sender, flood_attack, malformed_packet, or "stop"

@app.get("/api/system")
async def get_system_status():
    return {
        "mode": state.mode,
        "connected_count": state.connected_count,
        "peer_discovery_status": state.peer_discovery_status,
        "threat_level": state.threat_level,
        "firewall_status": state.firewall_status,
        "blockchain_status": state.blockchain_status,
        "hotspot_status": state.hotspot_status,
        "uptime": state.update_uptime(),
        "demo_mode": state.demo_mode,
        "detected_ports": state.detected_ports,
        "serial_available": SERIAL_AVAILABLE
    }

@app.get("/api/nodes")
async def get_nodes():
    return state.nodes

@app.get("/api/blockchain")
async def get_blockchain():
    return state.blockchain

@app.get("/api/firewall")
async def get_firewall():
    return state.firewall

@app.get("/api/logs")
async def get_logs(search: Optional[str] = None, filter_type: Optional[str] = None):
    filtered_logs = state.logs
    
    if filter_type:
        filtered_logs = [log for log in filtered_logs if log["event_type"] == filter_type]
        
    if search:
        search_lower = search.lower()
        filtered_logs = [
            log for log in filtered_logs 
            if search_lower in log["message"].lower() or search_lower in log["node"].lower()
        ]
        
    return filtered_logs

@app.get("/api/attacks")
async def get_attacks_status():
    return state.attacks

# POST actions
@app.post("/api/connect-node")
async def connect_node(req: ConnectionRequest):
    node_id = req.node_id
    port = req.port
    
    if node_id not in state.nodes:
        raise HTTPException(status_code=400, detail="Invalid node ID")
        
    state.nodes[node_id]["com_port"] = port
    
    if state.demo_mode:
        state.nodes[node_id]["status"] = "connected"
        state.nodes[node_id]["wifi_status"] = "connected"
        state.nodes[node_id]["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await register_event(
            node_id, 
            "node_connected", 
            f"Node {node_id} connected via simulated port {port}", 
            "node_connected"
        )
        await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
        return {"status": "success", "message": f"Simulated node {node_id} connected on {port}"}

    # Real hardware connection
    if not SERIAL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Serial modules not available. Enable Demo Mode.")

    if port in state.active_serial_connections:
        raise HTTPException(status_code=400, detail=f"Port {port} is already active")

    try:
        ser = serial.Serial(port, 115200, timeout=1)
        state.active_serial_connections[port] = ser
        
        # Start read thread
        thread = threading.Thread(target=handle_serial_input, args=(port, ser), daemon=True)
        thread.start()
        
        state.nodes[node_id]["status"] = "connected"
        state.nodes[node_id]["wifi_status"] = "connected"
        
        await register_event(node_id, "node_connected", f"Physical Node {node_id} connected on port {port}", "node_connected")
        await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
        
        return {"status": "success", "message": f"Physical node {node_id} connected on {port}"}
    except Exception as e:
        logger.error(f"Failed to open COM port {port}: {e}")
        state.nodes[node_id]["status"] = "disconnected"
        raise HTTPException(status_code=500, detail=f"Failed to open port {port}: {str(e)}")

@app.post("/api/disconnect-node")
async def disconnect_node(req: ConnectionRequest):
    node_id = req.node_id
    port = req.port
    
    if node_id not in state.nodes:
        raise HTTPException(status_code=400, detail="Invalid node ID")
        
    if state.demo_mode:
        state.nodes[node_id]["status"] = "disconnected"
        state.nodes[node_id]["wifi_status"] = "disconnected"
        await register_event(node_id, "node_disconnected", f"Node {node_id} disconnected from port {port}", "node_disconnected")
        await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
        return {"status": "success", "message": f"Simulated node {node_id} disconnected"}

    # Real hardware disconnect
    if port in state.active_serial_connections:
        # Removing from dict will stop thread loop and close port
        del state.active_serial_connections[port]
        state.nodes[node_id]["status"] = "disconnected"
        state.nodes[node_id]["wifi_status"] = "disconnected"
        await register_event(node_id, "node_disconnected", f"Physical Node {node_id} disconnected from port {port}", "node_disconnected")
        await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
        return {"status": "success", "message": f"Physical node {node_id} disconnected"}
        
    raise HTTPException(status_code=400, detail="Port not active")

@app.post("/api/restart-node")
async def restart_node(req: CommandRequest):
    node_id = req.node_id
    node_info = state.nodes.get(node_id)
    if not node_info:
         raise HTTPException(status_code=400, detail="Invalid node ID")
         
    # Send command if real
    if not state.demo_mode:
        success = send_serial_command(node_info["com_port"], "RESTART")
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send serial command to device")
    
    # Reset/Simulate restart
    node_info["status"] = "connecting"
    node_info["trust_score"] = 100
    node_info["bad_count"] = 0
    node_info["blacklisted"] = False
    
    await register_event(node_id, "system_alert", f"Restart command sent to Node {node_id}. Re-initializing...", "system_alert")
    await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
    
    # Sim reconnect after 3 seconds
    if state.demo_mode:
        async def reconnect():
            await asyncio.sleep(3.0)
            node_info["status"] = "connected"
            await register_event(node_id, "node_connected", f"Node {node_id} restarted and re-established link", "node_connected")
            await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
        asyncio.create_task(reconnect())
        
    return {"status": "success", "message": f"Restart initiated for Node {node_id}"}

@app.post("/api/discover-peers")
async def discover_peers(req: CommandRequest):
    node_id = req.node_id
    node_info = state.nodes.get(node_id)
    if not node_info:
        raise HTTPException(status_code=400, detail="Invalid node ID")
        
    if not state.demo_mode:
        send_serial_command(node_info["com_port"], "DISCOVER")
        
    await register_event(node_id, "peer_discovered", f"[DISCOVERY] Explicit PEER DISCOVERY command issued from dashboard for Node {node_id}", "peer_discovered")
    return {"status": "success", "message": "Discovery broadcast sent"}

@app.post("/api/enable-firewall")
async def enable_firewall():
    state.firewall_status = True
    state.firewall["status"] = True
    
    # Broadcast to all real nodes
    if not state.demo_mode:
        for port in state.active_serial_connections:
            send_serial_command(port, "ENABLE_FIREWALL")
            
    await register_event("SYSTEM", "system_alert", "Dashboard configured firewall: ENABLED", "system_alert")
    return {"status": "success", "firewall_status": True}

@app.post("/api/disable-firewall")
async def disable_firewall():
    state.firewall_status = False
    state.firewall["status"] = False
    
    # Broadcast to all real nodes
    if not state.demo_mode:
        for port in state.active_serial_connections:
            send_serial_command(port, "DISABLE_FIREWALL")
            
    await register_event("SYSTEM", "system_alert", "Dashboard configured firewall: DISABLED. System is now vulnerable to attacks!", "system_alert")
    return {"status": "success", "firewall_status": False}

@app.post("/api/activate-blockchain")
async def activate_blockchain():
    if state.blockchain_status == "ACTIVE":
        return {"status": "success", "blockchain_status": "ACTIVE", "message": "Blockchain already active"}
        
    state.mode = "SECURE BLOCKCHAIN MODE"
    state.blockchain_status = "ACTIVE"
    state.blockchain["status"] = "ACTIVE"
    
    if not state.demo_mode:
        for port in state.active_serial_connections:
            send_serial_command(port, "ENABLE_BLOCKCHAIN")

    # Genesis block
    genesis_payload = "MANUAL_ACTIVATION_GENESIS_BLOCK"
    prev_hash = "00000000"
    genesis_hash = compute_simple_hash(f"SYSTEM|0|{genesis_payload}|{prev_hash}")
    
    genesis_block = {
        "index": 0,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "node": "SYSTEM",
        "payload": genesis_payload,
        "prev_hash": prev_hash,
        "block_hash": genesis_hash,
        "verification": "GENESIS"
    }
    state.blockchain["chain"] = [genesis_block]
    state.blockchain["height"] = 1
    state.blockchain["blocks_generated"] += 1
    state.blockchain["ledger_size_kb"] = round(len(json.dumps(state.blockchain["chain"])) / 1024.0, 3)
    
    await register_event("SYSTEM", "genesis_block_created", f"[BLOCKCHAIN] Blockchain manual activation. Genesis Block generated: {genesis_hash}", "genesis_block_created")
    await ws_manager.broadcast({"event": "ledger_updated", "data": state.blockchain})
    
    return {"status": "success", "blockchain_status": "ACTIVE"}

@app.post("/api/inject-attack")
async def inject_attack(req: AttackRequest):
    attack_type = req.attack_type
    
    if attack_type == "stop":
        state.attacks["active_attack"] = None
        state.threat_level = "LOW"
        # Command ESP8266 to stop attack
        if not state.demo_mode:
            for port in state.active_serial_connections:
                send_serial_command(port, "STOP_ATTACK")
                
        await register_event("SYSTEM", "system_alert", "[ATTACK SIMULATOR] Injection halted. System returned to default state.", "system_alert")
        return {"status": "success", "active_attack": None}
        
    state.attacks["active_attack"] = attack_type
    state.attacks["total_attacks"] += 1
    
    # Inject to physical nodes
    if not state.demo_mode:
        # Command Node C (or others) to start attack
        node_c_port = state.nodes["C"]["com_port"]
        send_serial_command(node_c_port, f"START_ATTACK:{attack_type}")
        
    await register_event("SYSTEM", "system_alert", f"[ATTACK SIMULATOR] Injecting Threat Vector: {attack_type.upper()}", "system_alert")
    
    # Append to timeline
    state.attacks["attack_timeline"].append({
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "attack": attack_type,
        "status": "Intercepted" if state.firewall_status else "Breached"
    })
    
    return {"status": "success", "active_attack": attack_type}

@app.post("/api/blacklist-node")
async def blacklist_node(req: CommandRequest):
    node_id = req.node_id
    node_info = state.nodes.get(node_id)
    if not node_info:
        raise HTTPException(status_code=400, detail="Invalid node ID")
        
    node_info["blacklisted"] = True
    node_info["status"] = "disconnected"
    node_info["trust_score"] = 0
    
    if not state.demo_mode:
        send_serial_command(node_info["com_port"], "BLACKLIST")
        
    await register_event(node_id, "node_blacklisted", f"[ADMIN CONTROL] Manual command issued: blacklist and logically isolate Node {node_id}", "node_blacklisted")
    await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
    
    return {"status": "success", "message": f"Node {node_id} blacklisted"}

@app.post("/api/toggle-demo")
async def toggle_demo():
    state.demo_mode = not state.demo_mode
    mode_str = "ENABLED" if state.demo_mode else "DISABLED"
    await register_event("SYSTEM", "system_alert", f"Dashboard configuration changed: Demo/Simulation Mode is now {mode_str}", "system_alert")
    return {"status": "success", "demo_mode": state.demo_mode}

@app.post("/api/reset-all")
async def reset_all():
    state.mode = "NORMAL MESH MODE"
    state.threat_level = "LOW"
    state.blockchain_status = "INACTIVE"
    state.blockchain = {
        "status": "INACTIVE",
        "chain": [],
        "height": 0,
        "blocks_generated": 0,
        "blocks_verified": 0,
        "invalid_blocks_rejected": 0,
        "hash_verification_rate": 100.0,
        "ledger_size_kb": 0.0
    }
    state.firewall = {
        "status": True,
        "threat_counter": 0,
        "dropped_packets": 0,
        "inspected_packets": 0,
        "detection_rate": 99.4
    }
    state.attacks = {
        "active_attack": None,
        "total_attacks": 0,
        "blocked_attacks": 0,
        "detection_rate": 100.0,
        "threat_history": [],
        "attack_timeline": []
    }
    
    # Reset Nodes
    for node_id, node in state.nodes.items():
        node["status"] = "connected"
        node["wifi_status"] = "connected"
        node["trust_score"] = 100
        node["blockchain_height"] = 0
        node["blacklisted"] = False
        node["packets_sent"] = 0
        node["packets_received"] = 0
        node["relay_count"] = 0
        node["forward_count"] = 0
        node["bad_count"] = 0
        node["last_seen"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    state.logs = []
    
    await register_event("SYSTEM", "system_alert", "System administrative command: FULL RECOVERY / FACTORY RESET", "system_alert")
    await ws_manager.broadcast({"event": "node_status_update", "nodes": state.nodes})
    await ws_manager.broadcast({"event": "ledger_updated", "data": state.blockchain})
    
    return {"status": "success", "message": "System status successfully reset."}

@app.post("/api/generate-report")
async def generate_report():
    # Construct a comprehensive system evaluation state report
    report_id = f"REP-{random.randint(1000, 9999)}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report_data = {
        "report_id": report_id,
        "timestamp": timestamp,
        "project": "Adaptive Secure Data Transmission in WMN using Event-Triggered Blockchain",
        "institution": "Centre for Intelligent Marine & Energy Systems, SRM Institute of Science and Technology",
        "network_statistics": {
            "mode": state.mode,
            "connected_nodes": state.connected_count,
            "peer_discovery": state.peer_discovery_status,
            "total_sent": sum(n["packets_sent"] for n in state.nodes.values()),
            "total_received": sum(n["packets_received"] for n in state.nodes.values()),
            "total_relayed": sum(n["relay_count"] for n in state.nodes.values()),
        },
        "firewall_statistics": state.firewall,
        "attack_statistics": {
            "total_attacks_injected": state.attacks["total_attacks"],
            "total_attacks_blocked": state.attacks["blocked_attacks"],
            "active_threat_level": state.threat_level,
            "timeline": state.attacks["attack_timeline"]
        },
        "blockchain_statistics": {
            "blockchain_status": state.blockchain_status,
            "chain_height": state.blockchain["height"],
            "blocks_generated": state.blockchain["blocks_generated"],
            "blocks_verified": state.blockchain["blocks_verified"],
            "blocks_rejected": state.blockchain["invalid_blocks_rejected"],
            "hash_verification_success_rate": state.blockchain["hash_verification_rate"],
            "ledger_size_kb": state.blockchain["ledger_size_kb"]
        },
        "node_statuses": [
            {
                "node_id": n["id"],
                "com_port": n["com_port"],
                "status": n["status"],
                "ip": n["ip"],
                "trust_score": n["trust_score"],
                "bad_behavior_count": n["bad_count"],
                "blockchain_height": n["blockchain_height"],
                "blacklisted": n["blacklisted"]
            }
            for n in state.nodes.values()
        ],
        "ledger_summary": [
            {
                "index": b["index"],
                "timestamp": b["timestamp"],
                "node": b["node"],
                "payload": b["payload"],
                "block_hash": b["block_hash"],
                "verification": b["verification"]
            }
            for b in state.blockchain["chain"]
        ],
        "system_health": "OPTIMAL" if state.threat_level == "LOW" else "WARNING" if state.threat_level in ["MEDIUM", "HIGH"] else "CRITICAL_THREAT"
    }
    
    await register_event("SYSTEM", "system_alert", f"Audit report successfully generated: {report_id}", "system_alert")
    return report_data

# -------------------------------------------------------------------------
# WEBSOCKET ENDPOINT
# -------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    # Send initial state immediately
    try:
        await websocket.send_json({
            "event": "initial_state",
            "system": {
                "mode": state.mode,
                "connected_count": state.connected_count,
                "peer_discovery_status": state.peer_discovery_status,
                "threat_level": state.threat_level,
                "firewall_status": state.firewall_status,
                "blockchain_status": state.blockchain_status,
                "hotspot_status": state.hotspot_status,
                "uptime": state.update_uptime(),
                "demo_mode": state.demo_mode,
                "detected_ports": state.detected_ports,
                "serial_available": SERIAL_AVAILABLE
            },
            "nodes": state.nodes,
            "blockchain": state.blockchain,
            "firewall": state.firewall,
            "attacks": state.attacks,
            "logs": state.logs
        })
        
        while True:
            # Keep the websocket alive
            data = await websocket.receive_text()
            # If dashboard sends client ping
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    # When executed directly, run server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
