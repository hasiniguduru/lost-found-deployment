import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../services/api';

export const AuthPage: React.FC = () => {
  const { loginWithCredentials, registerAccount } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('OWNER');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (mode === 'REGISTER') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        errors.fullName = 'Please enter your full name (at least 2 characters).';
      }
      if (!campusId.trim() || campusId.trim().length < 3) {
        errors.campusId = 'Please enter your Campus ID (e.g., STU-2026-101).';
      }
      if (!department.trim() || department.trim().length < 2) {
        errors.department = 'Please enter your department.';
      }
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
      if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
    } else {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = 'Please enter your email address.';
      }
      if (!password || password.length < 4) {
        errors.password = 'Please enter your password.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        await loginWithCredentials(email.trim(), password);
      } else {
        await registerAccount({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          campusId: campusId.trim(),
          department: department.trim(),
          phone: '',
          role,
        });
      }
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setFieldErrors({
          general: err.response?.data?.message || 'Invalid email or password.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-white rounded-3xl border border-indigo-100 shadow-lg p-6 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Compass className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Lost & Found
          </h1>
          <p className="text-xs text-slate-500">
            Campus community portal
          </p>
        </div>

        {/* Sign In / Sign Up Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-indigo-50 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setFieldErrors({});
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'LOGIN'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-950'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setFieldErrors({});
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'REGISTER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-950'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="Your full name"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:border-indigo-600 ${
                    fieldErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campusId}
                    onChange={(e) => {
                      setCampusId(e.target.value);
                      if (fieldErrors.campusId) setFieldErrors((prev) => ({ ...prev, campusId: '' }));
                    }}
                    placeholder="STU-2026-101"
                    className={`w-full px-3 py-2 text-xs font-mono border rounded-xl focus:border-indigo-600 ${
                      fieldErrors.campusId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.campusId && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.campusId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:border-indigo-600"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="FINDER">Finder</option>
                    <option value="ADMIN_SECURITY">Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    if (fieldErrors.department) setFieldErrors((prev) => ({ ...prev, department: '' }));
                  }}
                  placeholder="e.g., Computer Science"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:border-indigo-600 ${
                    fieldErrors.department ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.department && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.department}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="name@campus.edu"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:border-indigo-600 ${
                fieldErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:border-indigo-600 ${
                fieldErrors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.password}</p>
            )}
          </div>

          {fieldErrors.general && (
            <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-center">
              {fieldErrors.general}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'LOGIN'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
