import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Cpu, Radio, Database, Wifi, Clock, Server } from 'lucide-react';
import { SystemStatus } from '../types';

interface StatusBarProps {
  system: SystemStatus;
}

export const StatusBar: React.FC<StatusBarProps> = ({ system }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-500 bg-red-950/40 border-red-500/30 cyber-glow-text-red';
      case 'HIGH':
        return 'text-orange-500 bg-orange-950/40 border-orange-500/30';
      case 'MEDIUM':
        return 'text-yellow-500 bg-yellow-950/40 border-yellow-500/30';
      default:
        return 'text-emerald-500 bg-emerald-950/40 border-emerald-500/30 cyber-glow-text-green';
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
      {/* Operating Mode Card */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 cyber-panel px-4 py-3 flex items-center justify-between border-cyber-blue/20">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">System Mode</span>
          <span className={`text-sm font-bold tracking-wide mt-1 block ${
            system.mode.includes('SECURE') ? 'text-cyber-blue cyber-glow-text' : 'text-slate-200'
          }`}>
            {system.mode}
          </span>
        </div>
        <div className={`p-2 rounded-md ${system.mode.includes('SECURE') ? 'bg-cyber-blue/10' : 'bg-slate-800'}`}>
          <Database size={18} className={system.mode.includes('SECURE') ? 'text-cyber-blue animate-pulse' : 'text-slate-400'} />
        </div>
      </div>

      {/* Connected Nodes Card */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Active Nodes</span>
          <span className="text-xl font-bold font-mono-code text-slate-200 mt-0.5 block">
            {system.connected_count} / 3
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <Cpu size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Peer Discovery status */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Peer Discovery</span>
          <span className={`text-xs font-bold mt-1.5 block px-1.5 py-0.5 rounded border text-center ${
            system.peer_discovery_status === 'STABLE' 
              ? 'text-emerald-500 border-emerald-500/20 bg-emerald-950/20' 
              : 'text-yellow-500 border-yellow-500/20 bg-yellow-950/20 animate-pulse'
          }`}>
            {system.peer_discovery_status}
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <Radio size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Threat Level */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Threat Level</span>
          <span className={`text-xs font-bold mt-1.5 block px-2 py-0.5 rounded border text-center ${getThreatColor(system.threat_level)}`}>
            {system.threat_level}
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <ShieldAlert size={18} className={system.threat_level === 'CRITICAL' || system.threat_level === 'HIGH' ? 'text-red-500 animate-bounce' : 'text-slate-400'} />
        </div>
      </div>

      {/* Firewall status */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Firewall</span>
          <span className={`text-xs font-bold mt-1.5 block px-1.5 py-0.5 rounded border text-center ${
            system.firewall_status 
              ? 'text-emerald-500 border-emerald-500/20 bg-emerald-950/20' 
              : 'text-red-500 border-red-500/20 bg-red-950/20 animate-pulse'
          }`}>
            {system.firewall_status ? 'SECURED' : 'BYPASSED'}
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <Shield size={18} className={system.firewall_status ? 'text-emerald-500' : 'text-red-500'} />
        </div>
      </div>

      {/* Hotspot & Network status */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">WiFi Hotspot</span>
          <span className="text-sm font-bold text-emerald-500 mt-1 block">
            {system.hotspot_status}
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <Wifi size={18} className="text-emerald-500" />
        </div>
      </div>

      {/* System Uptime & Clock */}
      <div className="cyber-panel px-4 py-3 flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Sys Uptime</span>
          <span className="text-xs font-mono-code text-slate-200 mt-1 block tracking-wider">
            {formatUptime(system.uptime)}
          </span>
        </div>
        <div className="p-2 rounded-md bg-slate-800">
          <Server size={18} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
};
