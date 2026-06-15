import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { BarChart3, LineChart as LineIcon, Activity, HeartHandshake } from 'lucide-react';
import { NodeStatus, BlockchainState } from '../types';

interface AnalyticsChartsProps {
  nodes: Record<string, NodeStatus>;
  blockchain: BlockchainState;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ nodes, blockchain }) => {
  
  // 1. Packets Per Minute Mock Time-Series Data
  const trafficData = [
    { time: '10:00', NodeA: 12, NodeB: 8, NodeC: 15 },
    { time: '10:05', NodeA: 18, NodeB: 14, NodeC: 19 },
    { time: '10:10', NodeA: 25, NodeB: 22, NodeC: 24 },
    { time: '10:15', NodeA: 15, NodeB: 19, NodeC: 8 },
    { time: '10:20', NodeA: 32, NodeB: 28, NodeC: 5 }, // Node C starts failing
    { time: '10:25', NodeA: 40, NodeB: 35, NodeC: 0 }, // Node C isolated
    { time: '10:30', NodeA: 45, NodeB: 42, NodeC: 0 },
  ];

  // 2. Trust Score History
  const trustHistoryData = [
    { epoch: 'T-60', NodeA: 100, NodeB: 100, NodeC: 100 },
    { epoch: 'T-50', NodeA: 100, NodeB: 100, NodeC: 100 },
    { epoch: 'T-40', NodeA: 100, NodeB: 100, NodeC: 70 },  // Node C drops due to bad packet
    { epoch: 'T-30', NodeA: 100, NodeB: 100, NodeC: 40 },  // Node C drops further
    { epoch: 'T-20', NodeA: 100, NodeB: 100, NodeC: 0 },   // Node C blacklisted
    { epoch: 'T-10', NodeA: 100, NodeB: 100, NodeC: 0 },
    { epoch: 'Now', NodeA: nodes['A']?.trust_score || 100, NodeB: nodes['B']?.trust_score || 100, NodeC: nodes['C']?.trust_score || 0 },
  ];

  // 3. Relay Operations comparison
  const relayData = [
    { name: 'Node A', Sent: nodes['A']?.packets_sent || 0, Received: nodes['A']?.packets_received || 0, Relays: nodes['A']?.relay_count || 0 },
    { name: 'Node B', Sent: nodes['B']?.packets_sent || 0, Received: nodes['B']?.packets_received || 0, Relays: nodes['B']?.relay_count || 0 },
    { name: 'Node C', Sent: nodes['C']?.packets_sent || 0, Received: nodes['C']?.packets_received || 0, Relays: nodes['C']?.relay_count || 0 },
  ];

  // 4. Latency Radar Data (simulation)
  const latencyData = [
    { subject: 'Mesh Jitter', A: 8, B: 12, fullMark: 20 },
    { subject: 'Packet Latency', A: 15, B: 18, fullMark: 20 },
    { subject: 'Consensus Delay', A: 12, B: 10, fullMark: 20 },
    { subject: 'Queue Depth', A: 5, B: 8, fullMark: 20 },
    { subject: 'Relay Overhead', A: 10, B: 14, fullMark: 20 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHART 1: PACKETS PER MINUTE */}
        <div className="cyber-panel p-4 flex flex-col h-[280px]">
          <div className="cyber-panel-header mb-3">
            <span className="flex items-center space-x-1.5">
              <Activity size={14} className="text-cyber-blue" />
              <span>Network Traffic Density (Packets / Min)</span>
            </span>
          </div>
          <div className="flex-1 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="95%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="time" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#090e18', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="NodeA" stroke="#0066ff" fillOpacity={1} fill="url(#colorA)" />
                <Area type="monotone" dataKey="NodeB" stroke="#10b981" fillOpacity={1} fill="url(#colorB)" />
                <Area type="monotone" dataKey="NodeC" stroke="#ef4444" fillOpacity={1} fill="url(#colorC)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: TRUST SCORES OVER TIME */}
        <div className="cyber-panel p-4 flex flex-col h-[280px]">
          <div className="cyber-panel-header mb-3">
            <span className="flex items-center space-x-1.5">
              <HeartHandshake size={14} className="text-cyber-blue" />
              <span>Node Trust Score Progression</span>
            </span>
          </div>
          <div className="flex-1 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="95%">
              <LineChart data={trustHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="epoch" stroke="#475569" />
                <YAxis stroke="#475569" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#090e18', borderColor: '#1e293b' }} />
                <Line type="monotone" dataKey="NodeA" stroke="#0066ff" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="NodeB" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="NodeC" stroke="#ef4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: RELAY & MULTI-HOP OPERATIONS */}
        <div className="cyber-panel p-4 flex flex-col h-[280px]">
          <div className="cyber-panel-header mb-3">
            <span className="flex items-center space-x-1.5">
              <BarChart3 size={14} className="text-cyber-blue" />
              <span>Node Mesh Exchange Data (Sent/Received/Relays)</span>
            </span>
          </div>
          <div className="flex-1 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="95%">
              <BarChart data={relayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#090e18', borderColor: '#1e293b' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Sent" fill="#0066ff" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Received" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Relays" fill="#a855f7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: PERFORMANCE METRICS */}
        <div className="cyber-panel p-4 flex flex-col h-[280px]">
          <div className="cyber-panel-header mb-3">
            <span className="flex items-center space-x-1.5">
              <LineIcon size={14} className="text-cyber-blue" />
              <span>Multi-Hop Latency & Jitter Profiles</span>
            </span>
          </div>
          <div className="flex-1 w-full flex items-center justify-center text-[10px]">
            <ResponsiveContainer width="100%" height="95%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={latencyData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" style={{ fontSize: '9px' }} />
                <PolarRadiusAxis angle={30} domain={[0, 20]} stroke="#475569" style={{ fontSize: '8px' }} />
                <Radar name="Mode: Standard Mesh" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Radar name="Mode: Secure Blockchain" dataKey="B" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
