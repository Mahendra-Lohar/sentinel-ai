export const memoryLeakScenario = {
  id: 'incident-06-memory-leak',
  title: 'StreamFlow — Node.js Heap OOM in Worker Fleet',
  rootCause: 'A WebSocket event listener registered in the video-processing worker was not being cleaned up on connection close, causing a closure to retain references to large frame buffer objects. Each connection leaked ~45MB. After 3 hours, workers exhausted 16GB heap and began OOM-killing.',
  confidence: 92,
  businessImpact: {
    revenueLossPerHour: 56000,
    affectedUsers: 33800,
    criticalApis: 3,
    severity: 'P1',
    estimatedMttrMinutes: 18,
    summary: 'Node.js worker fleet crashed due to heap memory exhaustion, causing video processing pipeline failure for 33,800 active streaming sessions.'
  },
  agents: [
    { name: 'Log Detective', confidence: 94, reasoning: 'Worker logs show FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory. Crash pattern: workers dying sequentially every 8-12 minutes starting at 07:45 UTC.', findings: ['FATAL ERROR: Reached heap limit — Allocation failed - JavaScript heap out of memory', 'Workers crashing sequentially: worker-01 at 07:45, worker-02 at 07:53, worker-03 at 08:01', 'Heap used before crash: 15.8GB / 16GB limit', 'Event listener count growth: 120 → 48,400 over 3 hours (clear leak pattern)'] },
    { name: 'Metrics Analyst', confidence: 91, reasoning: 'Heap memory growth rate: 45MB per WebSocket connection (never released). Node.js GC unable to collect retained frame buffers. Workers OOM-killing at regular 8-minute intervals.', findings: ['Heap growth rate: 45MB per WebSocket connection (leak)', 'GC collection rate: dropped from 94% to 12% (GC unable to free retained objects)', 'WebSocket connections: 847 concurrent (total: 48,400 since restart)', 'Worker restart cycle: 8 minute intervals (heap fills in 8 min)'] },
    { name: 'Git Investigator', confidence: 96, reasoning: 'video-worker v3.2.1 (commit b5c7d12) added WebSocket frame buffering for adaptive bitrate. The onmessage handler was registered without a corresponding removeListener on connection close.', findings: ['Commit b5c7d12: "feat: adaptive bitrate frame buffering for 4K streams"', 'ws.on("message", frameBufferHandler) added in src/workers/videoProcessor.js:142', 'No ws.off("message", frameBufferHandler) or ws.removeAllListeners() on connection close', 'frameBufferHandler closure retains reference to 45MB FrameBuffer object'] },
    { name: 'Knowledge Agent', confidence: 88, reasoning: 'Node.js memory leak runbook MEM-002 and EventEmitter documentation confirm: registered listeners without cleanup prevent GC collection. Fix: add removeAllListeners() in connection close handler.', findings: ['Runbook MEM-002: Event listener leak pattern identified', 'Node.js docs: EventEmitter retains listener closure references — prevents GC', 'Fix: ws.removeAllListeners() in "close" event handler', 'Profile with: node --expose-gc --heap-prof video-worker.js to confirm'] },
    { name: 'Vision Analyst', confidence: 85, reasoning: 'Heap memory growth chart shows consistent linear growth with no GC dips — classic unbounded listener accumulation. Worker restart events visible as periodic flatlines.', findings: ['Heap chart: linear growth with no GC recovery — unbounded leak pattern', 'Worker restart events visible as periodic drops to baseline', 'EventEmitter listener count chart: exponential growth (never decreasing)'] },
    { name: 'Commander Agent', confidence: 92, reasoning: 'WebSocket event listener leak in adaptive bitrate implementation. Fix is a one-line code change + deploy. Immediate mitigation: restart workers on a schedule to bound memory growth.', findings: ['Root cause: missing removeAllListeners() in WebSocket close handler', 'Each connection leaks ~45MB via frame buffer closure', 'Immediate mitigation: scheduled worker restart every 60 min', 'Fix: add removeAllListeners() to close handler + deploy v3.2.2'] }
  ],
  timeline: [
    { at: '2026-07-15T04:30:00Z', label: 'video-worker v3.2.1 Deployed', description: 'Adaptive bitrate frame buffering added. WebSocket listener leak introduced.', confidence: 99 },
    { at: '2026-07-15T04:30:30Z', label: 'Memory Leak Begins', description: 'Each WebSocket connection now leaks ~45MB. Growth undetectable at low connection count.', confidence: 95 },
    { at: '2026-07-15T07:00:00Z', label: 'Heap Growth Accelerates', description: 'Accumulated connections bring heap to 8GB. GC collection efficiency drops below 50%.', confidence: 90 },
    { at: '2026-07-15T07:45:00Z', label: 'First Worker OOM', description: 'worker-01 reaches 16GB heap limit. OOM-killed by Kubernetes. Video processing interruptions begin.', confidence: 98 },
    { at: '2026-07-15T08:01:00Z', label: 'Worker Fleet Cascade', description: 'All 6 workers crash within 16 minutes. Video pipeline fully down. 33,800 sessions affected.', confidence: 97 },
    { at: '2026-07-15T08:15:00Z', label: 'Fix Deployed', description: 'v3.2.2 with removeAllListeners() deployed. Worker fleet restarted. Heap growth normalized.', confidence: 99 }
  ],
  recommendations: [
    { priority: 'P0', category: 'immediate', effort: 'medium', title: 'Deploy Fix: Add removeAllListeners() to WebSocket Close Handler', description: 'In src/workers/videoProcessor.js:142, add ws.on("close", () => ws.removeAllListeners()) to release frame buffer references on connection end.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P0', category: 'immediate', effort: 'low', title: 'Implement Worker Restart Schedule', description: 'As immediate mitigation, configure Kubernetes to restart workers every 60 minutes until fix is deployed. This bounds memory growth.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P1', category: 'short-term', effort: 'medium', title: 'Add Heap and EventEmitter Monitoring', description: 'Alert when heap > 70% of limit or EventEmitter listener count > 1,000. Use clinic.js or 0x for continuous heap profiling in staging.', sourceAgent: 'Recommendation Agent' },
    { priority: 'P2', category: 'long-term', effort: 'high', title: 'Add Memory Leak CI Gate', description: 'Run clinic.js heap profiler in CI pipeline for worker modules. Fail build if heap growth rate per connection exceeds 10MB.', sourceAgent: 'Recommendation Agent' }
  ]
};
