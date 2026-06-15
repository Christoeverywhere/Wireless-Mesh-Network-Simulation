export interface SystemStatus {
  mode: string; // "NORMAL MESH MODE" | "SECURE BLOCKCHAIN MODE"
  connected_count: number;
  peer_discovery_status: string; // "DISCOVERING" | "STABLE" | "INCOMPLETE"
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  firewall_status: boolean;
  blockchain_status: "INACTIVE" | "ACTIVE";
  hotspot_status: "ONLINE" | "OFFLINE";
  uptime: number;
  demo_mode: boolean;
  detected_ports: string[];
  serial_available: boolean;
}

export interface NodeStatus {
  id: string; // "A" | "B" | "C"
  com_port: string;
  status: "connected" | "disconnected" | "connecting" | "unknown";
  ip: string;
  wifi_status: "connected" | "disconnected";
  last_seen: string;
  trust_score: number;
  blockchain_height: number;
  blacklisted: boolean;
  packets_sent: number;
  packets_received: number;
  relay_count: number;
  forward_count: number;
  bad_count: number;
}

export interface Block {
  index: number;
  timestamp: string;
  node: string;
  payload: string;
  prev_hash: string;
  block_hash: string;
  verification: "VALID" | "INVALID" | "GENESIS";
}

export interface BlockchainState {
  status: "INACTIVE" | "ACTIVE";
  chain: Block[];
  height: number;
  blocks_generated: number;
  blocks_verified: number;
  invalid_blocks_rejected: number;
  hash_verification_rate: number;
  ledger_size_kb: number;
}

export interface FirewallState {
  status: boolean;
  threat_counter: number;
  dropped_packets: number;
  inspected_packets: number;
  detection_rate: number;
}

export interface AttackState {
  active_attack: string | null;
  total_attacks: number;
  blocked_attacks: number;
  detection_rate: number;
  threat_history: any[];
  attack_timeline: {
    timestamp: string;
    attack: string;
    status: "Intercepted" | "Breached";
  }[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  node: string;
  event_type: string;
  message: string;
}

export interface GlobalState {
  system: SystemStatus;
  nodes: Record<string, NodeStatus>;
  blockchain: BlockchainState;
  firewall: FirewallState;
  attacks: AttackState;
  logs: LogEntry[];
}
