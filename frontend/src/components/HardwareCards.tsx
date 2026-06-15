import React, { useState } from 'react';
import { Cpu, RefreshCw, Unlink, Link2, RotateCcw, ShieldAlert, ShieldCheck, Wifi, Eye, Radio } from 'lucide-react';
import { NodeStatus } from '../types';

interface HardwareCardsProps {
  nodes: Record<string, NodeStatus>;
  detectedPorts: string[];
  serialAvailable: boolean;
  onConnectNode: (nodeId: string, port: string) => Promise<void>;
  onDisconnectNode: (nodeId: string, port: string) => Promise<void>;
  onRestartNode: (nodeId: string) => Promise<void>;
  onDiscoverPeers: (nodeId: string) => Promise<void>;
  onBlacklistNode: (nodeId: string) => Promise<void>;
  onResetNodeStats: (nodeId: string) => Promise<void>;
  onPingNode: (nodeId: string) => void;
  onRefreshPorts: () => void;
}

export const HardwareCards: React.FC<HardwareCardsProps> = ({
  nodes,
  detectedPorts,
  serialAvailable,
  onConnectNode,
  onDisconnectNode,
  onRestartNode,
  onDiscoverPeers,
  onBlacklistNode,
  onResetNodeStats,
  onPingNode,
  onRefreshPorts
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('A');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(true);
  const [busyNodes, setBusyNodes] = useState<Record<string, boolean>>({});

  // Ensure selectedPort is set if detectedPorts changes
  React.useEffect(() => {
    if (detectedPorts.length > 0 && !selectedPort) {
      setSelectedPort(detectedPorts[0]);
    }
  }, [detectedPorts, selectedPort]);

  const handleAction = async (nodeId: string, actionName: string, callback: () => Promise<void>) => {
    setBusyNodes(prev => ({ ...prev, [`${nodeId}-${actionName}`]: true }));
    try {
      await callback();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyNodes(prev => ({ ...prev, [`${nodeId}-${actionName}`]: false }));
    }
  };

  const getLedColorClass = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-security-success led-glow-green animate-pulse';
      case 'disconnected':
        return 'bg-security-threat led-glow-red';
      case 'connecting':
        return 'bg-security-warning led-glow-yellow animate-ping';
      default:
        return 'bg-security-unknown led-glow-gray';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
      {/* SERIAL PORT DETECTION PANEL */}
      <div className="col-span-1 cyber-panel flex flex-col h-full">
        <div className="cyber-panel-header">
          <span>Serial Port Detection</span>
          <Radio size={14} className="text-cyber-blue" />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Available COM Ports</span>
              <button 
                onClick={onRefreshPorts}
                className="p-1 text-slate-400 hover:text-cyber-blue transition-colors rounded hover:bg-slate-800"
                title="Refresh COM Ports"
              >
                <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '10s' }} />
              </button>
            </div>
            
            {detectedPorts.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 px-2 bg-slate-900/50 border border-slate-800 rounded font-mono-code">
                No active ports found. Using mock simulation list (COM5, COM8, COM10).
              </div>
            ) : (
              <select 
                value={selectedPort} 
                onChange={(e) => setSelectedPort(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              >
                {detectedPorts.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}
            
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Target Node Selection</span>
              <div className="grid grid-cols-3 gap-1">
                {['A', 'B', 'C'].map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedNode(n)}
                    className={`py-1 text-xs rounded border transition-all ${
                      selectedNode === n 
                        ? 'border-cyber-blue text-cyber-blue bg-cyber-blue/5' 
                        : 'border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900/40'
                    }`}
                  >
                    Node {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                const port = selectedPort || (selectedNode === 'A' ? 'COM5' : selectedNode === 'B' ? 'COM8' : 'COM10');
                handleAction(selectedNode, 'connect', () => onConnectNode(selectedNode, port));
              }}
              disabled={busyNodes[`${selectedNode}-connect`] || nodes[selectedNode]?.status === 'connected'}
              className="w-full py-1.5 bg-cyber-deep/80 hover:bg-cyber-deep text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Link2 size={14} />
              <span>Connect Node {selectedNode}</span>
            </button>
            
            <button
              onClick={() => {
                const port = nodes[selectedNode]?.com_port || 'COM5';
                handleAction(selectedNode, 'disconnect', () => onDisconnectNode(selectedNode, port));
              }}
              disabled={busyNodes[`${selectedNode}-disconnect`] || nodes[selectedNode]?.status !== 'connected'}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Unlink size={14} />
              <span>Disconnect Node</span>
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>Driver: {serialAvailable ? 'PySerial Link' : 'Simulated Driver'}</span>
              <span className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoScanning ? 'bg-cyber-blue animate-pulse' : 'bg-slate-600'}`}></span>
                <span>Auto Scan</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE HARDWARE NODES CARDS */}
      {['A', 'B', 'C'].map((id) => {
        const node = nodes[id];
        if (!node) return null;

        const isBlacklisted = node.blacklisted;
        const isBusyRestart = busyNodes[`${id}-restart`];
        const isBusyDiscover = busyNodes[`${id}-discover`];
        const isBusyBlacklist = busyNodes[`${id}-blacklist`];
        const isBusyReset = busyNodes[`${id}-reset`];

        return (
          <div 
            key={id} 
            className={`cyber-panel flex flex-col justify-between transition-all duration-300 ${
              isBlacklisted 
                ? 'border-red-950 shadow-red-950/20' 
                : node.status === 'connected' 
                  ? 'border-cyber-blue/30 shadow-cyber-blue/5' 
                  : 'border-slate-800/80'
            }`}
          >
            {/* CARD HEADER */}
            <div className="cyber-panel-header">
              <span className="flex items-center space-x-2">
                <Cpu size={14} className={node.status === 'connected' ? 'text-cyber-blue' : 'text-slate-500'} />
                <span>Node {id} Hardware Card</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-mono-code font-bold tracking-normal text-slate-400">
                  {node.status}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${getLedColorClass(node.status)}`}></span>
              </span>
            </div>

            {/* CARD METRICS */}
            <div className="p-4 space-y-2 flex-1">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">COM Port</span>
                  <span className="font-mono-code text-slate-200">{node.com_port || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">IP Address</span>
                  <span className="font-mono-code text-slate-200">{node.ip || 'DISCONNECTED'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">WiFi Link</span>
                  <span className="flex items-center space-x-1 text-slate-200">
                    <Wifi size={12} className={node.wifi_status === 'connected' ? 'text-cyber-blue' : 'text-slate-600'} />
                    <span className="font-mono-code capitalize">{node.wifi_status}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Trust Score</span>
                  <span className={`font-mono-code font-bold ${
                    node.trust_score >= 80 
                      ? 'text-emerald-500' 
                      : node.trust_score >= 50 
                        ? 'text-warning' 
                        : 'text-red-500'
                  }`}>
                    {node.trust_score}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Ledger Height</span>
                  <span className="font-mono-code text-slate-200">{node.blockchain_height} Blocks</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Last Contact</span>
                  <span className="font-mono-code text-[10px] text-slate-300 truncate block">
                    {node.last_seen ? node.last_seen.split(' ')[1] : 'N/A'}
                  </span>
                </div>
              </div>

              {/* MESH ROUTER STATISTICS */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-1 text-[10px] text-center font-mono-code text-slate-400">
                <div className="bg-slate-900/50 py-1 rounded">
                  <span className="block text-slate-500">TX</span>
                  <span className="text-slate-300 font-bold">{node.packets_sent}</span>
                </div>
                <div className="bg-slate-900/50 py-1 rounded">
                  <span className="block text-slate-500">RX</span>
                  <span className="text-slate-300 font-bold">{node.packets_received}</span>
                </div>
                <div className="bg-slate-900/50 py-1 rounded">
                  <span className="block text-slate-500">RLY</span>
                  <span className="text-slate-300 font-bold">{node.relay_count}</span>
                </div>
                <div className="bg-slate-900/50 py-1 rounded">
                  <span className="block text-slate-500">BAD</span>
                  <span className={`font-bold ${node.bad_count > 0 ? 'text-red-500' : 'text-slate-400'}`}>{node.bad_count}</span>
                </div>
              </div>
            </div>

            {/* CARD CONTROL ACTIONS */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-1 bg-[#090e18]/40 pt-2 border-t border-slate-800/40">
              <button
                onClick={() => handleAction(id, 'restart', () => onRestartNode(id))}
                disabled={isBusyRestart}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] rounded text-slate-300 flex items-center justify-center space-x-1 transition-all"
              >
                <RotateCcw size={10} className={isBusyRestart ? 'animate-spin' : ''} />
                <span>Restart</span>
              </button>

              <button
                onClick={() => handleAction(id, 'discover', () => onDiscoverPeers(id))}
                disabled={isBusyDiscover || node.status !== 'connected'}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] rounded text-slate-300 flex items-center justify-center space-x-1 transition-all disabled:opacity-40"
              >
                <Radio size={10} className={isBusyDiscover ? 'animate-pulse' : ''} />
                <span>Discover</span>
              </button>

              <button
                onClick={() => onPingNode(id)}
                disabled={node.status !== 'connected'}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] rounded text-slate-300 flex items-center justify-center space-x-1 transition-all disabled:opacity-40"
              >
                <Eye size={10} />
                <span>Ping Node</span>
              </button>

              {isBlacklisted ? (
                <button
                  onClick={() => handleAction(id, 'restart', () => onRestartNode(id))}
                  className="py-1 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/40 text-[10px] rounded text-emerald-500 flex items-center justify-center space-x-1 transition-all font-bold"
                >
                  <ShieldCheck size={10} />
                  <span>Unblacklist</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAction(id, 'blacklist', () => onBlacklistNode(id))}
                  disabled={isBusyBlacklist || node.status !== 'connected'}
                  className="py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[10px] rounded text-red-500 flex items-center justify-center space-x-1 transition-all font-bold disabled:opacity-40"
                >
                  <ShieldAlert size={10} />
                  <span>Blacklist</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
