import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Trash2, Download, Search, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface SerialMonitorProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ logs, onClearLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterNode, setFilterNode] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Buffer incoming logs based on Pause state
  useEffect(() => {
    if (!isPaused) {
      setDisplayedLogs(logs);
    }
  }, [logs, isPaused]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isPaused) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs, isPaused]);

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'attack_detected':
      case 'node_blacklisted':
        return 'bg-red-950/50 text-red-500 border-red-900/35';
      case 'firewall_triggered':
        return 'bg-orange-950/50 text-orange-500 border-orange-900/35';
      case 'block_verified':
      case 'genesis_block_created':
        return 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/25';
      case 'packet_sent':
      case 'packet_received':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
      case 'node_connected':
      case 'node_disconnected':
        return 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(displayedLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mesh_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter and Search logic
  const filteredLogs = displayedLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.node.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || log.event_type === filterType;
    const matchesNode = filterNode === 'ALL' || log.node === filterNode;

    return matchesSearch && matchesType && matchesNode;
  });

  // Unique list of event types for filtering
  const eventTypes = ['ALL', ...new Set(logs.map(l => l.event_type))];

  return (
    <div className="cyber-panel flex flex-col h-[520px]">
      {/* HEADER CONTROLS */}
      <div className="cyber-panel-header flex-wrap gap-2">
        <span className="flex items-center space-x-2">
          <Terminal size={14} className="text-cyber-blue" />
          <span>Real-Time Serial Log Monitor</span>
        </span>
        
        <div className="flex items-center space-x-2">
          {/* Node Filter */}
          <div className="flex items-center space-x-1">
            <Filter size={10} className="text-slate-500" />
            <select
              value={filterNode}
              onChange={(e) => setFilterNode(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 outline-none"
            >
              <option value="ALL">All Nodes</option>
              <option value="A">Node A</option>
              <option value="B">Node B</option>
              <option value="C">Node C</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 outline-none max-w-[120px]"
          >
            <option value="ALL">All Events</option>
            {eventTypes.filter(t => t !== 'ALL').map(t => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search size={10} className="absolute left-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-5 pr-2 py-0.5 text-[10px] text-slate-300 outline-none focus:border-cyber-blue max-w-[110px]"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          {/* Pause/Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded transition-colors ${isPaused ? 'text-emerald-500 hover:bg-emerald-950/20' : 'text-slate-400 hover:bg-slate-800'}`}
            title={isPaused ? "Resume logging" : "Pause logging"}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>

          {/* Clear logs */}
          <button
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-950/20 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 size={12} />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1 text-slate-400 hover:text-cyber-blue hover:bg-cyber-blue/10 rounded transition-colors"
            title="Export JSON Logs"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* CONSOLE DISPLAY */}
      <div className="flex-1 bg-[#040810] p-4 overflow-y-auto font-mono-code text-xs space-y-1.5 border-t border-slate-950">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-8">
            {isPaused ? "[Monitor Paused] - No logs buffered" : "No logs matching criteria."}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors group">
              <span className="text-slate-500 select-none text-[10px] pt-0.5">{log.timestamp.split(' ')[1]}</span>
              
              <span className={`px-1 py-px rounded border text-[9px] font-bold uppercase tracking-wide shrink-0 ${
                log.node === 'A' ? 'bg-blue-950/30 text-blue-400 border-blue-900/20' :
                log.node === 'B' ? 'bg-teal-950/30 text-teal-400 border-teal-900/20' :
                log.node === 'C' ? 'bg-purple-950/30 text-purple-400 border-purple-900/20' :
                'bg-slate-900 text-slate-400 border-slate-850'
              }`}>
                Node {log.node}
              </span>

              <span className={`px-1.5 py-px rounded border text-[9px] uppercase tracking-normal shrink-0 font-semibold ${getEventBadgeClass(log.event_type)}`}>
                {log.event_type.replace('_', ' ')}
              </span>

              <span className={`flex-1 break-all tracking-wide ${
                log.event_type.includes('attack') || log.event_type.includes('blacklisted') ? 'text-red-400 font-semibold' :
                log.event_type.includes('firewall') ? 'text-orange-400' :
                log.event_type.includes('block') || log.event_type.includes('genesis') ? 'text-cyan-300' :
                'text-slate-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* FOOTER COUNTER */}
      <div className="px-4 py-1.5 bg-[#080d1a] border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
        <span>Displaying {filteredLogs.length} of {logs.length} logs</span>
        {isPaused && <span className="text-red-500 animate-pulse font-bold">[MONITOR PAUSED]</span>}
      </div>
    </div>
  );
};
