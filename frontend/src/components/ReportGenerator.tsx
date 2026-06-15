import React, { useState } from 'react';
import { FileSpreadsheet, FileJson, FileText, Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ReportGeneratorProps {
  onGenerateReport: () => Promise<any>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerateReport }) => {
  const [reportState, setReportState] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [reportData, setReportData] = useState<any>(null);

  const handleFetchReport = async () => {
    setReportState('generating');
    try {
      const data = await onGenerateReport();
      setReportData(data);
      setReportState('success');
    } catch (err) {
      console.error(err);
      setReportState('failed');
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!reportData) return;
    downloadFile(
      JSON.stringify(reportData, null, 2),
      `cimes_mesh_blockchain_report_${reportData.report_id}.json`,
      'application/json'
    );
  };

  const exportCSV = () => {
    if (!reportData) return;
    
    // Create a combined text file representing CSV reports for different sections
    let csvContent = '';
    
    // Section 1: System Status
    csvContent += '--- SYSTEM SUMMARY ---\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Report ID,${reportData.report_id}\n`;
    csvContent += `Timestamp,${reportData.timestamp}\n`;
    csvContent += `Operating Mode,${reportData.network_statistics.mode}\n`;
    csvContent += `Connected Nodes,${reportData.network_statistics.connected_nodes}\n`;
    csvContent += `Discovery,${reportData.network_statistics.peer_discovery}\n`;
    csvContent += `Total Packets Sent,${reportData.network_statistics.total_sent}\n`;
    csvContent += `Total Packets Received,${reportData.network_statistics.total_received}\n`;
    csvContent += `Total Hops Relayed,${reportData.network_statistics.total_relayed}\n\n`;

    // Section 2: Firewall Stats
    csvContent += '--- FIREWALL METRICS ---\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Firewall Rule Status,${reportData.firewall_statistics.status ? 'ENABLED' : 'DISABLED'}\n`;
    csvContent += `Threat Counter,${reportData.firewall_statistics.threat_counter}\n`;
    csvContent += `Dropped Packets,${reportData.firewall_statistics.dropped_packets}\n`;
    csvContent += `Inspected Packets,${reportData.firewall_statistics.inspected_packets}\n`;
    csvContent += `Intrusion Capture Rate,${reportData.firewall_statistics.detection_rate}%\n\n`;

    // Section 3: Nodes Table
    csvContent += '--- NODE STATE REGISTER ---\n';
    csvContent += 'Node ID,COM Port,WiFi Status,Trust Score,Malicious Counts,Chain Height,Blacklisted\n';
    reportData.node_statuses.forEach((n: any) => {
      csvContent += `${n.node_id},${n.com_port},${n.status},${n.trust_score}%,${n.bad_behavior_count},${n.blockchain_height},${n.blacklisted ? 'YES' : 'NO'}\n`;
    });
    csvContent += '\n';

    // Section 4: Blockchain blocks
    csvContent += '--- CRYPTOGRAPHIC LEDGER BLOCKS ---\n';
    csvContent += 'Index,Timestamp,Miner Node,Payload,Hash,Verification\n';
    reportData.ledger_summary.forEach((b: any) => {
      csvContent += `${b.index},${b.timestamp},${b.node},"${b.payload.replace(/"/g, '""')}",${b.block_hash},${b.verification}\n`;
    });

    downloadFile(
      csvContent,
      `cimes_mesh_blockchain_report_${reportData.report_id}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const exportPDF = () => {
    if (!reportData) return;
    
    // We open a print-friendly window styled with basic clean CSS to let the browser print as PDF.
    // This is the cleanest, most production-ready way to support export PDF in a vanilla React environment.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate PDF.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Audit Report - ${reportData.report_id}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 30px; line-height: 1.4; }
            h1 { color: #004b87; border-bottom: 2px solid #004b87; padding-bottom: 10px; margin-bottom: 5px; }
            h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px; }
            .meta { font-size: 11px; color: #666; margin-bottom: 25px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .card { border: 1px solid #ccc; padding: 10px; border-radius: 4px; background: #fafafa; }
            .card span { display: block; font-size: 10px; text-transform: uppercase; color: #888; }
            .card strong { font-size: 16px; color: #004b87; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .badge { padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 9px; }
            .badge-green { background: #d4edda; color: #155724; }
            .badge-red { background: #f8d7da; color: #721c24; }
            .footer { font-size: 9px; color: #888; text-align: center; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>MESH NETWORK SECURITY AUDIT</h1>
          <div class="meta">
            <strong>Project:</strong> Adaptive Secure Data Transmission in WMN using Event-Triggered Blockchain<br>
            <strong>Research Centre:</strong> Centre for Intelligent Marine & Energy Systems (CIMES), SRM IST<br>
            <strong>Report ID:</strong> ${reportData.report_id} | <strong>Timestamp:</strong> ${reportData.timestamp}<br>
            <strong>System Health:</strong> ${reportData.system_health}
          </div>

          <h2>1. Network Status Overview</h2>
          <div class="grid">
            <div class="card">
              <span>Operating Mode</span>
              <strong>${reportData.network_statistics.mode}</strong>
            </div>
            <div class="card">
              <span>Active Node Links</span>
              <strong>${reportData.network_statistics.connected_nodes} Connected</strong>
            </div>
            <div class="card">
              <span>Peer Discovery Status</span>
              <strong>${reportData.network_statistics.peer_discovery}</strong>
            </div>
          </div>
          <div class="grid">
            <div class="card">
              <span>Total Packets Sent</span>
              <strong>${reportData.network_statistics.total_sent}</strong>
            </div>
            <div class="card">
              <span>Total Packets Received</span>
              <strong>${reportData.network_statistics.total_received}</strong>
            </div>
            <div class="card">
              <span>Total Hops Relayed</span>
              <strong>${reportData.network_statistics.total_relayed}</strong>
            </div>
          </div>

          <h2>2. Firewall & Intrusion Logs</h2>
          <div class="grid">
            <div class="card">
              <span>Firewall Guard</span>
              <strong>${reportData.firewall_statistics.status ? 'ENABLED' : 'DISABLED'}</strong>
            </div>
            <div class="card">
              <span>Threat Counter</span>
              <strong>${reportData.firewall_statistics.threat_counter} Attacks</strong>
            </div>
            <div class="card">
              <span>Dropped / Quarantined</span>
              <strong>${reportData.firewall_statistics.dropped_packets} Packets</strong>
            </div>
          </div>

          <h2>3. Node State Register</h2>
          <table>
            <thead>
              <tr>
                <th>Node ID</th>
                <th>COM Port</th>
                <th>Network IP</th>
                <th>WiFi status</th>
                <th>Trust Score</th>
                <th>Ledger Height</th>
                <th>Blacklisted</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.node_statuses.map((n: any) => `
                <tr>
                  <td>Node ${n.node_id}</td>
                  <td>${n.com_port}</td>
                  <td>${n.ip}</td>
                  <td>${n.status}</td>
                  <td>${n.trust_score}%</td>
                  <td>${n.blockchain_height} Blocks</td>
                  <td>
                    <span class="badge ${n.blacklisted ? 'badge-red' : 'badge-green'}">
                      ${n.blacklisted ? 'ISOLATED' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>4. Blockchain consensus Ledger Blocks</h2>
          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>Timestamp</th>
                <th>Miner</th>
                <th>Payload</th>
                <th>Cryptographic Hash</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.ledger_summary.map((b: any) => `
                <tr>
                  <td>#${b.index}</td>
                  <td>${b.timestamp.split(' ')[1]}</td>
                  <td>Node ${b.node}</td>
                  <td><code>${b.payload}</code></td>
                  <td><code>${b.block_hash}</code></td>
                  <td>
                    <span class="badge ${b.verification === 'INVALID' ? 'badge-red' : 'badge-green'}">
                      ${b.verification}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Centre for Intelligent Marine & Energy Systems | Department of Electrical and Electronics Engineering<br>
            SRM Institute of Science and Technology, Chennai, India.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="cyber-panel p-4 flex flex-col justify-between h-[360px] border-cyber-blue/10">
      <div>
        <div className="cyber-panel-header mb-4">
          <span>Research Audit Report Generator</span>
        </div>
        
        <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xl">
          Generate comprehensive diagnostic audit worksheets for academic reviews, publications, and showcases.
          The generated report aggregates real-time packet transmissions, firewall drop rates, attack sequences,
          and cryptographic hashes.
        </p>

        {reportState === 'idle' && (
          <button
            onClick={handleFetchReport}
            className="px-4 py-2 bg-cyber-deep/80 hover:bg-cyber-deep text-white font-bold text-xs rounded transition-colors shadow-glow-blue flex items-center space-x-2"
          >
            <RefreshCw size={14} />
            <span>Generate Session Audit Report</span>
          </button>
        )}

        {reportState === 'generating' && (
          <div className="flex items-center space-x-3 text-xs text-cyber-blue">
            <RefreshCw size={16} className="animate-spin" />
            <span>Collecting and compiling metrics from nodes, firewall, and ledger...</span>
          </div>
        )}

        {reportState === 'failed' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs text-red-500">
              <AlertCircle size={16} />
              <span>Failed to reach FastAPI report engine. Ensure server is active on port 8000.</span>
            </div>
            <button
              onClick={handleFetchReport}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:text-white rounded"
            >
              Retry
            </button>
          </div>
        )}

        {reportState === 'success' && reportData && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-500">
              <CheckCircle size={16} />
              <span>Audit report successfully compiled! ID: <strong>{reportData.report_id}</strong> ({reportData.node_statuses.length} nodes registered)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg">
              <button
                onClick={exportPDF}
                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs rounded font-bold text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <FileText size={14} className="text-red-400" />
                <span>Export PDF Report</span>
              </button>

              <button
                onClick={exportCSV}
                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs rounded font-bold text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span>Export CSV Data</span>
              </button>

              <button
                onClick={exportJSON}
                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs rounded font-bold text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <FileJson size={14} className="text-yellow-400" />
                <span>Export JSON Payload</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {reportState === 'success' && (
        <button
          onClick={() => {
            setReportState('idle');
            setReportData(null);
          }}
          className="text-[10px] text-slate-500 uppercase hover:underline self-start mt-4 font-mono-code font-bold"
        >
          Reset and compile new report
        </button>
      )}
    </div>
  );
};
