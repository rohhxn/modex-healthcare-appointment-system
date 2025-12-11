# Healthcare Appointment Booking System - Technical Design Document

## Executive Summary

This document outlines the architecture, design decisions, and scalability strategies for a production-grade healthcare appointment booking system. The system handles high-concurrency scenarios while ensuring data consistency, HIPAA compliance, and sub-second appointment confirmation.

**Key Metrics:**
- Target: 10,000+ concurrent users
- Appointment booking success rate: 99.99%
- Confirmation latency: < 500ms (p99)
- Uptime SLA: 99.95%

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  (Web Browser, Mobile App, Third-party Integrations)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
   │   API    │    │  API        │   │  Webhook   │
   │   GW 1   │    │  GW 2       │   │  Handler   │
   └────┬─────┘    └──────┬──────┘   └──────┬──────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼──────────┐ ┌────▼──────┐ ┌────▼────────┐
   │  Auth Service │ │ Booking   │ │  Payment    │
   │  (JWT)        │ │ Service   │ │  Service    │
   └──────────────┘ └──────┬─────┘ └─────────────┘
        │                  │
        └──────────────────┼──────────────────┐
                           │                  │
                      ┌────▼─────────────┐    │
                      │  Message Queue   │    │
                      │  (RabbitMQ/SQS)  │    │
                      └────┬─────────────┘    │
                           │                  │
                      ┌────▼───────────────────▼────┐
                      │   PostgreSQL Primary        │
                      │   (Write Operations)        │
                      └────┬───────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      ┌───▼────┐      ┌───▼────┐      ┌───▼────┐
      │ Replica│      │ Replica│      │ Replica│
      │  Read  │      │  Read  │      │  Read  │
      └────────┘      └────────┘      └────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Cache     │
                    │   (Redis)   │
                    └─────────────┘
```

### 1.2 Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Gateway** | NGINX/Kong | Load balancing, rate limiting, SSL termination |
| **Auth Service** | JWT/OAuth2 | Authentication & authorization |
| **Booking Service** | Node.js + Express | Core appointment booking logic |
| **Notification Service** | Node.js + Queue | Email, SMS, push notifications |
| **Payment Service** | Stripe/PayPal integration | Payment processing & verification |
| **Database** | PostgreSQL | Primary data store with ACID guarantees |
| **Cache** | Redis | Session storage, slot availability caching |
| **Message Queue** | RabbitMQ/SQS | Async job processing |
| **Storage** | S3/Cloud Storage | Medical documents, prescriptions |
| **Monitoring** | Prometheus + Grafana | System health & metrics |
| **Logging** | ELK Stack/Datadog | Centralized logging & debugging |

## 2. Database Design

### 2.1 Schema Overview

```sql
-- Core Tables
doctors (id, name, specialization, license_number, ...)
patients (id, name, email, medical_history, ...)
time_slots (id, doctor_id, slot_date, slot_time, status, current_bookings, ...)
appointments (id, patient_id, doctor_id, time_slot_id, status, confirmed_at, expires_at, ...)

-- Supporting Tables
appointment_audit_log (appointment_id, action, old_status, new_status, ...)
medical_records (patient_id, document_type, file_url, created_at, ...)
prescriptions (appointment_id, drug_name, dosage, frequency, ...)
reviews (appointment_id, patient_id, rating, comment, ...)
```

### 2.2 Scaling Strategy

#### Phase 1: Single Instance (< 10k daily users)
- ✅ Single PostgreSQL with connection pooling
- ✅ Indexes on frequently queried columns
- ✅ Vacuum & autovacuum enabled
- ✅ Max connections: 100

```sql
-- Key Indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_time_slots_doctor_id ON time_slots(doctor_id);
CREATE INDEX idx_time_slots_available ON time_slots(doctor_id, slot_date, status) 
  WHERE status = 'AVAILABLE' AND current_bookings < max_capacity;
```

#### Phase 2: Read Replicas (10k - 50k daily users)
- ✅ Primary database (write-only)
- ✅ 2-3 read replicas
- ✅ Connection pooling: PgBouncer
- ✅ Automatic failover: Patroni

```
Primary DB (writes, appointments, confirmations)
     ↓
Replica 1 (doctor search, patient history)
Replica 2 (analytics, reporting)
Replica 3 (backup)
```

**Read/Write Split Strategy:**
```typescript
// Critical operations: Write to primary
const appointment = await Appointment.create(...); // PRIMARY

