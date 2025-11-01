# AUTOPILOT Microservices Architecture

## Overview

This document describes the migration from a modular monolith to a microservices architecture using the **Strangler Fig Pattern**.

## Current Status: Phase 1 - Foundation (Week 1-4)

### ✅ Completed
- API Gateway edge function deployed
- Event Bus infrastructure implemented
- Observability utilities created (tracing, logging, monitoring)
- Domain boundaries documented

### Architecture Patterns Implemented

#### 1. Strangler Fig Pattern
The API Gateway (`supabase/functions/api-gateway`) routes all traffic and will gradually shift routes from monolith to microservices.

**Current State**: All routes pass through gateway for observability
**Future State**: Gateway routes specific domains to dedicated microservices

#### 2. Event-Driven Architecture
Event Bus (`supabase/functions/event-bus`) enables loose coupling between services.

**Usage**:
```typescript
import { eventBus, EventTypes } from '@/lib/eventBus';

// Publish event
await eventBus.publish({
  event_type: EventTypes.CAFETERIA.ORDER_CREATED,
  domain: 'cafeteria',
  aggregate_id: orderId,
  payload: { order_details },
  metadata: { user_id: userId }
});

// Subscribe to events
eventBus.subscribe('cafeteria', (event) => {
  console.log('Cafeteria event:', event);
});
```

#### 3. Observability & Distributed Tracing
Instrumentation utilities in `src/lib/observability.ts` provide:

```typescript
import { traced, Logger, PerformanceMonitor } from '@/lib/observability';

// Wrap operations with tracing
const result = await traced('cafeteria-service', 'create-order', async (context) => {
  const logger = new Logger('cafeteria-service', context);
  logger.info('Creating order', { orderId });
  
  // Business logic here
  
  return order;
});

// Record custom metrics
await PerformanceMonitor.recordResponseTime('cafeteria', '/orders', 250);
```

## Domain Boundaries

### 1. Identity & Access Management (IAM)
**Tables**: `profiles`, `user_invitations`, `user_sessions`, `role_permissions`
**Complexity**: High (auth-related)
**Status**: Remains in monolith (extract last)

### 2. Maintenance Management
**Tables**: `maintenance_requests`, `assignments`, `sla_tracking`, `escalations`, `work_orders`
**Complexity**: Very High (core domain)
**Status**: Extract in Phase 5 (after patterns proven)

### 3. Cafeteria & Food Service
**Tables**: `food_categories`, `food_items`, `cafeteria_orders`, `vendors`, `vendor_orders`, `payments`
**Complexity**: Medium
**Status**: **Next for extraction (Phase 2)** ✨
**Reason**: Independent domain, high volume, clear boundaries

### 4. Visitor Management
**Tables**: `visitors`, `visitor_logs`, `access_logs`, `security_checks`, `badges`
**Complexity**: Medium-High
**Status**: Extract in Phase 4-5

### 5. Asset & Facility Management
**Tables**: `assets`, `spaces`, `leases`, `meters`, `inspections`
**Complexity**: High
**Status**: Extract in Phase 5

### 6. Utilities & Metering
**Tables**: `meters`, `meter_readings`, `utility_bills`, `consumption_tracking`
**Complexity**: Medium
**Status**: Extract in Phase 4

### 7. Analytics & Reporting
**Tables**: `performance_metrics`, `ai_predictions`, `report_templates`, `kpi_dashboards`
**Complexity**: Low (read-heavy)
**Status**: Extract in Phase 4 (CQRS pattern)

### 8. Notifications & Alerts
**Tables**: `notifications`, `alerts`, `email_templates`, `notification_preferences`
**Complexity**: Low
**Status**: Extract in Phase 3-4

### 9. Workflow & Automation
**Tables**: `workflow_rules`, `workflow_executions`, `automation_triggers`
**Complexity**: Medium
**Status**: Extract in Phase 4 (orchestration service)

## Migration Phases

### Phase 1: Foundation (✅ Current - Weeks 1-4)
- [x] API Gateway deployed
- [x] Event Bus operational
- [x] Observability infrastructure
- [x] Domain boundaries mapped

**Database Tables Created**:
- `gateway_logs` - API Gateway request logging
- `domain_events` - Event store for event-driven communication
- `traces` - Distributed tracing spans
- `service_logs` - Centralized logging
- `performance_metrics` - Service metrics
- `service_health` - Health check results

### Phase 2: Extract Cafeteria Service (Weeks 5-8)
**Why Cafeteria First?**
- Independent business logic
- High transaction volume
- Clear bounded context
- Limited dependencies

