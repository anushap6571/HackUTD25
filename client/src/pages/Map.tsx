import { useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

export const Map = () => {
  const [showParts, setShowParts] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const commonParts = [
    { name: 'Hood', definition: 'The hinged cover over the engine compartment.' },
    { name: 'Grille', definition: 'The front opening that allows air to flow to the radiator.' },
    { name: 'Headlights', definition: 'Front lighting system for visibility and safety.' },
    { name: 'Bumper', definition: 'Protective component at the front and rear of the vehicle.' },
    { name: 'Fender', definition: 'Body panel covering the wheel well area.' },
    { name: 'Windshield', definition: 'Front glass panel that protects occupants from wind and debris.' },
    { name: 'Side Mirror', definition: 'Exterior mirror mounted on the side of the vehicle for rear visibility.' },
    { name: 'Roof', definition: 'Top covering of the vehicle cabin.' },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Define hover area around the dot position
    // Dot is at: left: calc(50% - 100px), top: calc(17.5% + 200px)
    const dotCenterX = rect.width / 2 - 100; // 50% - 100px
    const dotCenterY = rect.height * 0.175 + 200; // 17.5% + 200px
    const hoverRadius = 150; // Radius around the dot to trigger hover
    
    // Check if mouse is within the hover radius of the dot
    const distanceX = x - dotCenterX;
    const distanceY = y - dotCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance <= hoverRadius) {
      setShowParts(true);
      setMousePosition({ x, y });
    } else {
      setShowParts(false);
    }
  };

  const handleMouseLeave = () => {
    setShowParts(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background-light overflow-hidden">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        {/* Car Parts Terms Section */}
        <div className="w-64 bg-white rounded-2xl p-6 shadow-lg flex-shrink-0 overflow-auto">
          <h3 className="font-semibold text-lg mb-4 text-primary text-left">Common Car Parts</h3>
          <div className="space-y-3 text-left">
            {commonParts.map((part, index) => (
              <div key={index} className="border-b border-text-secondary/30 pb-3 last:border-0">
                <p className="font-medium text-sm text-left">{part.name}</p>
                <p className="text-xs text-text-secondary mt-1 text-left">{part.definition}</p>
              </div>
            ))}
          </div>
        </div>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-auto relative flex items-center justify-center">
          {/* Image fitting the entire area */}
          <div
            className="w-full h-full flex items-center justify-center px-20 py-10 bg-white rounded-2xl relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src="/toyota-sumpra.jpg"
              alt="Toyota Supra"
              className="w-full h-full object-contain"
            />
            
            {/* Hover Indicator Dot */}
            <div
              className="absolute z-5 pointer-events-none"
              style={{
                left: 'calc(50% - 100px)',
                top: 'calc(17.5% + 200px)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse border-2 border-white shadow-lg"></div>
                <div className="absolute inset-0 w-4 h-4 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            
            {/* Parts Definition Tooltip */}
            {showParts && (
              <div
                className="absolute z-10 bg-text-dark text-text-light p-4 rounded-lg shadow-xl max-w-md pointer-events-none"
                style={{
                  left: `${mousePosition.x}px`,
                  top: `${mousePosition.y}px`,
                  transform: 'translateY(-50%)',
                }}
              >
                <h3 className="font-semibold text-lg mb-3 text-primary text-left">Common Car Parts</h3>
                <div className="space-y-2 text-left">
                  {commonParts.map((part, index) => (
                    <div key={index} className="border-b border-text-secondary/30 pb-2 last:border-0 text-left">
                      <p className="font-medium text-sm text-left">{part.name}</p>
                      <p className="text-xs text-text-secondary mt-1 text-left">{part.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