// Non-critical reads: Read from replica
const doctorList = await Doctor.getAll(); // REPLICA
```

#### Phase 3: Database Sharding (50k+ daily users)
- **Shard Key**: `patient_id` (distribute by patient location/ID)
- **Number of Shards**: 4-8 initially, expandable to 16+
- **Strategy**: Directory-based sharding with migration support

```
Shard 1: Patients A-D, Appointments for these patients
Shard 2: Patients E-H, Appointments for these patients
Shard 3: Patients I-L, Appointments for these patients
Shard 4: Patients M-Z, Appointments for these patients

Global Tables (replicated across shards):
- doctors
- time_slots
- system_config
```

**Shard Selection Logic:**
```typescript
function getShardId(patientId: string): number {
  const hash = crc32(patientId) % SHARD_COUNT;
  return hash;
}

const connection = shardPool.getConnection(getShardId(patientId));
```

### 2.3 Backup & Disaster Recovery

```
Daily: Full backup to S3
Hourly: WAL archiving to S3
RPO (Recovery Point Objective): 1 hour
RTO (Recovery Time Objective): 15 minutes

Backup Retention:
- 7 days: Daily backups
- 30 days: Weekly backups
- 1 year: Monthly backups
```

## 3. Concurrency Control

### 3.1 Booking Transaction Flow

```typescript
// SERIALIZABLE transaction ensures:
// - No dirty reads
// - No non-repeatable reads
// - No phantom reads
// - No serialization conflicts

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  // Step 1: Lock the slot (pessimistic locking)
  SELECT * FROM time_slots 
  WHERE id = ? 
  FOR UPDATE;  // Row-level exclusive lock

  // Step 2: Verify availability
  IF (slot.current_bookings >= slot.max_capacity) {
    ABORT;
  }

  // Step 3: Check patient doesn't have duplicate booking
  SELECT id FROM appointments 
  WHERE time_slot_id = ? AND patient_id = ?
  FOR UPDATE;

  IF EXISTS {
    ABORT;
  }

  // Step 4: Create appointment
  INSERT INTO appointments (...)
  VALUES (...);

  // Step 5: Update slot capacity
  UPDATE time_slots
  SET current_bookings = current_bookings + 1,
      status = CASE WHEN current_bookings + 1 >= max_capacity 
                    THEN 'BOOKED' ELSE 'AVAILABLE' END
  WHERE id = ?;

  // Step 6: Audit log
  INSERT INTO appointment_audit_log (...);

COMMIT;
```

### 3.2 Lock Management

**Lock Hierarchy** (to prevent deadlocks):
1. Lock time_slot (FOR UPDATE)
2. Lock appointments for slot (FOR UPDATE)
3. Insert/Update other tables

**Deadlock Handling:**
```typescript
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    await createAppointment();
    break;
  } catch (error) {
    if (error.code === '40P01') { // Serialization failure
      console.log(`Retry ${i + 1}/${MAX_RETRIES}`);
      await sleep(100 * (i + 1)); // Exponential backoff
      if (i === MAX_RETRIES - 1) throw error;
    }
  }
}
```

### 3.3 Optimistic Locking (Alternative Approach)

For high-contention scenarios, implement version-based optimistic locking:

```sql
-- Add version column to time_slots
ALTER TABLE time_slots ADD COLUMN version INTEGER DEFAULT 1;

-- Update with version check
UPDATE time_slots
SET current_bookings = current_bookings + 1,
    version = version + 1
WHERE id = ? AND version = ?;

-- Check affected rows == 1 to detect conflicts
IF ROW COUNT != 1 {
  RETRY;
}
```

## 4. Appointment Expiry Mechanism

### 4.1 Pending Appointment Lifecycle

```
T+0:    Appointment created with status=PENDING
        expires_at = NOW() + 5 minutes
        
T+0-4m: Patient completes payment
        Payment service calls POST /confirm
        
T+5m:   If not confirmed, automatic cleanup job:
        UPDATE appointments 
        SET status='CANCELLED' 
        WHERE status='PENDING' AND expires_at < NOW()
        
        Slot capacity freed:
        UPDATE time_slots
        SET current_bookings = current_bookings - 1
```

### 4.2 Cleanup Job Implementation

**Option 1: Scheduled Job (PostgreSQL)**
```sql
-- Run every minute
SELECT cron.schedule('cleanup-expired-appointments', 
  '* * * * *',
  'SELECT cleanup_expired_appointments();'
);

