import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEmergencyContacts = () => {
    navigate('/emergency-contacts');
  };

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-[2000] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-white/50 backdrop-blur-sm border-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                SafePass
              </h1>
            </div>

            {/* Emergency Button (Visible on all screens) */}
            <div>
              <button
                onClick={handleEmergencyContacts}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors border border-blue-500 shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency Numbers</span>
                <span className="sm:hidden">Emergency</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;