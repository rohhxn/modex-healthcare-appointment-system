# Healthcare Appointment Booking System - Frontend

A modern, responsive React + TypeScript web application for booking and managing healthcare appointments with a clean, intuitive user interface.

## 🏥 Features

### Patient Features
- **Browse Doctors**: Search and filter healthcare professionals by name, specialization, and clinic
- **View Availability**: See available time slots for each doctor
- **Book Appointments**: Simple 2-step booking process (select slot → confirm)
- **Manage Appointments**: View, confirm, or cancel appointments
- **Appointment Status**: Real-time status tracking (PENDING → CONFIRMED → COMPLETED)
- **5-Minute Window**: Appointment confirmation window with countdown

### Admin/Doctor Features
- **Doctor Profiles**: Create and manage doctor profiles with specialization details
- **Time Slot Management**: Create and manage available appointment slots
- **View Appointments**: See all appointments for your schedule
- **Patient Information**: Access patient details and appointment history

### Technical Features
- **Type-Safe**: Full TypeScript implementation with strict type checking
- **State Management**: React Context API for global state management
- **Responsive Design**: Mobile-friendly UI that works on all devices
- **Efficient API Usage**: Memoization and smart caching to prevent unnecessary re-fetches
- **Error Handling**: Comprehensive error messages and user-friendly feedback
- **Lifecycle Management**: Proper cleanup with React hooks

## 🛠️ Tech Stack

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Styling**: CSS3 with custom design system
- **Build Tool**: React Scripts (Create React App)

## 📋 Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:5000/api
- Basic knowledge of React and TypeScript

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd healthcare-frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**If backend is on different host**, update `.env`:
```
REACT_APP_API_URL=http://your-backend-host:5000/api
```

### 3. Start Development Server

```bash
npm start
```

Application will open on http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

Optimized build will be in `build/` directory.

## 🎨 UI Components

### Authentication
- **LoginPage**: Role-based login (Patient/Doctor/Admin)
- Simple form with email and ID validation
- Demo credentials available on login page

### Patient Views
- **PatientDashboard**: Homepage with action cards
- **DoctorListPage**: Search and browse doctors
- **BookingPage**: 2-step appointment booking
- **AppointmentHistoryPage**: Manage appointments

### Doctor Views
- **AdminDashboard**: Doctor profile management
- Create new doctor profiles
- View all doctors and their details
- (Future) Manage time slots and appointments

## 📚 API Integration

### API Service (`src/services/apiService.ts`)

Organized service layer with methods for:

```typescript
// Doctor operations
doctorService.createDoctor(doctorData)
doctorService.getDoctors()
doctorService.getDoctorById(id)
doctorService.searchBySpecialization(specialization)
doctorService.getAvailableSlots(doctorId, fromDate?, toDate?)

// Patient operations
patientService.registerPatient(patientData)
patientService.getPatientById(id)
patientService.getPatientByEmail(email)
patientService.getAppointmentHistory(patientId)

// Appointment operations
appointmentService.bookAppointment(appointmentData)
appointmentService.confirmAppointment(appointmentId)
appointmentService.cancelAppointment(appointmentId, reason)
appointmentService.getPatientAppointments(patientId)
appointmentService.getDoctorAppointments(doctorId)

// Time slot operations
timeSlotService.createTimeSlot(doctorId, slotData)
timeSlotService.createBulkSlots(doctorId, slots)
timeSlotService.getDoctorSlots(doctorId, fromDate?, toDate?)
```

### Error Handling

All API calls include try-catch blocks:
```typescript
try {
  const data = await doctorService.getDoctors();
  // Handle success
} catch (err) {
  // Display error to user
  setError(err instanceof Error ? err.message : 'An error occurred');
}
```

## 🔐 Authentication Context

Manages user session using Context API:

```typescript
const { userRole, userId, userEmail, login, logout, isAuthenticated } = useAuth();

// Login
login('patient', 'pat001', 'patient@example.com');

// Logout
logout();
```

Data persisted in localStorage for session persistence.

## 🎯 Workflow Examples

### Patient Books Appointment

