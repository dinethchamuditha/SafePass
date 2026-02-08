import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ isVisible }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setIsFading(false);
    }
  }, [isVisible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-slate-50 transition-opacity duration-300 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-3">
          SafePass
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 mb-10 font-medium">Stay Safe. පරිස්සමින් ඉන්න</p>
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
      </div>
      <footer className="absolute bottom-8 text-sm text-slate-500 flex flex-col items-center gap-1">

        <p className="text-red-600 font-semibold">
          හදිසි අවස්තාවකදී 117 අමතන්න.
        </p>

        <p>
          A volunteer initiative by{' '}
          <a
            href="https://toolteek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
          >
            ToolTeek
          </a>
        </p>

      </footer>

    </div>
  );
};

export default LoadingScreen;
