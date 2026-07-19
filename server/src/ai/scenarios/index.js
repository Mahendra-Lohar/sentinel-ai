// ============================================================
// AEGIS Scenario Registry
// 10 complete production incident scenarios
// ============================================================
import { redisTimeoutScenario } from './redisTimeout.js';
import { dbConnectionPoolScenario } from './dbConnectionPool.js';
import { paymentGatewayScenario } from './paymentGateway.js';
import { dnsFailureScenario } from './dnsFailure.js';
import { sslExpirationScenario } from './sslExpiration.js';
import { memoryLeakScenario } from './memoryLeak.js';
import { ddosAttackScenario } from './ddosAttack.js';
import { diskFullScenario } from './diskFull.js';
import { thirdPartyApiScenario } from './thirdPartyApi.js';
import { faultyDeploymentScenario } from './faultyDeployment.js';

export const scenarios = {
  'incident-01-redis-timeout': redisTimeoutScenario,
  'incident-02-db-connection-pool': dbConnectionPoolScenario,
  'incident-03-payment-gateway': paymentGatewayScenario,
  'incident-04-dns-failure': dnsFailureScenario,
  'incident-05-ssl-expiration': sslExpirationScenario,
  'incident-06-memory-leak': memoryLeakScenario,
  'incident-07-ddos-attack': ddosAttackScenario,
  'incident-08-disk-full': diskFullScenario,
  'incident-09-third-party-api': thirdPartyApiScenario,
  'incident-10-faulty-deployment': faultyDeploymentScenario,
};

export const scenarioMeta = [
  { id: 'incident-01-redis-timeout', title: 'Redis Memory Exhaustion', severity: 'P1', category: 'Cache' },
  { id: 'incident-02-db-connection-pool', title: 'Database Connection Pool Exhaustion', severity: 'P0', category: 'Database' },
  { id: 'incident-03-payment-gateway', title: 'Payment Gateway Outage', severity: 'P0', category: 'Payments' },
  { id: 'incident-04-dns-failure', title: 'DNS Resolution Failure', severity: 'P1', category: 'Infrastructure' },
  { id: 'incident-05-ssl-expiration', title: 'SSL Certificate Expiration', severity: 'P1', category: 'Security' },
  { id: 'incident-06-memory-leak', title: 'Node.js Memory Leak', severity: 'P1', category: 'Application' },
  { id: 'incident-07-ddos-attack', title: 'DDoS Attack', severity: 'P0', category: 'Security' },
  { id: 'incident-08-disk-full', title: 'Disk Full — Write Failures', severity: 'P1', category: 'Infrastructure' },
  { id: 'incident-09-third-party-api', title: 'Third-Party API Outage', severity: 'P2', category: 'Dependencies' },
  { id: 'incident-10-faulty-deployment', title: 'Faulty Production Deployment', severity: 'P0', category: 'Deployment' },
];

export function getScenario(id) {
  return scenarios[id] || redisTimeoutScenario;
}

export function getDefaultScenario() {
  return redisTimeoutScenario;
}
