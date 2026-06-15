import React, { useEffect, useState } from 'react';
import { Network, Database, ShieldAlert, Cpu } from 'lucide-react';
import { NodeStatus, SystemStatus } from '../types';

interface NetworkTopologyProps {
  nodes: Record<string, NodeStatus>;
  system: SystemStatus;
  activeAttack: string | null;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  nodes,
  system,
  activeAttack
}) => {
  const [pulseToggler, setPulseToggler] = useState(false);

  // Periodic toggler for packet animations
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseToggler(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Node Coordinates inside viewBox="0 0 600 350"
  const coords = {
    A: { x: 300, y: 70 },
    B: { x: 140, y: 260 },
    C: { x: 460, y: 260 }
  };

  // Check if link should draw
  const isLinkActive = (n1: string, n2: string) => {
    const node1 = nodes[n1];
    const node2 = nodes[n2];
    if (!node1 || !node2) return false;
    
    // If either node is disconnected or blacklisted, the link is broken
    if (node1.status !== 'connected' || node1.blacklisted) return false;
    if (node2.status !== 'connected' || node2.blacklisted) return false;
    return true;
  };

  // Check if link is under attack
  const isLinkThreat = (n1: string, n2: string) => {
    if (!activeAttack) return false;
    // Node C is typically the attacker in our model
    const attacker = 'C';
    if (nodes['C']?.blacklisted) {
      // If C is blacklisted, C is isolated. If B is attacking, map to B
      return (n1 === 'B' || n2 === 'B') && isLinkActive(n1, n2);
    }
    return (n1 === attacker || n2 === attacker) && isLinkActive(n1, n2);
  };

  const totalPackets = Object.values(nodes).reduce((acc, curr) => acc + curr.packets_sent + curr.packets_received, 0);
  const totalRelays = Object.values(nodes).reduce((acc, curr) => acc + curr.relay_count, 0);

  return (
    <div className="cyber-panel flex flex-col h-[480px] border-cyber-blue/10">
      <div className="cyber-panel-header">
        <span className="flex items-center space-x-2">
          <Network size={14} className="text-cyber-blue" />
          <span>Live Mesh Network Topology</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono-code">
          Consensus Mode: {system.blockchain_status === 'ACTIVE' ? 'Event Blockchain (Active)' : 'Standard Mesh (No Blockchain)'}
        </span>
      </div>

      <div className="relative flex-1 bg-[#070b13] cyber-grid flex items-center justify-center overflow-hidden">
        {/* SVG Canvas for topology lines and packets */}
        <svg viewBox="0 0 600 350" className="w-full h-full max-h-[380px] z-10">
          <defs>
            {/* Arrow Markers for routes */}
            <marker id="arrow" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f0ff" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>

            {/* Glowing filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* NETWORKING LINKS / CHANNELS */}
          {/* Link A -> B */}
          {isLinkActive('A', 'B') && (
            <>
              <line 
                x1={coords.A.x} y1={coords.A.y} x2={coords.B.x} y2={coords.B.y} 
                stroke={isLinkThreat('A', 'B') ? '#ef4444' : system.blockchain_status === 'ACTIVE' ? '#00f0ff' : '#1e293b'} 
                strokeWidth={system.blockchain_status === 'ACTIVE' ? "2" : "1.5"}
                className={isLinkThreat('A', 'B') ? "animate-dash-fast" : "animate-dash-medium"} 
                strokeDasharray="5,5"
              />
              {/* Packet Flow Animation Circle */}
              <circle r="4" fill={isLinkThreat('A', 'B') ? '#ef4444' : '#00f0ff'}>
                <animateMotion 
                  path={`M ${coords.A.x} ${coords.A.y} L ${coords.B.x} ${coords.B.y}`} 
                  dur="2.5s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </>
          )}

          {/* Link A -> C */}
          {isLinkActive('A', 'C') && (
            <>
              <line 
                x1={coords.A.x} y1={coords.A.y} x2={coords.C.x} y2={coords.C.y} 
                stroke={isLinkThreat('A', 'C') ? '#ef4444' : system.blockchain_status === 'ACTIVE' ? '#00f0ff' : '#1e293b'} 
                strokeWidth={system.blockchain_status === 'ACTIVE' ? "2" : "1.5"}
                className={isLinkThreat('A', 'C') ? "animate-dash-fast" : "animate-dash-medium"}
                strokeDasharray="5,5"
              />
              {/* Packet Flow Animation Circle */}
              <circle r="4" fill={isLinkThreat('A', 'C') ? '#ef4444' : '#00f0ff'}>
                <animateMotion 
                  path={`M ${coords.A.x} ${coords.A.y} L ${coords.C.x} ${coords.C.y}`} 
                  dur="2.2s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </>
          )}

          {/* Link B -> C */}
          {isLinkActive('B', 'C') && (
            <>
              <line 
                x1={coords.B.x} y1={coords.B.y} x2={coords.C.x} y2={coords.C.y} 
                stroke={isLinkThreat('B', 'C') ? '#ef4444' : system.blockchain_status === 'ACTIVE' ? '#00f0ff' : '#1e293b'} 
                strokeWidth={system.blockchain_status === 'ACTIVE' ? "2" : "1.5"}
                className={isLinkThreat('B', 'C') ? "animate-dash-fast" : "animate-dash-medium"}
                strokeDasharray="5,5"
              />
              {/* Packet Flow Animation Circle */}
              <circle r="4" fill={isLinkThreat('B', 'C') ? '#ef4444' : '#00f0ff'}>
                <animateMotion 
                  path={`M ${coords.B.x} ${coords.B.y} L ${coords.C.x} ${coords.C.y}`} 
                  dur="3s" 
                  repeatCount="indefinite" 
                />
              </circle>
              {/* Reverse direction (acknowledgement relay representation) */}
              <circle r="2.5" fill="#10b981">
                <animateMotion 
                  path={`M ${coords.C.x} ${coords.C.y} L ${coords.B.x} ${coords.B.y}`} 
                  dur="3.8s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </>
          )}

          {/* GRAPH NODES */}
          {Object.entries(coords).map(([id, pt]) => {
            const node = nodes[id];
            if (!node) return null;

            const isNodeActive = node.status === 'connected';
            const isIsolated = node.blacklisted;
            const isMalicious = activeAttack && id === 'C' && !isIsolated;
            
            // Halo color
            let haloColor = 'rgba(100, 116, 139, 0.2)'; // Slate
            if (isIsolated) haloColor = 'rgba(239, 68, 68, 0.4)'; // Dark red
            else if (isMalicious) haloColor = 'rgba(239, 68, 68, 0.6)'; // Bright red
            else if (isNodeActive) {
              haloColor = system.blockchain_status === 'ACTIVE' 
                ? 'rgba(0, 240, 255, 0.35)' 
                : 'rgba(16, 185, 129, 0.3)';
            }

            return (
              <g key={id} className="cursor-pointer">
                {/* Outer pulsing ring */}
                {isNodeActive && !isIsolated && (
                  <circle 
                    cx={pt.x} cy={pt.y} r="32" 
                    fill="none" 
                    stroke={isMalicious ? '#ef4444' : system.blockchain_status === 'ACTIVE' ? '#00f0ff' : '#10b981'} 
                    strokeWidth="1" 
                    className="node-pulse-ring"
                  />
                )}

                {/* Main Node Circle */}
                <circle 
                  cx={pt.x} cy={pt.y} r="20" 
                  fill="#0c1220" 
                  stroke={isIsolated ? '#ef4444' : isMalicious ? '#ef4444' : isNodeActive ? (system.blockchain_status === 'ACTIVE' ? '#00f0ff' : '#10b981') : '#475569'} 
                  strokeWidth="2"
                  filter={isMalicious ? 'url(#glow-red)' : system.blockchain_status === 'ACTIVE' && isNodeActive ? 'url(#glow-cyan)' : undefined}
                />

                {/* Node Label ID */}
                <text 
                  x={pt.x} y={pt.y + 4} 
                  textAnchor="middle" 
                  fill={isIsolated ? '#ef4444' : isNodeActive ? '#f8fafc' : '#64748b'} 
                  className="text-xs font-bold font-mono-code"
                >
                  {id}
                </text>

                {/* IP Tag below node */}
                <rect 
                  x={pt.x - 45} y={pt.y + 26} 
                  width="90" height="15" rx="3" 
                  fill="#090e18" 
                  stroke={isIsolated ? '#7f1d1d' : '#1e293b'} 
                  strokeWidth="0.8" 
                />
                <text 
                  x={pt.x} y={pt.y + 37} 
                  textAnchor="middle" 
                  fill={isIsolated ? '#ef4444' : isNodeActive ? '#94a3b8' : '#475569'} 
                  className="text-[8px] font-semibold font-mono-code"
                >
                  {isIsolated ? 'ISOLATED' : node.ip || 'DISCONNECTED'}
                </text>

                {/* Malware / Target Overlay */}
                {isMalicious && (
                  <g transform={`translate(${pt.x - 30}, ${pt.y - 30})`}>
                    <circle cx="10" cy="10" r="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" className="animate-ping" />
                    <circle cx="10" cy="10" r="5" fill="#ef4444" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* TOPOLOGY OVERLAY METRICS PANEL */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#0a0f1d]/90 border border-slate-800 rounded px-4 py-2 z-20 flex flex-wrap items-center justify-between text-xs font-mono-code text-slate-400 gap-2">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse"></div>
            <span>Traffic Inspections: <strong className="text-slate-200">{totalPackets} packets</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Relays Completed: <strong className="text-slate-200">{totalRelays} hops</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>Consensus Ledger Size: <strong className="text-slate-200">{system.blockchain_status === 'ACTIVE' ? `${nodes['A']?.blockchain_height || 0} Blocks` : '0 (Mesh Mode)'}</strong></span>
          </div>
        </div>

        {/* Dynamic Watermark / Warning Overlay */}
        {activeAttack && (
          <div className="absolute top-3 right-3 bg-red-950/40 border border-red-500/30 rounded px-3 py-1 z-20 flex items-center space-x-2 animate-pulse">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-[10px] uppercase font-bold text-red-500 font-mono-code">
              Intrusion Active: {activeAttack.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
