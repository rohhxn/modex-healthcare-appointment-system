import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/RegisterPage.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Patient-specific fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [bio, setBio] = useState('');

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (userType === 'patient') {
      if (!dateOfBirth) {
        setError('Date of birth is required');
        return false;
      }
    } else {
      if (!licenseNumber.trim()) {
        setError('Medical license number is required');
        return false;
      }
      if (!clinicName.trim()) {
        setError('Clinic name is required');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (userType === 'patient') {
        // Create patient in database via API
        const patientData = {
          name,
          email,
          phone,
          date_of_birth: dateOfBirth,
          gender,
          blood_group: bloodGroup,
        };

        // Call the patient registration API
        const response = await fetch('http://localhost:5000/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to register patient');
        }

        const result = await response.json();
        const patientId = result.data.id;

        // Store patient info in localStorage
        localStorage.setItem('userId', patientId);
        localStorage.setItem('userRole', 'patient');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);

        setSuccess('Patient registration successful! Redirecting...');
        login('patient', patientId, email);

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Create doctor in database via API
        const doctorData = {
          name,
          email,
          phone,
          specialization,
          license_number: licenseNumber,
          clinic_name: clinicName,
          address: clinicAddress,
          bio,
        };

        // Call the doctor registration API
        const response = await fetch('http://localhost:5000/api/doctors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doctorData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to register doctor');
        }

        const result = await response.json();
        const doctorId = result.data.id;

        // Store doctor info in localStorage
        localStorage.setItem('userId', doctorId);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);

        setSuccess(
          'Doctor registration successful! You can now access the admin dashboard to manage your time slots.'
        );
        login('admin', doctorId, email);

        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join our healthcare appointment system</p>
        </div>

        <div className="user-type-selector">
          <button
            onClick={() => {
              setUserType('patient');
              setError(null);
            }}
            className={`user-type-btn ${userType === 'patient' ? 'active' : ''}`}
          >
            <span className="icon">👤</span>
            <span>Register as Patient</span>
          </button>
          <button
            onClick={() => {
              setUserType('doctor');
              setError(null);
            }}
            className={`user-type-btn ${userType === 'doctor' ? 'active' : ''}`}
          >
            <span className="icon">👨‍⚕️</span>
            <span>Register as Doctor</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Common Fields */}
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="form-control"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>

          {/* Patient-specific Fields */}
          {userType === 'patient' && (
            <div className="form-section">
              <h3>Medical Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dob">Date of Birth *</label>
                  <input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-control"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="blood">Blood Group *</label>
                  <select
                    id="blood"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="form-control"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Doctor-specific Fields */}
          {userType === 'doctor' && (
            <div className="form-section">
              <h3>Professional Information</h3>

              <div className="form-group">
                <label htmlFor="license">Medical License Number *</label>
                <input
                  id="license"
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g., MED-2020-001"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Specialization *</label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="form-control"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clinic">Clinic Name *</label>
                  <input
                    id="clinic"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Enter clinic name"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Clinic Address *</label>
                  <input
                    id="address"
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Enter clinic address"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Professional Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your experience and expertise"
                  className="form-control"
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating Account...' : `Register as ${userType === 'patient' ? 'Patient' : 'Doctor'}`}
            </button>
            <p className="login-link">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
