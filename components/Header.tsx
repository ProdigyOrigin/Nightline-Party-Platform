'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, getBadgeType } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, loading } = useAuth();
  const supabase = createClient();
  const canViewProfilePicture = false;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nightline_user');
    window.location.href = '/';
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown-container')) {
          setIsUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserDropdownOpen]);

  const getBadgeClass = (badgeType: string | null) => {
    switch (badgeType) {
      case 'owner':
        return 'text-white bg-transparent'; // removed border
      case 'admin':
        return 'text-[var(--color-bg-primary)] bg-[var(--color-badge-admin)]';
      case 'promoter':
        return 'text-[var(--color-bg-primary)] bg-[var(--color-badge-promoter)]';
      default:
        return '';
    }
  };

  const renderNavLinks = () => {
    if (loading) {
      return <div className="text-secondary">Loading...</div>;
    }

    if (!user) {
      return (
        <>
          <Link href="/" className="hover:text-primary-neon transition-colors">Home</Link>
          <Link href="/login" className="hover:text-primary-neon transition-colors">Login</Link>
          <Link href="/signup" className="btn-primary">Sign up</Link>
        </>
      );
    }

    const baseLinks = (
      <>
        <Link href="/" className="hover:text-primary-neon transition-colors">Home</Link>
      </>
    );

    const roleSpecificLinks = () => {
      switch (user.role) {
        case 'user':
          return (
            <>
              <Link href="/support" className="hover:text-primary-neon transition-colors">Support</Link>
            </>
          );
        case 'promoter':
          return (
            <>
              <Link href="/my-events" className="hover:text-primary-neon transition-colors">My events</Link>
              <Link href="/support" className="hover:text-primary-neon transition-colors">Support</Link>
            </>
          );
        case 'admin':
        case 'owner':
          return (
            <>
              <Link href="/event-review" className="hover:text-primary-neon transition-colors">Event review</Link>
              <Link href="/published-events" className="hover:text-primary-neon transition-colors">Published events</Link>
              <Link href="/support-inbox" className="hover:text-primary-neon transition-colors">Support inbox</Link>
              {user.role === 'owner' && (
                <Link href="/user-management" className="hover:text-primary-neon transition-colors">User management</Link>
              )}
            </>
          );
        default:
          return null;
      }
    };

    return (
      <>
        {baseLinks}
        {roleSpecificLinks()}
      </>
    );
  };

  return (
    <header className="bg-secondary border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-primary-neon">Nightline</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {renderNavLinks()}
            {user && !loading && (
              <div className="user-dropdown-container relative">
                <div 
                  className="flex items-center space-x-1 cursor-pointer hover:text-primary-neon transition-colors"
                  onClick={toggleUserDropdown}
                >
                  <span className="text-sm">{user.username}</span>
                  {getBadgeType(user.role) && (
                    <span
                      className={`inline-flex items-center px-1 py-0.5 rounded ${getBadgeClass(getBadgeType(user.role))}`}
                      aria-label="Verified user badge"
                      title="Verified"
                    >
                      <img
                        src="/verified.svg"
                        alt="Verified"
                        className="w-4 h-4"
                      />
                      <span className="sr-only">Verified</span>
                    </span>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-secondary border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="text-sm font-medium text-white">{user.username}</div>
                            {user.role !== 'user' && (
                              <div className="text-xs text-secondary capitalize">{user.role}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm hover:bg-gray-800 hover:text-primary-neon transition-colors"
                      >
                        Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 hover:text-primary-neon transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-3">
              {renderNavLinks()}
              {user && !loading && (
                <div className="flex flex-col space-y-2 pt-2 border-t border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{user.username}</span>
                    {getBadgeType(user.role) && (
                      <span
                        className={`inline-flex items-center px-1 py-0.5 rounded ${getBadgeClass(getBadgeType(user.role))}`}
                        aria-label="Verified user badge"
                        title="Verified"
                      >
                        <img
                          src="/verified.svg"
                          alt="Verified"
                          className="w-4 h-4"
                        />
                        <span className="sr-only">Verified</span>
                      </span>
                    )}
                  </div>
                  <Link href="/profile" className="hover:text-primary-neon transition-colors">
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="hover:text-primary-neon transition-colors text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
