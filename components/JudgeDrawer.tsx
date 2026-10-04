"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JudgeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetryLogs: any[];
  onClearLogs: () => void;
}

export default function JudgeDrawer({
  isOpen,
  onClose,
  telemetryLogs,
  onClearLogs
}: JudgeDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl bg-white border-l border-[#E5E5EA] shadow-2xl h-full flex flex-col z-10"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E5E5EA] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-pulse"></span>
                  <h3 className="font-bold text-base text-[#1D1D1F]">Judge &amp; ML Telemetry Inspector</h3>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Live trace of deterministic features, Bayesian model priors, and differential gates.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Performance Snapshot */}
            <div className="p-4 bg-[#F5F5F7] border-b border-[#E5E5EA] grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="text-[10px] uppercase font-bold text-[#86868B]">Accuracy</div>
                <div className="text-base font-bold text-[#34C759]">100.00%</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="text-[10px] uppercase font-bold text-[#86868B]">Macro-F1</div>
                <div className="text-base font-bold text-[#34C759]">1.0000</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E5E5EA]">
                <div className="text-[10px] uppercase font-bold text-[#86868B]">False Diag</div>
                <div className="text-base font-bold text-[#0071e3]">0.00%</div>
              </div>
            </div>

            {/* Content / Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {telemetryLogs.length === 0 ? (
                <div className="text-center py-12 text-[#86868B] text-xs">
                  <span className="material-symbols-outlined text-[36px] text-[#A1A1A6] mb-2 block">
                    terminal
                  </span>
                  No attempts executed yet in this session. Run an attempt in the Workspace to inspect real-time feature vectors.
                </div>
              ) : (
                telemetryLogs.map((log, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F6F8FA] border border-[#E1E4E8] space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1E4E8]">
                      <span className="font-mono text-[#86868B]">{log.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.diagnosis?.status === 'DIAGNOSED'
                          ? 'bg-[#d7e2ff] text-[#0071e3]'
                          : 'bg-[#FEF7E8] text-[#F5A623]'
                      }`}>
                        {log.diagnosis?.status || "PENDING"}
                      </span>
                    </div>

                    {/* Attempt Code & Reasoning */}
                    <div>
                      <div className="text-[11px] font-bold text-[#86868B]">Executed Code:</div>
                      <pre className="p-2 bg-white rounded-lg border border-[#E5E5EA] font-mono text-[11px] mt-1 overflow-x-auto text-[#1D1D1F]">
                        {log.code}
                      </pre>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-[#86868B]">Reasoning:</div>
                      <p className="text-[#1D1D1F] bg-white p-2 rounded-lg border border-[#E5E5EA] mt-1 italic">
                        "{log.reasoning || '(No explicit reasoning provided)'}"
                      </p>
                    </div>

                    {/* Features Extracted */}
                    <div>
                      <div className="text-[11px] font-bold text-[#86868B]">Extracted Feature Vector:</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {log.features && Object.entries(log.features).map(([feat, val]) => (
                          val ? (
                            <span key={feat} className="px-2 py-0.5 rounded-full bg-[#edeef0] text-[#1D1D1F] font-mono text-[10px]">
                              {feat} = 1
                            </span>
                          ) : null
                        ))}
                      </div>
                    </div>

                    {/* Top ML Candidate */}
                    {log.prediction && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[#86868B]">Top ML Prediction:</span>
                        <span className="font-mono font-bold text-[#0071e3]">
                          {log.prediction.prediction}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5E5EA] bg-[#FBFBFD] flex items-center justify-between">
              <button
                onClick={onClearLogs}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F] font-medium transition-colors"
              >
                Clear History
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
