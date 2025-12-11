# Healthcare Appointment Booking System - Backend

A high-concurrency, production-grade backend system for managing doctor appointments with advanced concurrency handling, atomic transactions, and HIPAA-compliant design patterns.

## 🏥 Features

### Core Functionality
- **Doctor Management**: Register doctors with specializations, clinic details, and license information
- **Patient Management**: Patient registration with medical history, allergies, and emergency contacts
- **Appointment Booking**: Concurrent-safe appointment booking with race condition prevention
- **Time Slot Management**: Flexible slot creation, availability tracking, and capacity management
- **Real-time Status**: PENDING → CONFIRMED → COMPLETED workflow with automatic expiry
- **Audit Trail**: Complete appointment history and status change tracking

### Technical Highlights
- **Concurrency Safety**: Uses database-level locking with SERIALIZABLE isolation to prevent overbooking
- **Atomic Transactions**: All critical operations wrapped in transactions with rollback support
- **Automatic Expiry**: Pending bookings automatically expire after 5 minutes without confirmation
- **Scalable Design**: Built with microservices and horizontal scaling in mind
- **Type Safety**: Full TypeScript implementation with strict type checking

## 🛠️ Tech Stack

- **Backend Framework**: Node.js + Express.js
- **Database**: PostgreSQL 12+ (with SERIALIZABLE transactions)
- **Language**: TypeScript
- **Additional Libraries**: 
  - `pg` - PostgreSQL client
  - `dotenv` - Environment configuration
  - `cors` - Cross-origin requests
  - `uuid` - Unique ID generation

## 📋 Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ running locally or remotely
- Basic knowledge of REST APIs and TypeScript

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd healthcare-backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_appointments
DB_USER=postgres
DB_PASSWORD=postgres
APPOINTMENT_EXPIRY_MINUTES=5
```

### 3. Initialize Database

```bash
npm run db:init
```

This will create all required tables, indexes, and enums.

### 4. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:5000

### 5. Build for Production

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Doctors API

#### Create Doctor
```http
POST /doctors
Content-Type: application/json

{
  "name": "Dr. Sarah Johnson",
  "specialization": "Cardiology",
  "email": "sarah@clinic.com",
  "phone": "+1234567890",
  "license_number": "MD12345",
  "clinic_name": "City Heart Clinic",
  "address": "123 Medical Plaza, City",
  "bio": "20 years of experience in cardiac care"
}
```

#### Get All Doctors
```http
GET /doctors?limit=20&offset=0
```

#### Search Doctors by Specialization
```http
GET /doctors/specialization/cardiology
```

#### Get Doctor Profile
```http
GET /doctors/{doctorId}
```

### Time Slots API

#### Create Time Slot
```http
POST /doctors/{doctorId}/time-slots
Content-Type: application/json

{
  "slot_date": "2024-12-20",
  "slot_time": "10:00:00",
  "duration_minutes": 30,
  "max_capacity": 1
}
```

#### Bulk Create Slots
```http
POST /doctors/{doctorId}/time-slots/bulk
Content-Type: application/json

{
  "slots": [
    {"slot_date": "2024-12-20", "slot_time": "09:00:00", "max_capacity": 1},
    {"slot_date": "2024-12-20", "slot_time": "10:00:00", "max_capacity": 1},
    {"slot_date": "2024-12-20", "slot_time": "11:00:00", "max_capacity": 1}
  ]
}
```

#### Get Available Slots
```http
GET /doctors/{doctorId}/available-slots?from_date=2024-12-20&to_date=2024-12-31
```

### Patients API

#### Register Patient
```http
POST /patients
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "Male",
  "blood_group": "O+",
  "allergies": "Penicillin",
  "medical_history": "Hypertension, Diabetes",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+1234567899"
}
```

#### Get Patient Profile
```http
GET /patients/{patientId}
```

### Appointments API

#### Book Appointment (Create PENDING)
```http
POST /appointments
Content-Type: application/json

{
  "patient_id": "uuid-here",
  "doctor_id": "uuid-here",
  "time_slot_id": "uuid-here",
  "appointment_date": "2024-12-20",
  "appointment_time": "10:00:00",
  "reason_for_visit": "Regular checkup",
  "consultation_type": "in-person"
}
```

**Response** (PENDING status - valid for 5 minutes):
```json
{
  "success": true,
  "message": "Appointment booked successfully. Please confirm within 5 minutes.",
  "data": {
    "id": "appointment-uuid",
    "status": "PENDING",
    "expires_at": "2024-12-12T10:05:00Z",
    ...
  }
}
```

#### Confirm Appointment (PENDING → CONFIRMED)
```http
POST /appointments/{appointmentId}/confirm
```

#### Cancel Appointment
```http
POST /appointments/{appointmentId}/cancel
Content-Type: application/json

