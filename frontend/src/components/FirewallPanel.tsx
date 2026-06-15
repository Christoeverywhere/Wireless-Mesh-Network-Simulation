import React from 'react';
import { Shield, ShieldAlert, ShieldX, Play, ShieldAlert as DeepIcon, RefreshCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FirewallState, SystemStatus } from '../types';

interface FirewallPanelProps {
  firewall: FirewallState;
  system: SystemStatus;
  activeAttack: string | null;
  nodes: any;
  onEnableFirewall: () => Promise<void>;
  onDisableFirewall: () => Promise<void>;
  onActivateBlockchain: () => Promise<void>;
  onResetAll: () => Promise<void>;
}

export const FirewallPanel: React.FC<FirewallPanelProps> = ({
  firewall,
  system,
  activeAttack,
  nodes,
  onEnableFirewall,
  onDisableFirewall,
  onActivateBlockchain,
  onResetAll
}) => {
  
  // Resolve active step in security escalation pipeline
  const getEscalationStep = () => {
    // 0: Normal, 1: Attack Detected, 2: Firewall Triggered, 3: Escalated, 
    // 4: Genesis Block, 5: Blockchain Active, 6: Validation, 7: Isolation
    const anyBlacklisted = Object.values(nodes).some((n: any) => n.blacklisted);

    if (anyBlacklisted) return 7;
    if (system.blockchain_status === 'ACTIVE') {
      const genesisOnly = system.connected_count > 0 && Object.values(nodes).every((n: any) => n.blockchain_height === 0);
      return genesisOnly ? 4 : 6;
    }
    if (activeAttack && firewall.status) return 2;
    if (activeAttack && !firewall.status) return 1;
    return 0; // default normal
  };

  const currentStep = getEscalationStep();

  const steps = [
    { label: 'Normal Mesh', desc: 'Standard data routing' },
    { label: 'Attack Detected', desc: 'Anomalous serial signature' },
    { label: 'Firewall Triggered', desc: 'Packet inspection drop' },
    { label: 'Security Escalation', desc: 'Flagging network modes' },
    { label: 'Genesis Block', desc: 'Secure ledger creation' },
    { label: 'Blockchain Active', desc: 'Consensus activated' },
    { label: 'Distributed Validation', desc: 'Peer verification' },
    { label: 'Node Isolation', desc: 'Logical port blacklisting' }
  ];

  return (
    <div className="space-y-4">
      {/* Metrics & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Core Controls */}
        <div className="cyber-panel p-4 flex flex-col justify-between border-cyber-blue/10">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Firewall Config</span>
            <div className="flex items-center space-x-3 mt-2 mb-4">
              <div className={`p-2 rounded-md ${firewall.status ? 'bg-emerald-950/40 text-emerald-500' : 'bg-red-950/40 text-red-500'}`}>
                {firewall.status ? <Shield size={24} /> : <ShieldX size={24} />}
              </div>
              <div>
                <span className={`text-lg font-black block tracking-wider ${firewall.status ? 'text-emerald-500' : 'text-red-500'}`}>
                  {firewall.status ? 'ACTIVE (SECURE)' : 'DISABLED (BYPASS)'}
                </span>
                <span className="text-[9px] text-slate-500">Intrusion Prevention Engine</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {firewall.status ? (
              <button
                onClick={onDisableFirewall}
                className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-all"
              >
                <ShieldX size={12} />
                <span>Disable Firewall</span>
              </button>
            ) : (
              <button
                onClick={onEnableFirewall}
                className="w-full py-1.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30 text-emerald-500 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-all shadow-glow-green"
              >
                <Shield size={12} />
                <span>Enable Firewall</span>
              </button>
            )}

            <button
              onClick={onActivateBlockchain}
              disabled={system.blockchain_status === 'ACTIVE'}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-bold rounded flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40"
            >
              <DeepIcon size={12} className="text-cyber-blue" />
              <span>Force Escalation</span>
            </button>
            
            <button
              onClick={onResetAll}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 font-semibold rounded flex items-center justify-center space-x-1.5 transition-all"
            >
              <RefreshCcw size={12} />
              <span>Reset Firewall Counters</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-3 cyber-panel p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-cyber-blue/5">
          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Threats Detected</span>
            <span className={`text-2xl font-black mt-1 font-mono-code ${firewall.threat_counter > 0 ? 'text-red-500' : 'text-slate-200'}`}>
              {firewall.threat_counter} <span className="text-xs text-slate-500 font-normal">attacks</span>
            </span>
          </div>
          
          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Dropped Packets</span>
            <span className={`text-2xl font-black mt-1 font-mono-code ${firewall.dropped_packets > 0 ? 'text-orange-500' : 'text-slate-200'}`}>
              {firewall.dropped_packets}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Inspected Packets</span>
            <span className="text-2xl font-black mt-1 font-mono-code text-slate-200">
              {firewall.inspected_packets}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Intrusion Capture</span>
            <span className="text-2xl font-black mt-1 font-mono-code text-emerald-500">
              {firewall.detection_rate}%
            </span>
          </div>
        </div>
      </div>

      {/* EVENT-TRIGGERED BLOCKCHAIN ESCALATION WORKFLOW */}
      <div className="cyber-panel p-4 flex flex-col">
        <div className="cyber-panel-header mb-4">
          <span>Event-Triggered Blockchain Escalation Workflow</span>
          <span className="text-[10px] text-slate-500">Automated defense sequence</span>
        </div>
        
        {/* Step List Workflow */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            
            let badgeBorderColor = 'border-slate-800 bg-slate-900/40';
            let badgeTextColor = 'text-slate-500';
            let flowDotColor = 'bg-slate-700';

            if (isCompleted) {
              badgeBorderColor = 'border-emerald-500/20 bg-emerald-950/10';
              badgeTextColor = 'text-emerald-500';
              flowDotColor = 'bg-emerald-500';
            } else if (isActive) {
              badgeBorderColor = 'border-cyber-blue bg-cyber-blue/5 shadow-glow-blue';
              badgeTextColor = 'text-cyber-blue font-bold cyber-glow-text';
              flowDotColor = 'bg-cyber-blue animate-ping';
            }

            return (
              <div 
                key={idx} 
                className={`relative p-2.5 border rounded flex flex-col items-center justify-between text-center transition-all duration-350 min-h-[95px] ${badgeBorderColor}`}
              >
                {/* Connection line connector */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-[1px] bg-slate-800 z-0"></div>
                )}
                
                <div className="flex flex-col items-center space-y-1.5 z-10">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                    isCompleted ? 'bg-emerald-600' : isActive ? 'bg-cyber-deep' : 'bg-slate-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-[10px] tracking-wide block uppercase text-center leading-tight ${badgeTextColor}`}>
                    {step.label}
                  </span>
                </div>
                <span className="text-[8px] text-slate-500 mt-1 select-none leading-normal">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current status comment */}
        <div className="mt-4 p-3 bg-slate-900/50 border border-slate-850 rounded flex items-center space-x-2 text-xs font-mono-code text-slate-400">
          <DeepIcon size={14} className="text-cyber-blue animate-pulse" />
          <span>
            {currentStep === 0 && 'System operating normally. Standard routing tables are active across Node A, B, and C.'}
            {currentStep === 1 && 'Intrusion signatures detected! Critical threat vectors identified in incoming serial packets.'}
            {currentStep === 2 && 'Deep Packet inspection matched blacklisted signatures. Firewall is dropping anomalous bytes.'}
            {currentStep >= 4 && currentStep <= 6 && 'Distributed Security Escalation triggered. Event blockchain active. Verifying hashes.'}
            {currentStep === 7 && 'Malicious sender isolated. The system has blacklisted the node and restored secure network integrity.'}
          </span>
        </div>
      </div>
    </div>
  );
};