**Approach**:
1. Create dedicated Supabase project for cafeteria OR containerized service
2. Implement Saga Pattern for order workflows
3. Dual-write period (sync data between monolith and service)
4. Update API Gateway to route `/cafeteria/*` to new service
5. Migrate frontend to call new service

**Events to Emit**:
- `cafeteria.order.created`
- `cafeteria.order.confirmed`
- `cafeteria.payment.processed`
- `cafeteria.order.completed`

### Phase 3: Event-Driven Backbone (Weeks 9-12)
1. Expand event types for all domains
2. Implement event-sourced aggregates
3. Create CQRS read models for analytics
4. Deploy event consumers for cross-domain workflows

### Phase 4: Extract High-Impact Services (Weeks 13-20)
Extract in order:
1. **Analytics & Reporting** (CQRS pattern)
2. **Notifications Service** (centralized hub)
3. **Workflow Orchestration** (saga coordinator)

### Phase 5: Core Domain Extraction (Weeks 21-32)
1. Maintenance Management
2. Visitor Management
3. Asset Management

### Phase 6: Full Decomposition (Weeks 33-40)
1. Database-per-service migration
2. Service mesh deployment (Istio/Linkerd)
3. Deprecate monolith routes

## Technology Stack

### Current (Monolith)
- Frontend: React + Vite + TypeScript
- Backend: Supabase (PostgreSQL + Edge Functions)
- Auth: Supabase Auth
- Storage: Supabase Storage

### Microservices (Future)
- **Runtime**: Supabase Edge Functions (Deno) OR AWS ECS/EKS
- **Event Bus**: Supabase Realtime (Phase 1-3) → Kafka/EventBridge (Phase 4+)
- **API Gateway**: Supabase Edge Function (Phase 1-2) → Kong/AWS API Gateway (Phase 3+)
- **Observability**: Custom utilities (Phase 1) → Datadog/CloudWatch (Phase 3+)
- **Service Mesh**: Istio/Linkerd (Phase 6)

## Monitoring & Observability

### Key Metrics
| Metric | Target | Current |
|--------|--------|---------|
| API Gateway Response Time | <100ms | TBD |
| Event Bus Latency | <50ms | TBD |
| Service Availability | 99.9% | TBD |
| Trace Coverage | 100% | Phase 1 setup |

### Dashboards
- Gateway Traffic & Routing Decisions
- Event Bus Throughput & Error Rates
- Service Health & Latency
- Domain Event Flows

## Development Guidelines

### Adding a New Service
1. Define domain boundary clearly
2. Document data ownership
3. Implement service in `supabase/functions/{service-name}`
4. Add route to API Gateway configuration
5. Emit domain events for state changes
6. Instrument with observability utilities
7. Update this documentation

### Testing Strategy
- **Unit Tests**: Business logic within services
- **Integration Tests**: Service-to-service communication via events
- **Contract Tests**: API Gateway routing
- **End-to-End Tests**: Full user flows across services

### Rollback Strategy
- API Gateway can instantly revert routes to monolith
- Keep dual-write for one sprint after service launch
- Monitor error rates and latency before full cutover

## Decision Log

### Why Supabase Edge Functions for Services?
**Pros**: Familiar stack, auto-scaling, RLS integration, low ops overhead
**Cons**: Vendor lock-in, limited control vs. Kubernetes
**Decision**: Start with Edge Functions, migrate critical services to ECS if needed

### Why Supabase Realtime for Event Bus?
**Pros**: Already integrated, real-time updates, no new infrastructure
**Cons**: Not designed for high-throughput event streaming
**Decision**: Use for Phase 1-3, evaluate Kafka/EventBridge in Phase 4

### Database-per-Service Timeline
**Decision**: Keep shared database through Phase 4, split in Phase 5-6
**Reason**: Foreign key dependencies, transaction boundaries, reduced risk

## Next Steps

1. **Immediate (Week 5)**: Begin Cafeteria service extraction
2. **This Quarter**: Complete Phase 2 & 3
3. **Next Quarter**: Extract 3 high-impact services (Phase 4)
4. **6 Months**: Evaluate hybrid vs. full microservices

## Resources
- [API Gateway Logs](https://supabase.com/dashboard/project/mukqpwinqhdfffdkthcg/functions/api-gateway/logs)
- [Event Bus Logs](https://supabase.com/dashboard/project/mukqpwinqhdfffdkthcg/functions/event-bus/logs)
- [Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)
