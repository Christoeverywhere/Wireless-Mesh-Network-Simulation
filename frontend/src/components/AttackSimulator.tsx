import React from 'react';
import { Flame, ShieldAlert, Ban, ShieldCheck, XCircle, AlertCircle, History, Radio } from 'lucide-react';
import { AttackState, SystemStatus } from '../types';

interface AttackSimulatorProps {
  attacks: AttackState;
  system: SystemStatus;
  onInjectAttack: (attackType: string) => Promise<void>;
  onStopAttack: () => Promise<void>;
}

export const AttackSimulator: React.FC<AttackSimulatorProps> = ({
  attacks,
  system,
  onInjectAttack,
  onStopAttack
}) => {
  
  const threatVectors = [
    { type: 'tampered_packet', label: 'Tampered Packet', desc: 'Injects fake sensor telemetry (e.g., TEMP=99C) into mesh.' },
    { type: 'replay_attack', label: 'Replay Attack', desc: 'Rebroadcasts intercepted sequence blocks to bypass firewall.' },
    { type: 'invalid_hash', label: 'Invalid Hash', desc: 'Injects valid message payload with corrupt checksum digest.' },
    { type: 'fake_sender', label: 'Fake Sender', desc: 'Spoofs node identity in Hello and data packets.' },
    { type: 'flood_attack', label: 'Flood Attack', desc: 'Floods mesh router channels to disrupt queue routing.' },
    { type: 'malformed_packet', label: 'Malformed Packet', desc: 'Injects misaligned headers and non-conforming packet formats.' }
  ];

  return (
    <div className="space-y-4">
      {/* Simulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Attack Panel */}
        <div className="cyber-panel p-4 flex flex-col justify-between border-red-950/20">
          <div className="cyber-panel-header mb-4">
            <span className="flex items-center space-x-2">
              <Flame size={14} className="text-red-500" />
              <span>Threat Injector Control</span>
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {attacks.active_attack ? (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-center space-y-2">
                <ShieldAlert size={28} className="text-red-500 mx-auto animate-bounce" />
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  ACTIVE ATTACK INJECTED
                </h4>
                <p className="text-[10px] text-red-500 font-mono-code font-bold uppercase">
                  {attacks.active_attack.replace('_', ' ')}
                </p>
                <button
                  onClick={onStopAttack}
                  className="w-full mt-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Ban size={12} />
                  <span>Terminate Attack</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded text-center py-6 text-slate-500">
                <ShieldCheck size={28} className="text-emerald-500 mx-auto opacity-70 mb-2" />
                <h4 className="text-xs font-bold text-slate-400 uppercase">
                  System Operating Normally
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Select a threat vector below to test mesh node resistance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-2 cyber-panel p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-slate-800/80">
          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Attacks</span>
            <span className="text-2xl font-black mt-1 font-mono-code text-slate-200">
              {attacks.total_attacks}
            </span>
          </div>
          
          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Blocked Threats</span>
            <span className="text-2xl font-black mt-1 font-mono-code text-emerald-500">
              {attacks.blocked_attacks}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 border border-slate-850 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">System Resistance</span>
            <span className="text-2xl font-black mt-1 font-mono-code text-cyber-blue">
              {attacks.detection_rate}%
            </span>
          </div>
        </div>
      </div>

      {/* threat vectors list */}
      <div className="cyber-panel p-4 flex flex-col">
        <div className="cyber-panel-header mb-4">
          <span>Supported Research Threat Vectors</span>
          <span className="text-[10px] text-slate-500 font-mono-code">Select to execute injection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {threatVectors.map((vector) => {
            const isTargeted = attacks.active_attack === vector.type;
            return (
              <div
                key={vector.type}
                className={`p-3 border rounded-lg flex flex-col justify-between transition-all duration-300 ${
                  isTargeted 
                    ? 'border-red-500 bg-red-950/10 shadow-glow-red' 
                    : 'border-slate-850 hover:border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold tracking-wide flex items-center space-x-1.5 ${isTargeted ? 'text-red-500' : 'text-slate-200'}`}>
                    <AlertCircle size={14} className={isTargeted ? 'text-red-500 animate-spin' : 'text-slate-500'} />
                    <span>{vector.label}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    {vector.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800/40">
                  {isTargeted ? (
                    <button
                      onClick={onStopAttack}
                      className="w-full py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition-colors"
                    >
                      Stop Simulation
                    </button>
                  ) : (
                    <button
                      onClick={() => onInjectAttack(vector.type)}
                      disabled={!!attacks.active_attack}
                      className="w-full py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 hover:text-red-400 text-[10px] font-bold rounded transition-colors disabled:opacity-40"
                    >
                      Inject Threat Vector
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THREAT TIMELINE */}
      <div className="cyber-panel flex flex-col">
        <div className="cyber-panel-header">
          <span className="flex items-center space-x-1.5">
            <History size={14} className="text-slate-400" />
            <span>Attack Injection History Log</span>
          </span>
          <span className="text-[10px] text-slate-500">Chronological security ledger</span>
        </div>

        <div className="p-4 bg-[#070b13] overflow-y-auto max-h-[200px] text-xs font-mono-code space-y-2">
          {attacks.attack_timeline.length === 0 ? (
            <div className="text-slate-600 italic text-center py-6">
              No threats recorded in this monitoring session.
            </div>
          ) : (
            [...attacks.attack_timeline].reverse().map((t, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-900/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-[10px]">{t.timestamp}</span>
                  <span className="px-1.5 py-px rounded bg-red-950/40 text-red-500 border border-red-900/20 text-[9px] uppercase font-bold tracking-wide">
                    {t.attack.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">threat injected into Node C.</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider ${
                    t.status === 'Intercepted' 
                      ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/20' 
                      : 'bg-red-950 text-red-500 border border-red-900'
                  }`}>
                    {t.status === 'Intercepted' ? 'Blocked & Mitigated' : 'Breached / No Firewall'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