{
  "reason": "Patient is unable to attend"
}
```

#### Get Appointment Details
```http
GET /appointments/{appointmentId}
```

#### Get Patient Appointments
```http
GET /appointments/patient/{patientId}?status=CONFIRMED
```

#### Get Doctor Appointments
```http
GET /appointments/doctor/{doctorId}?date=2024-12-20
```

## 🔐 Concurrency Safety

### How We Prevent Overbooking

The system uses **SERIALIZABLE transaction isolation** level with **row-level locking** to ensure:

1. **Atomicity**: Entire booking transaction (slot check → appointment creation → slot update) is atomic
2. **Consistency**: Slot capacity is never exceeded
3. **Isolation**: Concurrent requests see consistent state
4. **Durability**: Confirmed bookings persist reliably

### Key Implementation Details

```typescript
// Appointment booking uses SERIALIZABLE isolation
BEGIN ISOLATION LEVEL SERIALIZABLE;
  SELECT * FROM time_slots WHERE id = $1 FOR UPDATE;  // Lock slot
  INSERT INTO appointments (...);                      // Create appointment
  UPDATE time_slots SET current_bookings = ...;        // Decrement capacity
COMMIT;
```

## 📊 Database Schema

### Tables

- **doctors**: Doctor profiles and credentials
- **patients**: Patient information and medical history
- **time_slots**: Available appointment time slots
- **appointments**: Actual bookings with status tracking
- **appointment_audit_log**: Audit trail for compliance

### Key Constraints

- UNIQUE constraint on (doctor_id, slot_date, slot_time)
- UNIQUE constraint on (time_slot_id, patient_id)
- Foreign key constraints for referential integrity
- Status enums: PENDING, CONFIRMED, CANCELLED, COMPLETED
- Slot status enums: AVAILABLE, BOOKED, BLOCKED

## 🔄 Workflow

### Standard Appointment Flow

```
1. Patient registers (or logs in)
2. Browse doctors and available slots
3. Click "Book Appointment"
   → Appointment created with PENDING status
   → 5-minute confirmation window starts
4. Complete payment and confirm
   → Appointment status → CONFIRMED
   → Confirmation email sent
5. On appointment date
   → Doctor marks as COMPLETED
   → Patient can leave review
```

### Edge Cases Handled

- **Concurrent Bookings**: Race conditions prevented by SERIALIZABLE locks
- **Expired PENDING**: Automatic cleanup after 5 minutes
- **Overbooking**: Slot capacity enforced at database level
- **Double Confirmation**: Idempotent confirm operation
- **Cancellation During Confirmation**: Atomic rollback ensures slot is freed

## 🏗️ Scalability Considerations

### Current Design (Single Instance)

- ✅ Atomic transactions prevent data corruption
- ✅ Indexes optimize query performance
- ✅ Connection pooling prevents resource exhaustion
- ✅ Handles 100-1000 concurrent users

### Future Scaling (Production)

See `SYSTEM_DESIGN.md` for:
- Database sharding strategies
- Read replicas and load balancing
- Message queue integration
- Microservices decomposition
- Caching layers (Redis)
- Rate limiting and circuit breakers

## 🧪 Testing

### Manual Testing with cURL

```bash
# Create a doctor
curl -X POST http://localhost:5000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "specialization": "General",
    "email": "test@clinic.com",
    "phone": "1234567890",
    "license_number": "TEST123"
  }'

# Create time slots
curl -X POST http://localhost:5000/api/doctors/{doctorId}/time-slots \
  -H "Content-Type: application/json" \
  -d '{
    "slot_date": "2024-12-20",
    "slot_time": "10:00:00"
  }'
```

## 📝 Logging

Structured logging throughout:
- Database connection status
- Request/response details
- Error stack traces
- Transaction rollbacks
- Appointment expiry cleanups

## 🔒 Security Features

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configured
- ✅ Error messages don't leak internal details
- ✅ Audit logging for compliance
- ✅ Health check endpoint without authentication

## 🐛 Troubleshooting

### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database name exists

### Unique Constraint Violation on Doctor Email
```
Error: duplicate key value violates unique constraint "doctors_email_key"
```
- Use different email for each doctor
- Or query by email first and update existing

### Appointment Booking Fails "Slot Fully Booked"
```
Error: This slot is fully booked
```
- Normal behavior when max_capacity is reached
- User should select a different slot

## 📦 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production

```
NODE_ENV=production
PORT=5000
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=healthcare_appointments_prod
DB_USER=app_user
DB_PASSWORD=secure_password_here
APPOINTMENT_EXPIRY_MINUTES=5
```

## 📄 License

MIT

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation
3. Check database logs: `SELECT * FROM appointment_audit_log`
4. Enable verbose logging in development

---

**Built with ❤️ for healthcare professionals and patients**
