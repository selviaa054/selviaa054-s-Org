import { CheckCircle2, LogOut, ShieldCheck, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileViewProps {
  onGoToAuth: () => void;
  onGoToAdmin: () => void;
  onLoggedOut: () => void;
}

export function ProfileView({ onGoToAuth, onGoToAdmin, onLoggedOut }: ProfileViewProps) {
  const { user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [postalCode, setPostalCode] = useState(user?.postal_code || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setPostalCode(user.postal_code || '');
    }
  }, [user]);

  if (!user) {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-8 text-center">
          <User className="w-9 h-9 text-[#BE3E6E] mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26] mb-2">
            Sign in to view your profile
          </h1>
          <p className="text-sm text-[#6E5A67] mb-6">
            Save your default shipping address and contact details for faster snack checkout.
          </p>
          <button
            type="button"
            onClick={onGoToAuth}
            className="px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
          >
            Sign In or Register
          </button>
        </div>
      </section>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);
    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLoggedOut();
  };

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#8B5E78] mb-1">
            {user.email} · Account Role: {user.role === 'admin' ? 'Administrator' : 'Customer'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26]">
            My Profile &amp; Address
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EAE2FA] text-[#53389E] text-xs font-semibold hover:bg-[#DFD2F8] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8D7E2] bg-white text-xs font-semibold text-[#6E5A67] hover:text-[#B91C1C] hover:border-[#F3C6D4] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#EFE1EA] bg-white p-6 sm:p-8 space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#F3C6D4] bg-[#FFF2F6] px-4 py-3 text-xs sm:text-sm text-[#9D2954]"
          >
            {error}
          </div>
        )}

        {savedNotice && (
          <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-xs sm:text-sm text-[#15803D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile details updated successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812-3456-7890"
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-address" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
            Default Shipping Address
          </label>
          <textarea
            id="profile-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street name, house number, district"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-city" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              City
            </label>
            <input
              id="profile-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Jakarta Selatan"
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="profile-postal" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Postal Code
            </label>
            <input
              id="profile-postal"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12730"
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 h-11 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