CREATE FUNCTION cleanup_expired_appointments() 
RETURNS TABLE (cancelled_count INTEGER) AS $$
BEGIN
  WITH cancelled AS (
    UPDATE appointments
    SET status='CANCELLED', cancelled_at=NOW()
    WHERE status='PENDING' AND expires_at < NOW()
    RETURNING id, time_slot_id
  )
  UPDATE time_slots
  SET current_bookings = current_bookings - 1
  WHERE id IN (SELECT time_slot_id FROM cancelled);
END;
$$ LANGUAGE plpgsql;
```

**Option 2: Application-Level Cleanup**
```typescript
// Run every 30 seconds
setInterval(async () => {
  try {
    const cancelled = await Appointment.cancelExpiredAppointments();
    logger.info(`Cleaned up ${cancelled.length} expired appointments`);
  } catch (error) {
    logger.error('Cleanup job failed', error);
  }
}, 30_000);
```

**Option 3: Message Queue (Preferred for Microservices)**
```
1. At appointment creation, emit event:
   {
     "event": "appointment.created",
     "appointmentId": "uuid",
     "expiresAt": "2024-12-12T10:05:00Z"
   }

2. Message queue (RabbitMQ) schedules delayed message

3. At expiry time, consumer receives message and cancels:
   if (appointment.status === 'PENDING') {
     appointment.status = 'CANCELLED';
     freeSlot(appointment.time_slot_id);
   }
```

## 5. Caching Strategy

### 5.1 Cache Layers

```
Request
  ↓
[L1 Cache: In-Memory App Cache]
  ↓
[L2 Cache: Redis]
  ↓
[Database: PostgreSQL]
```

### 5.2 Cache Implementation

```typescript
// Available slots - cache with 30-second TTL
async function getAvailableSlots(doctorId: string) {
  const cacheKey = `slots:${doctorId}:available`;
  
  // Try cache first
  let slots = await redis.get(cacheKey);
  if (slots) return JSON.parse(slots);
  
  // Cache miss - query database
  slots = await db.query(
    'SELECT * FROM time_slots WHERE doctor_id = ? AND status = "AVAILABLE"',
    [doctorId]
  );
  
  // Store in cache
  await redis.setex(cacheKey, 30, JSON.stringify(slots));
  return slots;
}

// Invalidate cache on booking
async function createAppointment(...) {
  const appointment = await db.createAppointment(...);
  
  // Invalidate affected caches
  await redis.del(`slots:${appointment.doctor_id}:available`);
  await redis.del(`patient:${appointment.patient_id}:upcoming`);
  
  return appointment;
}
```

### 5.3 Cache Invalidation Strategy

| Data | TTL | Invalidation Trigger |
|------|-----|---------------------|
| Doctor list | 1 hour | Manual update |
| Available slots | 30 sec | Appointment booking |
| Patient appointments | 1 min | Status change |
| Doctor schedule | 2 hours | Slot creation |
| System config | 24 hours | Admin update |

## 6. Message Queue Integration

### 6.1 Async Operations with RabbitMQ

```
Appointment Confirmation Flow:

1. Patient confirms → API returns 200 immediately
2. Event: appointment.confirmed emitted
3. Queue receives message
4. Async consumers:
   - Send confirmation email
   - Send SMS to doctor
   - Update payment system
   - Generate invoice
   - Notify clinic staff
```

### 6.2 Message Schema

```typescript
interface AppointmentEvent {
  eventType: 'appointment.created' | 'appointment.confirmed' | 'appointment.cancelled';
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  timestamp: ISO8601;
  retryCount: number;
  deadLetterExchange?: string;
}

// Producer
const event: AppointmentEvent = {
  eventType: 'appointment.confirmed',
  appointmentId: appointment.id,
  patientId: appointment.patient_id,
  doctorId: appointment.doctor_id,
  appointmentDate: appointment.appointment_date,
  timestamp: new Date().toISOString(),
  retryCount: 0,
};

await messageQueue.publish('appointments.exchange', 'confirmed', event, {
  persistent: true,
  maxRetries: 3,
  retryDelay: 5000,
});
```

## 7. HIPAA Compliance Considerations

### 7.1 Data Protection

```
✅ Encryption at Rest:
   - Database encryption (RDS encryption, TDE)
   - Medical records stored in encrypted S3
   - Backups encrypted with KMS

✅ Encryption in Transit:
   - TLS 1.2+ for all communication
   - VPC endpoints for AWS services
   - Encrypted RDS connection strings

✅ Access Control:
   - Role-based access control (RBAC)
   - API authentication & authorization
   - Database user permissions restricted

✅ Audit Logging:
   - All appointment changes logged
   - User access audited
   - Query logs (with PII masking)
   - Immutable audit trail in separate DB
