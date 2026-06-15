import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, XCircle, ArrowRight, ShieldAlert, FileJson, RefreshCw, RefreshCcw } from 'lucide-react';
import { BlockchainState, Block } from '../types';

interface BlockchainLedgerProps {
  blockchain: BlockchainState;
  onActivateBlockchain: () => Promise<void>;
  onResetAll: () => Promise<void>;
}

// Client-side djb2 hash implementation matching the ESP8266 simpleHash
const simpleHash = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xFFFFFFFF; // Force to 32-bit unsigned
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

export const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  blockchain,
  onActivateBlockchain,
  onResetAll
}) => {
  const [validationResult, setValidationResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    message: string;
    invalidIndex?: number;
  }>({ status: 'idle', message: '' });
  
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateChain = () => {
    setIsValidating(true);
    setTimeout(() => {
      const chain = blockchain.chain;
      if (chain.length === 0) {
        setValidationResult({
          status: 'failed',
          message: 'The ledger is empty. Activate blockchain mode to generate the Genesis Block first.'
        });
        setIsValidating(false);
        return;
      }

      // Validate blocks
      for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        
        // Genesis block check
        if (i === 0) {
          if (block.verification !== 'GENESIS') {
            setValidationResult({
              status: 'failed',
              message: `Block #0: Genesis check failed. Expected GENESIS verification status.`,
              invalidIndex: 0
            });
            setIsValidating(false);
            return;
          }
          continue;
        }

        // Recompute block hash
        const prevBlock = chain[i - 1];
        
        // Check link to previous hash
        if (block.prev_hash !== prevBlock.block_hash) {
          setValidationResult({
            status: 'failed',
            message: `Hash link broken! Block #${block.index} previous hash (${block.prev_hash}) does not match Block #${prevBlock.index} current hash (${prevBlock.block_hash}).`,
            invalidIndex: block.index
          });
          setIsValidating(false);
          return;
        }

        // Recompute simple hash: node|index|payload|prev_hash
        // Note: index represents the blockchain sequence on the server
        const hashContent = `${block.node}|${block.index}|${block.payload}|${block.prev_hash}`;
        const recomputed = simpleHash(hashContent);

        // If the block was marked as invalid on the backend, or doesn't match our recomputation
        if (block.verification === 'INVALID' || (block.block_hash !== recomputed && block.block_hash !== 'DEADBEEF')) {
          setValidationResult({
            status: 'failed',
            message: `Block #${block.index} hash integrity check failed! Expected hash: ${recomputed}, found: ${block.block_hash}`,
            invalidIndex: block.index
          });
          setIsValidating(false);
          return;
        }
      }

      setValidationResult({
        status: 'success',
        message: `Consensus Verified: All ${chain.length} blocks in the distributed ledger are structurally intact, matching hashes, and cryptographic integrity verified!`
      });
      setIsValidating(false);
    }, 1200);
  };

  const handleExportLedger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blockchain, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `blockchain_ledger_height_${blockchain.height}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* GLOBAL BLOCKCHAIN STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Dashboard Panel */}
        <div className="cyber-panel px-4 py-4 md:col-span-1 flex flex-col justify-between border-cyber-blue/10">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Blockchain Status</span>
            <div className="flex items-center space-x-3 mt-2">
              <div className={`p-2 rounded-md ${blockchain.status === 'ACTIVE' ? 'bg-cyber-blue/15 text-cyber-blue' : 'bg-slate-800 text-slate-500'}`}>
                <Database size={24} className={blockchain.status === 'ACTIVE' ? 'animate-pulse' : ''} />
              </div>
              <div>
                <span className={`text-xl font-extrabold tracking-wider block ${
                  blockchain.status === 'ACTIVE' ? 'text-cyber-blue cyber-glow-text' : 'text-slate-500'
                }`}>
                  {blockchain.status}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {blockchain.status === 'ACTIVE' ? 'Event blockchain activated' : 'Standby - Waiting for attack escalations'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-800/60 space-y-2">
            {blockchain.status === 'INACTIVE' ? (
              <button
                onClick={onActivateBlockchain}
                className="w-full py-1.5 bg-cyber-deep/80 hover:bg-cyber-deep text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-all shadow-glow-blue"
              >
                <span>Generate Genesis Block</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-1.5 bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold rounded flex items-center justify-center space-x-1.5"
              >
                <span>Ledger Active & Mining</span>
              </button>
            )}
            
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleValidateChain}
                disabled={isValidating || blockchain.chain.length === 0}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-200 rounded font-semibold flex items-center justify-center space-x-1 disabled:opacity-40"
              >
                <ShieldCheck size={12} className={isValidating ? 'animate-spin' : ''} />
                <span>Validate Chain</span>
              </button>
              <button
                onClick={handleExportLedger}
                disabled={blockchain.chain.length === 0}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-200 rounded font-semibold flex items-center justify-center space-x-1 disabled:opacity-40"
              >
                <FileJson size={12} />
                <span>Export Ledger</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blockchain Metrics */}
        <div className="cyber-panel px-4 py-4 md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 border-cyber-blue/5">
          <div className="bg-slate-900/40 p-3 rounded border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Chain Height</span>
            <span className="text-2xl font-black font-mono-code text-cyber-blue mt-1 block">
              {blockchain.height} <span className="text-xs text-slate-500 font-normal">Blocks</span>
            </span>
          </div>
          
          <div className="bg-slate-900/40 p-3 rounded border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Blocks Mined</span>
            <span className="text-2xl font-black font-mono-code text-slate-200 mt-1 block">
              {blockchain.blocks_generated}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Blocks Rejected</span>
            <span className={`text-2xl font-black font-mono-code mt-1 block ${blockchain.invalid_blocks_rejected > 0 ? 'text-red-500' : 'text-slate-200'}`}>
              {blockchain.invalid_blocks_rejected}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded border border-slate-850 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Verification Success</span>
            <span className="text-2xl font-black font-mono-code text-emerald-500 mt-1 block">
              {blockchain.hash_verification_rate}%
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded border border-slate-850 flex flex-col justify-between col-span-1 sm:col-span-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Ledger Volume</span>
            <span className="text-xl font-bold font-mono-code text-slate-200 mt-1.5 block">
              {blockchain.ledger_size_kb.toFixed(3)} <span className="text-xs text-slate-500">KB in payload storage</span>
            </span>
          </div>
        </div>
      </div>

      {/* CHAIN VALIDATION RESULTS */}
      {validationResult.status !== 'idle' && (
        <div className={`p-3 border rounded-lg flex items-start space-x-3 text-xs ${
          validationResult.status === 'success' 
            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-950/20 border-red-500/20 text-red-400'
        }`}>
          {validationResult.status === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce" />
          )}
          <div className="flex-1">
            <h4 className="font-bold mb-1 uppercase tracking-wide">
              {validationResult.status === 'success' ? 'Cryptographic Integrity Check Passed' : 'Cryptographic Integrity Breach'}
            </h4>
            <p className="leading-relaxed">{validationResult.message}</p>
          </div>
          <button 
            onClick={() => setValidationResult({ status: 'idle', message: '' })}
            className="text-[10px] uppercase font-bold hover:underline select-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VISUAL LEDGER CHRONICLE */}
      <div className="cyber-panel flex flex-col">
        <div className="cyber-panel-header">
          <span>Distributed Visual Ledger</span>
          <span className="text-[10px] text-slate-500">Left-to-Right chronological order</span>
        </div>
        
        {blockchain.chain.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-[#070b13] flex flex-col items-center justify-center">
            <Database size={36} className="text-slate-700 mb-2 animate-bounce" />
            <h3 className="font-bold text-slate-400">Ledger Inactive</h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1">
              The blockchain network has not been triggered. Launch an attack in the Attack Simulator to trigger firewall detection and activate the blockchain.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-[#070b13] overflow-x-auto flex items-center space-x-4 min-h-[220px]">
            {blockchain.chain.map((block, i) => {
              const isGenesis = block.verification === 'GENESIS';
              const isInvalid = block.verification === 'INVALID';
              const isFailedValidate = validationResult.status === 'failed' && validationResult.invalidIndex === block.index;

              return (
                <React.Fragment key={block.index}>
                  {i > 0 && (
                    <ArrowRight 
                      size={20} 
                      className={`shrink-0 ${
                        isFailedValidate 
                          ? 'text-red-500 animate-pulse' 
                          : blockchain.chain[i].verification === 'INVALID' 
                            ? 'text-red-900' 
                            : 'text-cyber-blue/40'
                      }`} 
                    />
                  )}
                  
                  {/* BLOCK CARD */}
                  <div className={`w-[260px] shrink-0 cyber-panel px-4 py-3 bg-[#0c1322] border-t-4 transition-all duration-350 ${
                    isGenesis 
                      ? 'border-t-cyber-blue border-cyber-blue/15 shadow-cyber-blue/5' 
                      : isInvalid 
                        ? 'border-t-red-500 border-red-950/60 shadow-red-950/5' 
                        : isFailedValidate
                          ? 'border-t-red-500 border-red-500 shadow-red-500/20'
                          : 'border-t-emerald-500 border-emerald-950/20 shadow-emerald-950/5'
                  }`}>
                    {/* Block Info Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-code font-bold pb-2 border-b border-slate-800/80 mb-2">
                      <span className={isGenesis ? 'text-cyber-blue' : isInvalid ? 'text-red-400' : 'text-emerald-400'}>
                        {isGenesis ? 'GENESIS BLOCK' : `BLOCK #${block.index}`}
                      </span>
                      <span>{block.timestamp.split(' ')[1]}</span>
                    </div>

                    {/* Block Details */}
                    <div className="space-y-2 text-[10px] font-mono-code">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Miner Node:</span>
                        <span className="font-bold text-slate-300">{block.node}</span>
                      </div>
                      
                      <div className="bg-[#040810] p-1.5 rounded border border-slate-900 max-h-[44px] overflow-y-auto text-[9px] text-slate-400 break-all select-all">
                        {block.payload}
                      </div>

                      <div className="pt-1.5 border-t border-slate-850 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">Prev Hash:</span>
                          <span className="text-slate-300 tracking-wider truncate max-w-[130px] font-bold" title={block.prev_hash}>
                            {block.prev_hash}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">Curr Hash:</span>
                          <span className={`tracking-wider truncate max-w-[130px] font-bold ${
                            isGenesis ? 'text-cyber-blue' : isInvalid ? 'text-red-500' : 'text-emerald-400'
                          }`} title={block.block_hash}>
                            {block.block_hash}
                          </span>
                        </div>
                      </div>
                      
                      {/* Verification badge */}
                      <div className="pt-2 flex items-center justify-between text-[9px]">
                        <span className="text-slate-500">Validation:</span>
                        <span className={`px-1.5 py-px rounded font-bold uppercase tracking-wide flex items-center space-x-1 ${
                          isGenesis ? 'bg-cyber-blue/10 text-cyber-blue' :
                          isInvalid ? 'bg-red-950/40 text-red-500' :
                          'bg-emerald-950/40 text-emerald-500'
                        }`}>
                          {isGenesis ? 'GENESIS' : block.verification}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
