import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Network, Cpu, Database, Flame, BarChart3, 
  Terminal, FileSpreadsheet, Settings, AlertTriangle, Radio
} from 'lucide-react';
import { GlobalState, LogEntry } from './types';
import { StatusBar } from './components/StatusBar';
import { HardwareCards } from './components/HardwareCards';
import { NetworkTopology } from './components/NetworkTopology';
import { SerialMonitor } from './components/SerialMonitor';
import { BlockchainLedger } from './components/BlockchainLedger';
import { FirewallPanel } from './components/FirewallPanel';
import { AttackSimulator } from './components/AttackSimulator';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ReportGenerator } from './components/ReportGenerator';
import { SettingsPanel } from './components/SettingsPanel';

const DEFAULT_STATE: GlobalState = {
  system: {
    mode: "NORMAL MESH MODE",
    connected_count: 3,
    peer_discovery_status: "STABLE",
    threat_level: "LOW",
    firewall_status: true,
    blockchain_status: "INACTIVE",
    hotspot_status: "ONLINE",
    uptime: 0,
    demo_mode: true,
    detected_ports: ["COM5", "COM8", "COM10"],
    serial_available: false
  },
  nodes: {
    A: { id: "A", com_port: "COM5", status: "connected", ip: "192.168.4.2", wifi_status: "connected", last_seen: "", trust_score: 100, blockchain_height: 0, blacklisted: false, packets_sent: 45, packets_received: 38, relay_count: 12, forward_count: 0, bad_count: 0 },
    B: { id: "B", com_port: "COM8", status: "connected", ip: "192.168.4.3", wifi_status: "connected", last_seen: "", trust_score: 100, blockchain_height: 0, blacklisted: false, packets_sent: 32, packets_received: 44, relay_count: 18, forward_count: 0, bad_count: 0 },
    C: { id: "C", com_port: "COM10", status: "connected", ip: "192.168.4.4", wifi_status: "connected", last_seen: "", trust_score: 100, blockchain_height: 0, blacklisted: false, packets_sent: 50, packets_received: 29, relay_count: 8, forward_count: 0, bad_count: 0 }
  },
  blockchain: {
    status: "INACTIVE",
    chain: [],
    height: 0,
    blocks_generated: 0,
    blocks_verified: 0,
    invalid_blocks_rejected: 0,
    hash_verification_rate: 100.0,
    ledger_size_kb: 0.0
  },
  firewall: {
    status: true,
    threat_counter: 0,
    dropped_packets: 0,
    inspected_packets: 0,
    detection_rate: 99.4
  },
  attacks: {
    active_attack: null,
    total_attacks: 0,
    blocked_attacks: 0,
    detection_rate: 100.0,
    threat_history: [],
    attack_timeline: []
  },
  logs: []
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [state, setState] = useState<GlobalState>(DEFAULT_STATE);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsConnecting, setWsConnecting] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  // REST API Client wrapper
  const apiCall = async (endpoint: string, method: string = 'GET', body: any = null) => {
    try {
      const config: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) {
        config.body = JSON.stringify(body);
      }
      
      const res = await fetch(endpoint, config);
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`REST API failed for ${endpoint}. Operating in client-side fallback.`, err);
      // Client-side fallback mock modifications if WebSocket/FastAPI is down
      handleFallbackMockAction(endpoint, body);
      throw err;
    }
  };

  // Graceful client-side fallback simulation triggers if FastAPI is not started yet
  const handleFallbackMockAction = (endpoint: string, body: any) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
      const nowStr = new Date().toLocaleTimeString();

      const pushMockLog = (node: string, type: string, msg: string) => {
        newState.logs.push({
          id: String(Math.random()),
          timestamp: new Date().toLocaleDateString() + ' ' + nowStr,
          node,
          event_type: type,
          message: msg
        });
        if (newState.logs.length > 300) newState.logs.shift();
      };

      if (endpoint.includes('toggle-demo')) {
        newState.system.demo_mode = !newState.system.demo_mode;
        pushMockLog('SYSTEM', 'system_alert', `Fallback client config: Demo Mode toggled to ${newState.system.demo_mode}`);
      }
      else if (endpoint.includes('enable-firewall')) {
        newState.system.firewall_status = true;
        newState.firewall.status = true;
        pushMockLog('SYSTEM', 'system_alert', 'Firewall configured: ENABLED');
      }
      else if (endpoint.includes('disable-firewall')) {
        newState.system.firewall_status = false;
        newState.firewall.status = false;
        pushMockLog('SYSTEM', 'system_alert', 'Firewall configured: DISABLED. Mesh network is vulnerable.');
      }
      else if (endpoint.includes('reset-all')) {
        return DEFAULT_STATE;
      }
      else if (endpoint.includes('connect-node')) {
        const { node_id, port } = body;
        newState.nodes[node_id].status = 'connected';
        newState.nodes[node_id].com_port = port;
        pushMockLog(node_id, 'node_connected', `Simulated node ${node_id} linked on port ${port}`);
      }
      else if (endpoint.includes('disconnect-node')) {
        const { node_id } = body;
        newState.nodes[node_id].status = 'disconnected';
        pushMockLog(node_id, 'node_disconnected', `Simulated node ${node_id} disconnected from COM port.`);
      }
      else if (endpoint.includes('restart-node')) {
        const { node_id } = body;
        newState.nodes[node_id].status = 'connecting';
        newState.nodes[node_id].trust_score = 100;
        newState.nodes[node_id].bad_count = 0;
        newState.nodes[node_id].blacklisted = false;
        pushMockLog(node_id, 'system_alert', `Restarting simulated node ${node_id}...`);
        
        setTimeout(() => {
          setState(current => {
            const temp = JSON.parse(JSON.stringify(current));
            temp.nodes[node_id].status = 'connected';
            temp.logs.push({
              id: String(Math.random()),
              timestamp: new Date().toISOString(),
              node: node_id,
              event_type: 'node_connected',
              message: `Node ${node_id} restarted and re-established Wi-Fi link.`
            });
            return temp;
          });
        }, 3000);
      }
      else if (endpoint.includes('discover-peers')) {
        const { node_id } = body;
        pushMockLog(node_id, 'peer_discovered', `Explicit peer discovery broadcast from Node ${node_id}`);
      }
      else if (endpoint.includes('blacklist-node')) {
        const { node_id } = body;
        newState.nodes[node_id].blacklisted = true;
        newState.nodes[node_id].status = 'disconnected';
        newState.nodes[node_id].trust_score = 0;
        pushMockLog(node_id, 'node_blacklisted', `Node ${node_id} blacklisted and logically isolated.`);
      }
      else if (endpoint.includes('activate-blockchain')) {
        newState.system.mode = 'SECURE BLOCKCHAIN MODE';
        newState.system.blockchain_status = 'ACTIVE';
        newState.blockchain.status = 'ACTIVE';
        newState.blockchain.height = 1;
        newState.blockchain.blocks_generated = 1;
        newState.blockchain.blocks_verified = 1;
        
        const genesisHash = "A2B4C6E8";
        newState.blockchain.chain = [{
          index: 0,
          timestamp: new Date().toLocaleTimeString(),
          node: "SYSTEM",
          payload: "GENESIS_SECURITY_ESC_BLOCK",
          prev_hash: "00000000",
          block_hash: genesisHash,
          verification: "GENESIS"
        }];
        pushMockLog('SYSTEM', 'genesis_block_created', `Blockchain active. Genesis Block created. Hash: ${genesisHash}`);
      }
      else if (endpoint.includes('inject-attack')) {
        const { attack_type } = body;
        if (attack_type === 'stop') {
          newState.attacks.active_attack = null;
          newState.system.threat_level = 'LOW';
          pushMockLog('SYSTEM', 'system_alert', 'Simulation: attack halted. Scanning mesh channels.');
        } else {
          newState.attacks.active_attack = attack_type;
          newState.attacks.total_attacks += 1;
          pushMockLog('SYSTEM', 'system_alert', `Simulating injection: ${attack_type.toUpperCase()}`);
          
          newState.attacks.attack_timeline.push({
            timestamp: nowStr,
            attack: attack_type,
            status: newState.firewall.status ? 'Intercepted' : 'Breached'
          });

          // Simulate subsequent firewall/blockchain trigger
          if (newState.firewall.status) {
            newState.firewall.threat_counter += 1;
            newState.firewall.dropped_packets += 1;
            newState.nodes.C.bad_count += 1;
            newState.nodes.C.trust_score = Math.max(0, newState.nodes.C.trust_score - 35);
            
            pushMockLog('C', 'attack_detected', `Intrusion Alert: anomalous packet signature from C`);
            pushMockLog('SYSTEM', 'firewall_triggered', 'Intrusion dropped by firewall deep inspection.');

            if (newState.system.mode === 'NORMAL MESH MODE') {
              newState.system.threat_level = 'HIGH';
              pushMockLog('SYSTEM', 'system_alert', 'Security escalation: Activating distributed event blockchain...');
              
              newState.system.mode = 'SECURE BLOCKCHAIN MODE';
              newState.system.blockchain_status = 'ACTIVE';
              newState.blockchain.status = 'ACTIVE';
              newState.blockchain.height = 1;
              newState.blockchain.chain = [{
                index: 0,
                timestamp: nowStr,
                node: "SYSTEM",
                payload: "GENESIS_SECURITY_ESC_BLOCK",
                prev_hash: "00000000",
                block_hash: "00000000",
                verification: "GENESIS"
              }];
            }

            if (newState.nodes.C.bad_count >= 2) {
              newState.nodes.C.blacklisted = true;
              newState.nodes.C.status = 'disconnected';
              newState.nodes.C.trust_score = 0;
              pushMockLog('C', 'node_blacklisted', 'Malicious threshold reached. Logical Node Isolation triggered.');
              newState.attacks.active_attack = null;
              newState.attacks.blocked_attacks += 1;
              newState.system.threat_level = 'MEDIUM';
            }
          } else {
            newState.system.threat_level = 'CRITICAL';
            pushMockLog('SYSTEM', 'system_alert', 'WARNING: Firewall disabled! Corrupted buffer injected.');
          }
        }
      }

      return newState;
    });
  };

  // WebSocket Manager
  useEffect(() => {
    let reconnectTimer: any;
    
    const connectWS = () => {
      if (wsRef.current) return;
      
      setWsConnecting(true);
      const url = `ws://${window.location.hostname}:8000/ws`;
      loggerInfo("Initiating WebSocket link: " + url);
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setWsConnecting(false);
        loggerInfo("WebSocket connected successfully.");
      };

      ws.onclose = () => {
        setWsConnected(false);
        setWsConnecting(false);
        wsRef.current = null;
        loggerInfo("WebSocket link disconnected. Retrying in 5 seconds...");
        reconnectTimer = setTimeout(connectWS, 5000);
      };

      ws.onerror = (e) => {
        setWsConnecting(false);
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.event === 'initial_state') {
            setState(message);
          } 
          else if (message.event === 'node_status_update') {
            setState(prev => ({ ...prev, nodes: message.nodes }));
          }
          else if (message.event === 'ledger_updated') {
            setState(prev => ({ ...prev, blockchain: message.data }));
          }
          else if (['node_connected', 'node_disconnected', 'packet_sent', 'packet_received', 'packet_relayed', 'peer_discovered', 'attack_detected', 'firewall_triggered', 'blockchain_activated', 'genesis_block_created', 'block_verified', 'node_blacklisted', 'system_alert'].includes(message.event)) {
            // Append log entry and update system status
            setState(prev => {
              const logs = [...prev.logs, message.data];
              if (logs.length > 500) logs.shift();
              return { 
                ...prev, 
                logs,
                system: {
                  ...prev.system,
                  ...message.system
                }
              };
            });
          }
        } catch (err) {
          console.error("Failed to parse websocket JSON", err);
        }
      };
    };

    connectWS();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loggerInfo = (msg: string) => {
    console.log(`[SYS-WS] ${msg}`);
  };

  // Action APIs
  const handleConnectNode = async (nodeId: string, port: string) => {
    await apiCall('/api/connect-node', 'POST', { node_id: nodeId, port });
  };

  const handleDisconnectNode = async (nodeId: string, port: string) => {
    await apiCall('/api/disconnect-node', 'POST', { node_id: nodeId, port });
  };

  const handleRestartNode = async (nodeId: string) => {
    await apiCall('/api/restart-node', 'POST', { node_id: nodeId, command: 'RESTART' });
  };

  const handleDiscoverPeers = async (nodeId: string) => {
    await apiCall('/api/discover-peers', 'POST', { node_id: nodeId, command: 'DISCOVER' });
  };

  const handleEnableFirewall = async () => {
    await apiCall('/api/enable-firewall', 'POST');
  };

  const handleDisableFirewall = async () => {
    await apiCall('/api/disable-firewall', 'POST');
  };

  const handleActivateBlockchain = async () => {
    await apiCall('/api/activate-blockchain', 'POST');
  };

  const handleInjectAttack = async (attackType: string) => {
    await apiCall('/api/inject-attack', 'POST', { attack_type: attackType });
  };

  const handleStopAttack = async () => {
    await apiCall('/api/inject-attack', 'POST', { attack_type: 'stop' });
  };

  const handleBlacklistNode = async (nodeId: string) => {
    await apiCall('/api/blacklist-node', 'POST', { node_id: nodeId, command: 'BLACKLIST' });
  };

  const handleResetAll = async () => {
    await apiCall('/api/reset-all', 'POST');
  };

  const handleGenerateReport = async () => {
    return await apiCall('/api/generate-report', 'POST');
  };

  const handleToggleDemoMode = async () => {
    await apiCall('/api/toggle-demo', 'POST');
  };

  const handleClearLogs = () => {
    setState(prev => ({ ...prev, logs: [] }));
  };

  const handlePingNode = (nodeId: string) => {
    setState(prev => {
      const logs = [...prev.logs, {
        id: String(Math.random()),
        timestamp: new Date().toLocaleTimeString(),
        node: 'SYSTEM',
        event_type: 'system_alert',
        message: `Dashboard pinged Node ${nodeId}. Echo request broadcast sent.`
      }];
      return { ...prev, logs };
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* GLOBAL SYSTEM BAR & HEADER */}
      <header className="bg-[#0b1222] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between z-30 select-none">
        <div className="flex items-center space-x-3">
          <div className="bg-cyber-blue/10 p-2 rounded-lg border border-cyber-blue/20">
            <Shield className="text-cyber-blue animate-pulse-slow" size={22} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-slate-100 flex items-center space-x-1.5 uppercase">
              <span>Adaptive Secure Data Transmission Monitor</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider mt-0.5">
              Centre for Intelligent Marine & Energy Systems (CIMES)
            </span>
          </div>
        </div>

        {/* WebSocket badge */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-mono-code font-bold">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 led-glow-green animate-pulse' : wsConnecting ? 'bg-yellow-500 animate-ping' : 'bg-red-500'}`}></span>
          <span className={wsConnected ? 'text-emerald-500' : 'text-slate-500'}>
            {wsConnected ? 'GATEWAY: ONLINE' : wsConnecting ? 'CONNECTING...' : 'GATEWAY: OFFLINE (SIMULATOR ACTIVE)'}
          </span>
        </div>
      </header>

      {/* DASHBOARD SHELL CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT MENU SIDEBAR */}
        <aside className="w-60 bg-[#090e18]/85 border-r border-slate-850 flex flex-col justify-between p-4 shrink-0 select-none z-20">
          <div className="space-y-6">
            <div>
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block mb-2 px-2">Navigation Console</span>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: <Radio size={15} /> },
                  { id: 'mesh', label: 'Mesh Network', icon: <Network size={15} /> },
                  { id: 'nodes', label: 'Hardware Nodes', icon: <Cpu size={15} /> },
                  { id: 'firewall', label: 'Intrusion Firewall', icon: <Shield size={15} /> },
                  { id: 'blockchain', label: 'Event Blockchain', icon: <Database size={15} /> },
                  { id: 'simulator', label: 'Attack Simulator', icon: <Flame size={15} /> },
                  { id: 'analytics', label: 'Network Analytics', icon: <BarChart3 size={15} /> },
                  { id: 'logs', label: 'Serial Monitor', icon: <Terminal size={15} /> },
                  { id: 'reports', label: 'Security Reports', icon: <FileSpreadsheet size={15} /> },
                  { id: 'settings', label: 'System Settings', icon: <Settings size={15} /> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-3 py-2 text-xs rounded-md transition-all flex items-center space-x-2.5 font-medium ${
                      activeTab === item.id 
                        ? 'bg-cyber-deep/80 hover:bg-cyber-deep text-white shadow-glow-blue border-l-2 border-cyber-blue font-semibold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className={activeTab === item.id ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Warning indicator if no hardware */}
            {!state.system.serial_available && state.system.demo_mode && (
              <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-lg space-y-1">
                <div className="flex items-center space-x-1.5 text-yellow-500 text-[10px] font-bold">
                  <AlertTriangle size={12} className="shrink-0 animate-bounce" />
                  <span>DEMO MODE ACTIVE</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  USB COM Ports not detected. Injected attacks and nodes are automatically simulated.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-850 text-[9px] text-slate-500 space-y-1.5 font-semibold uppercase tracking-wider px-2">
            <div>Dept of EEE</div>
            <div>SRM Institute of Science & Tech</div>
          </div>
        </aside>

        {/* MAIN PANEL WORKSPACE */}
        <main className="flex-1 p-5 overflow-y-auto z-10 flex flex-col justify-between">
          <div className="flex-1">
            {/* SYSTEM BAR STATUS */}
            <StatusBar system={state.system} />

            {/* TAB PANELS ROUTING */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Central Canvas Topology + Hardware Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <NetworkTopology nodes={state.nodes} system={state.system} activeAttack={state.attacks.active_attack} />
                  </div>
                  <div>
                    <HardwareCards
                      nodes={state.nodes}
                      detectedPorts={state.system.detected_ports}
                      serialAvailable={state.system.serial_available}
                      onConnectNode={handleConnectNode}
                      onDisconnectNode={handleDisconnectNode}
                      onRestartNode={handleRestartNode}
                      onDiscoverPeers={handleDiscoverPeers}
                      onBlacklistNode={handleBlacklistNode}
                      onResetNodeStats={handleResetAll}
                      onPingNode={handlePingNode}
                      onRefreshPorts={handleResetAll}
                    />
                  </div>
                </div>

                {/* Serial Logs + Escalation step workflow */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <SerialMonitor logs={state.logs} onClearLogs={handleClearLogs} />
                  <FirewallPanel
                    firewall={state.firewall}
                    system={state.system}
                    activeAttack={state.attacks.active_attack}
                    nodes={state.nodes}
                    onEnableFirewall={handleEnableFirewall}
                    onDisableFirewall={handleDisableFirewall}
                    onActivateBlockchain={handleActivateBlockchain}
                    onResetAll={handleResetAll}
                  />
                </div>
              </div>
            )}

            {activeTab === 'mesh' && (
              <NetworkTopology nodes={state.nodes} system={state.system} activeAttack={state.attacks.active_attack} />
            )}

            {activeTab === 'nodes' && (
              <HardwareCards
                nodes={state.nodes}
                detectedPorts={state.system.detected_ports}
                serialAvailable={state.system.serial_available}
                onConnectNode={handleConnectNode}
                onDisconnectNode={handleDisconnectNode}
                onRestartNode={handleRestartNode}
                onDiscoverPeers={handleDiscoverPeers}
                onBlacklistNode={handleBlacklistNode}
                onResetNodeStats={handleResetAll}
                onPingNode={handlePingNode}
                onRefreshPorts={handleResetAll}
              />
            )}

            {activeTab === 'firewall' && (
              <FirewallPanel
                firewall={state.firewall}
                system={state.system}
                activeAttack={state.attacks.active_attack}
                nodes={state.nodes}
                onEnableFirewall={handleEnableFirewall}
                onDisableFirewall={handleDisableFirewall}
                onActivateBlockchain={handleActivateBlockchain}
                onResetAll={handleResetAll}
              />
            )}

            {activeTab === 'blockchain' && (
              <BlockchainLedger
                blockchain={state.blockchain}
                onActivateBlockchain={handleActivateBlockchain}
                onResetAll={handleResetAll}
              />
            )}

            {activeTab === 'simulator' && (
              <AttackSimulator
                attacks={state.attacks}
                system={state.system}
                onInjectAttack={handleInjectAttack}
                onStopAttack={handleStopAttack}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsCharts nodes={state.nodes} blockchain={state.blockchain} />
            )}

            {activeTab === 'logs' && (
              <SerialMonitor logs={state.logs} onClearLogs={handleClearLogs} />
            )}

            {activeTab === 'reports' && (
              <ReportGenerator onGenerateReport={handleGenerateReport} />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                system={state.system}
                onToggleDemoMode={handleToggleDemoMode}
                onResetAll={handleResetAll}
              />
            )}
          </div>

          {/* PROJECT FOOTER PANEL */}
          <footer className="mt-8 border-t border-slate-850 pt-4 pb-2 text-[10px] text-slate-500 font-mono-code leading-relaxed text-center select-none z-15">
            <div>
              <strong>Academic Project Showcase:</strong> Adaptive Secure Data Transmission in a Wireless Mesh Network Using Event-Triggered Lightweight Blockchain on ESP8266
            </div>
            <div className="mt-1 flex justify-center space-x-1.5">
              <span>Department of Electrical and Electronics Engineering</span>
              <span>•</span>
              <span>Centre for Intelligent Marine & Energy Systems (CIMES)</span>
              <span>•</span>
              <span>SRM Institute of Science and Technology</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
