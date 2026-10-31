import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
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
import { FreeAccessRequestPage } from './pages/FreeAccessRequest';
import { ActivateAccount } from './pages/ActivateAccount';
import { api, getAuthToken, setAuthToken, getAdminToken, setAdminToken } from './api';
import { User } from './types';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeReportId, setActiveReportId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [activationToken, setActivationToken] = useState<string>('');

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

    // Verify stored admin session with backend
    const aToken = getAdminToken();
    if (aToken) {
      api.adminVerify()
        .then(() => {
          setIsAdminLoggedIn(true);
        })
        .catch(() => {
          setAdminToken(null);
          setIsAdminLoggedIn(false);
        });
    }

    // Check URL query parameters for direct links (e.g. ?report=XYZ or ?page=checkout or ?token=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    const reportParam = urlParams.get('report') || urlParams.get('reportId');
    const pageParam = urlParams.get('page');
    const tokenParam = urlParams.get('token');

    if (tokenParam || pageParam === 'ativar-conta') {
      if (tokenParam) setActivationToken(tokenParam);
      setCurrentPage('ativar-conta');
    } else if (reportParam) {
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

          {currentPage === 'solicitar-acesso' && (
            <FreeAccessRequestPage
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
            />
          )}

          {currentPage === 'ativar-conta' && (
            <ActivateAccount
              tokenFromUrl={activationToken}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                if (activeReportId) {
                  api.claimReport(activeReportId).catch(console.error);
                }
              }}
              onNavigate={navigateTo}
              onOpenLgpd={() => setLgpdModalOpen(true)}
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
            currentUser && currentUser.role !== 'admin' ? (
              <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading">
                  Acesso Restrito ao Administrador
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Esta área é exclusiva para a administração da plataforma. Sua conta conectada (cliente) não possui privilégios administrativos.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigateTo('my-reports')}
                    className="px-5 py-2.5 rounded-xl bg-[#ee4957] hover:bg-[#d93c4a] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    Voltar para Meus Relatórios
                  </button>
                </div>
              </div>
            ) : isAdminLoggedIn ? (
              <Admin
                onLogoutAdmin={handleLogoutAdmin}
                onNavigate={navigateTo}
              />
            ) : (
              <Login
                initialMode="admin"
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
