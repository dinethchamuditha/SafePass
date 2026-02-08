import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import MapView from './components/MapView';
import GalleryView from './components/GalleryView';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import EmailCollectionModal from './components/EmailCollectionModal';
import Header from './components/Header';
import EmergencyContacts from './components/EmergencyContacts';
import { saveUserEmail } from './firebase/config';

function App() {
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (mapReady && dataReady) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mapReady, dataReady]);

  // Check if should show email modal
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('safepass_email_collected');
    if (!hasSeenModal && !loading) {
      // Show modal after loading screen disappears
      setTimeout(() => setShowEmailModal(true), 1000);
    }
  }, [loading]);

  const handleMapReady = () => {
    setMapReady(true);
  };

  const handleDataReady = () => {
    setDataReady(true);
  };

  const handleEmailSubmit = async (email) => {
    try {
      await saveUserEmail(email);
      localStorage.setItem('safepass_email_collected', 'true');
      localStorage.setItem('user_email', email);
      setShowEmailModal(false);
    } catch (error) {
      console.error('Failed to save email:', error);
      // Show error to user and don't close the modal
      alert('Failed to save your email. Please check your connection and try again.');
      // Don't mark as seen so user can try again
      // Don't close the modal to allow retry
    }
  };

  const handleEmailClose = () => {
    localStorage.setItem('safepass_email_collected', 'true');
    setShowEmailModal(false);
  };

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen flex flex-col relative">
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <LoadingScreen isVisible={loading} />
                <MapView
                  onMapReady={handleMapReady}
                  onDataReady={handleDataReady}
                />
              </>
            }
          />
          <Route path="/updates/:id?" element={
            <ErrorBoundary>
              <GalleryView />
            </ErrorBoundary>
          } />
          <Route path="/updates" element={
            <ErrorBoundary>
              <GalleryView />
            </ErrorBoundary>
          } />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Email Collection Modal */}
        {showEmailModal && (
          <EmailCollectionModal
            onSubmit={handleEmailSubmit}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;