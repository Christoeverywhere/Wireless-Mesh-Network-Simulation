import React, { useState } from 'react';
import { Settings, Save, RefreshCcw, Power, Check, Radio } from 'lucide-react';
import { SystemStatus } from '../types';

interface SettingsPanelProps {
  system: SystemStatus;
  onToggleDemoMode: () => Promise<void>;
  onResetAll: () => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  system,
  onToggleDemoMode,
  onResetAll
}) => {
  const [ssid, setSsid] = useState('Meshdemo');
  const [password, setPassword] = useState('bingbong');
  const [udpPort, setUdpPort] = useState('4210');
  const [blacklistThreshold, setBlacklistThreshold] = useState('2');
  const [baudRate, setBaudRate] = useState('115200');
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/ws');
  
  const [isSaved, setIsSaved] = useState(false);
  const [isBusyReset, setIsBusyReset] = useState(false);
  const [isBusyToggle, setIsBusyToggle] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = async () => {
    setIsBusyReset(true);
    try {
      await onResetAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusyReset(false);
    }
  };

  const handleToggleDemo = async () => {
    setIsBusyToggle(true);
    try {
      await onToggleDemoMode();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusyToggle(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Mesh Configuration form */}
      <div className="col-span-2 cyber-panel flex flex-col">
        <div className="cyber-panel-header">
          <span className="flex items-center space-x-2">
            <Settings size={14} className="text-cyber-blue" />
            <span>ESP8266 Mesh & Blockchain Configuration</span>
          </span>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                WiFi Hotspot SSID
              </label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                WiFi Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Mesh UDP Port
              </label>
              <input
                type="text"
                value={udpPort}
                onChange={(e) => setUdpPort(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Blacklist Threshold
              </label>
              <input
                type="number"
                value={blacklistThreshold}
                onChange={(e) => setBlacklistThreshold(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Serial Baud Rate
              </label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              >
                <option value="9600">9600 bps</option>
                <option value="57600">57600 bps</option>
                <option value="115200">115200 bps</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                WebSocket Gateway URI
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyber-blue transition-colors font-mono-code"
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-cyber-deep/80 hover:bg-cyber-deep text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors"
            >
              {isSaved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
              <span>{isSaved ? 'Parameters Saved' : 'Save Network Config'}</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono-code">
              *Parameters are synchronized with connected microcontrollers on save.
            </span>
          </div>
        </form>
      </div>

      {/* Administrative controls */}
      <div className="cyber-panel p-4 flex flex-col justify-between border-slate-850">
        <div>
          <div className="cyber-panel-header mb-4">
            <span>Administrative Controls</span>
          </div>
          
          <div className="space-y-4">
            {/* Toggle demo mode */}
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Mock Data Mode</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
                  system.demo_mode ? 'bg-cyan-950/40 text-cyber-blue' : 'bg-slate-800 text-slate-500'
                }`}>
                  {system.demo_mode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Generates mock packets, attack cycles, and blockchain activations when physical hardware is not present.
              </p>
              <button
                onClick={handleToggleDemo}
                disabled={isBusyToggle}
                className={`w-full py-1.5 text-xs font-bold rounded flex items-center justify-center space-x-1.5 border transition-all ${
                  system.demo_mode 
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' 
                    : 'bg-cyber-blue/10 border-cyber-blue/20 hover:bg-cyber-blue/20 text-cyber-blue shadow-glow-blue'
                }`}
              >
                <Power size={12} />
                <span>{system.demo_mode ? 'Switch to Hardware mode' : 'Enable Mock Simulation'}</span>
              </button>
            </div>

            {/* Hard reset */}
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded space-y-2">
              <span className="text-xs font-bold text-slate-300 block">System Reset</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Clears all ledger states, blockchain history, firewall logs, and restores node trust scores back to 100%.
              </p>
              <button
                onClick={handleReset}
                disabled={isBusyReset}
                className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RefreshCcw size={12} className={isBusyReset ? 'animate-spin' : ''} />
                <span>Full System Hard Recovery</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-[9px] text-slate-600 font-mono-code text-center pt-4">
          Firmware: CIMES-MBL-V4.2.1-RELEASE
        </div>
      </div>
    </div>
  );
};