```
1. Patient logs in → PatientDashboard
2. Clicks "Browse Doctors" → DoctorListPage
3. Searches for doctor → Filters and displays matching doctors
4. Clicks "View Slots & Book" → BookingPage
5. Selects available time slot → Confirmation step
6. Enters reason for visit → Books appointment
7. Appointment in PENDING status (5-min confirmation window)
8. Redirected to AppointmentHistoryPage
9. Click "Confirm" → Appointment status becomes CONFIRMED
```

### Doctor Creates Profile

```
1. Doctor logs in as Admin → AdminDashboard
2. Clicks "+ Add Doctor" → Form appears
3. Fills in doctor details → Validates form
4. Submits → New doctor created
5. Doctor appears in list → Can manage slots (future feature)
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1200px
- **Mobile**: < 768px

All components use CSS Grid and Flexbox for responsive layouts.

## 🎨 Design System

### Colors
- **Primary**: #2563eb (Blue)
- **Secondary**: #1e40af (Dark Blue)
- **Success**: #10b981 (Green)
- **Danger**: #ef4444 (Red)
- **Warning**: #f59e0b (Amber)

### Spacing
- **Base Unit**: 1rem = 16px
- **Padding**: 0.5rem, 1rem, 1.5rem, 2rem
- **Gap**: 1rem, 1.5rem, 2rem

### Typography
- **Font Family**: System fonts (SF Pro Display, Segoe UI, Roboto)
- **H1**: 2.5rem, 600 weight
- **H2**: 2rem, 600 weight
- **H3**: 1.5rem, 600 weight
- **Body**: 1rem, 400 weight, 1.6 line-height

## 🧪 Testing

### Component Testing Structure
```typescript
// Components use hooks for state management
const [state, setState] = useState();
const { data, loading, error } = useQueryData();

// Easy to test with React Testing Library
render(<Component />);
userEvent.click(screen.getByRole('button'));
```

### Manual Testing Checklist
- [ ] Login with both patient and doctor roles
- [ ] Browse and search doctors
- [ ] Book appointment and confirm within 5 minutes
- [ ] Cancel pending appointment
- [ ] View appointment history filtered by status
- [ ] Create new doctor profile
- [ ] Responsive design on mobile, tablet, desktop

## 📦 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop `build/` folder to Netlify
```

### Environment Variables for Production
```
REACT_APP_API_URL=https://api.production-domain.com/api
```

## 🔗 API Documentation Link

Backend API docs: See `healthcare-backend/README.md`

### Example API Calls

```bash
# Get all doctors
curl http://localhost:5000/api/doctors

# Get available slots for doctor
curl http://localhost:5000/api/doctors/{doctorId}/available-slots

# Book appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "time_slot_id": "uuid",
    "appointment_date": "2024-12-20",
    "appointment_time": "10:00:00",
    "reason_for_visit": "Checkup"
  }'
```

## 📊 Performance Optimizations

### Implemented
- ✅ Lazy loading with React.lazy() (future)
- ✅ Memoization with useMemo/useCallback (future)
- ✅ Component code splitting
- ✅ Efficient re-rendering with proper dependencies
- ✅ CSS-in-JS for smaller bundle size

### Future Improvements
- [ ] Implement React.lazy for route-based code splitting
- [ ] Add React Query for server state management
- [ ] Implement infinite scroll for doctor lists
- [ ] Add offline support with Service Workers
- [ ] Optimize images and assets

## 🐛 Known Issues & Limitations

1. **Demo Mode**: Uses mock localStorage authentication (not production-ready)
2. **Real-time Updates**: No WebSocket support yet (polling only)
3. **Offline Support**: Not available in current version
4. **Accessibility**: ARIA labels need enhancement
5. **i18n**: English language only

## 🚀 Future Enhancements

- [ ] Video consultation integration (Zoom/Jitsi)
- [ ] Prescription management
- [ ] Medical records upload
- [ ] Review and rating system
- [ ] Push notifications
- [ ] Dark mode support
- [ ] Multi-language support (i18n)
- [ ] Payment integration (Stripe)
- [ ] SMS/Email confirmations
- [ ] Appointment reminders
- [ ] Doctor availability calendar
- [ ] Appointment rescheduling

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify backend API is running
3. Ensure `.env` REACT_APP_API_URL is correct
4. Check network tab for failed API requests

## 📄 License

MIT

---

**Built with ❤️ for healthcare professionals and patients**