```

### 7.2 PII Handling

```typescript
// Mask PII in logs
const sanitizeAppointment = (appointment: Appointment) => {
  const sanitized = { ...appointment };
  sanitized.patient_name = '***';
  sanitized.patient_email = '***@***.***';
  sanitized.patient_phone = '***-****';
  return sanitized;
};

// Database level encryption for sensitive fields
// Use pgcrypto extension
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  name TEXT ENCRYPTED,
  email TEXT ENCRYPTED,
  phone TEXT ENCRYPTED,
  ...
);
```

## 8. Monitoring & Observability

### 8.1 Key Metrics

```
Performance Metrics:
- Appointment booking latency (p50, p99)
- Confirmation rate (% of PENDING → CONFIRMED within 5 min)
- Database query latency
- Cache hit rate

Business Metrics:
- Daily appointment bookings
- Cancellation rate
- Doctor utilization rate
- Patient retention

System Metrics:
- CPU/Memory utilization
- Database connections
- API error rate (4xx, 5xx)
- Message queue depth
```

### 8.2 Alerting Rules

```yaml
# Prometheus alerts
alerts:
  - name: HighBookingLatency
    condition: histogram_quantile(0.99, booking_latency_ms) > 1000
    severity: warning
    
  - name: LowConfirmationRate
    condition: confirmation_rate < 0.95
    severity: critical
    
  - name: DatabaseConnectionPoolExhausted
    condition: db_active_connections > db_max_connections * 0.9
    severity: critical
    
  - name: MessageQueueBacklog
    condition: mq_queue_depth > 10000
    severity: warning
```

## 9. Deployment Strategy

### 9.1 Blue-Green Deployment

```
Stage 1: Prepare
  - Deploy new version to blue environment
  - Run smoke tests
  
Stage 2: Validate
  - Canary traffic (5%) to blue
  - Monitor error rate & latency
  
Stage 3: Switch
  - Shift 100% traffic to blue
  - Green remains as rollback target
  
Stage 4: Cleanup
  - After 1 hour with no issues, retire green
```

### 9.2 Database Migration Strategy

```
1. Add new column with DEFAULT
   ALTER TABLE appointments ADD COLUMN new_field VARCHAR(255) DEFAULT 'value';

2. Deploy application with dual-write
   - Writes to both old and new columns
   
3. Backfill data
   UPDATE appointments SET new_field = ... WHERE new_field IS NULL;
   
4. Monitor for issues (48 hours)

5. Remove dual-write, switch to new_field only

6. Drop old column
   ALTER TABLE appointments DROP COLUMN old_field;
```

## 10. Cost Optimization

### 10.1 Database Optimization

```
✅ Connection pooling reduces overhead
✅ Prepared statements reduce parsing
✅ Batch operations (bulk inserts)
✅ Archival of old appointments to cold storage

Cost Breakdown (Monthly):
- RDS: $500-1000 (multi-AZ)
- Replication: +30%
- Backups: $100-200
- Data transfer: ~$50
```

### 10.2 Infrastructure Optimization

```
✅ Right-sized compute instances
✅ Auto-scaling based on load
✅ Reserved instances for baseline capacity
✅ Spot instances for non-critical jobs

Estimated Monthly Costs:
- Compute (App): $200-400
- Database: $500-1000
- Message Queue: $100-200
- Cache: $50-100
- Storage: $50-100
- Monitoring: $100-200
─────────────
Total: $1000-2000/month for 50k daily users
```

## 11. Future Enhancements

### 11.1 Recommended Features
- [ ] Video consultation support with Jitsi/Zoom integration
- [ ] AI-powered appointment recommendations
- [ ] Machine learning for no-show prediction
- [ ] Telemedicine integration
- [ ] Prescription management system
- [ ] Patient feedback & reviews
- [ ] Integration with EHR systems (HL7 FHIR)
- [ ] Multi-language support
- [ ] Mobile app with push notifications

### 11.2 Technology Roadmap

**Q1 2025**: 
- Implement read replicas
- Redis caching layer
- RabbitMQ integration

**Q2 2025**:
- Multi-tenant support
- Advanced analytics dashboard
- AI scheduling optimization

**Q3 2025**:
- Database sharding
- Microservices split
- GraphQL API layer

## Conclusion

This design provides a foundation for scaling healthcare appointment bookings from small clinics (100 daily users) to large hospital networks (100k+ daily users). The emphasis on **concurrency safety**, **HIPAA compliance**, and **reliability** ensures patient data integrity and system stability at all scales.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: March 2025
