import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LgpdModal } from './components/LgpdModal';
import { Home } from './pages/Home';
import { ReportPage } from './pages/Report';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { MyReports } from './pages/MyReports';
import { Admin } from './pages/Admin';
import { Comparison } from './pages/Comparison';
import { api, getAuthToken, setAuthToken, getAdminToken, setAdminToken } from './api';
import { User } from './types';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeReportId, setActiveReportId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(Boolean(getAdminToken()));
  const [lgpdModalOpen, setLgpdModalOpen] = useState(false);

  useEffect(() => {
    // Check for user session
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => {
          setAuthToken(null);
        });
    }

    // Check URL query parameters for direct links (e.g. ?report=XYZ or ?page=checkout)
    const urlParams = new URLSearchParams(window.location.search);
    const reportParam = urlParams.get('report') || urlParams.get('reportId');
    const pageParam = urlParams.get('page');

    if (reportParam) {
      setActiveReportId(reportParam);
      if (pageParam === 'checkout') {
        setCurrentPage('checkout');
      } else {
        setCurrentPage('report');
      }
    } else if (pageParam) {
      setCurrentPage(pageParam);
    }
  }, []);

  const navigateTo = (page: string, reportId?: string, planId?: string) => {
    if (reportId) setActiveReportId(reportId);
    if (planId) setSelectedPlanId(planId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update query string cleanly without page reload
    const url = new URL(window.location.href);
    if (page === 'home') {
      url.search = '';
    } else {
      url.searchParams.set('page', page);
      if (reportId) url.searchParams.set('report', reportId);
      else url.searchParams.delete('report');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    if (currentPage === 'my-reports') {
      navigateTo('home');
    }
  };

  const handleLogoutAdmin = () => {
    setAdminToken(null);
    setIsAdminLoggedIn(false);
    navigateTo('home');
  };

  const handleReportGenerated = (newReportId: string) => {
    setActiveReportId(newReportId);
    navigateTo('report', newReportId);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-[#ee4957] selection:text-white transition-colors duration-200">
        {/* Global Navigation with Dark Mode Selector */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          currentPage={currentPage}
          onNavigate={navigateTo}
          isAdminLoggedIn={isAdminLoggedIn}
        />

        {/* Main Content Pages */}
        <main className="flex-1">
          {currentPage === 'home' && (
            <Home
              onReportGenerated={handleReportGenerated}
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
              userId={currentUser?.id}
            />
          )}

          {currentPage === 'report' && activeReportId && (
            <ReportPage
              reportId={activeReportId}
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
            />
          )}

          {currentPage === 'checkout' && activeReportId && (
            <Checkout
              reportId={activeReportId}
              initialPlanId={selectedPlanId}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'comparison' && (
            <Comparison
              reportId={activeReportId || undefined}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'login' && (
            <Login
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                if (activeReportId) {
                  api.claimReport(activeReportId).catch(console.error);
                }
              }}
              onAdminLoginSuccess={() => {
                setIsAdminLoggedIn(true);
              }}
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
            />
          )}

          {currentPage === 'my-reports' && (
            <MyReports
              currentUser={currentUser}
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {currentPage === 'admin' && (
            isAdminLoggedIn ? (
              <Admin
                onLogoutAdmin={handleLogoutAdmin}
                onNavigate={navigateTo}
              />
            ) : (
              <Login
                onLoginSuccess={(user) => setCurrentUser(user)}
                onAdminLoginSuccess={() => {
                  setIsAdminLoggedIn(true);
                  navigateTo('admin');
                }}
                onNavigate={navigateTo}
                onOpenLgpd={() => setLgpdModalOpen(true)}
              />
            )
          )}
        </main>

        {/* Global Footer */}
        <Footer
          onOpenLgpd={() => setLgpdModalOpen(true)}
          onNavigate={navigateTo}
        />

        {/* LGPD Transparency Modal */}
        <LgpdModal
          isOpen={lgpdModalOpen}
          onClose={() => setLgpdModalOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
