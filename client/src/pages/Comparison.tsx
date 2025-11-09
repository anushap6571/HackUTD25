import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { CarRecCard } from '../components/CarRecCard';
import { CarRecModal } from '../components/CarRecModal';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

export const Comparison = () => {
  // Sample car data - you can replace this with actual data
  const carData = [
    {
      model: 'Toyota Corolla',
      year: 2026,
      totalCost: 10998,
      suggestedDownPayment: 4998,
    },
    {
      model: 'Honda Civic',
      year: 2025,
      totalCost: 12998,
      suggestedDownPayment: 5998,
    },
    {
      model: 'Ford Mustang',
      year: 2026,
      totalCost: 25998,
      suggestedDownPayment: 9998,
    },
  ];

  const [leftCardIndex, setLeftCardIndex] = useState(0);
  const [rightCardIndex, setRightCardIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [slidingOutIndex, setSlidingOutIndex] = useState<{left: number | null, right: number | null}>({left: null, right: null});
  const [shouldSlideOut, setShouldSlideOut] = useState(false);
  const [selectedCar, setSelectedCar] = useState<typeof carData[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');

  const handlePrevious = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShouldSlideOut(false);
    
    // Store the old index that's sliding out
    setSlidingOutIndex(prev => ({ ...prev, left: leftCardIndex }));
    setSlideDirection('left');
    
    // Update the index so new card appears
    const newIndex = leftCardIndex > 0 ? leftCardIndex - 1 : carData.length - 1;
    setLeftCardIndex(newIndex);
    
    // Trigger slide-out animation after card renders
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShouldSlideOut(true);
      });
    });
    
    // After animation completes, reset state
    setTimeout(() => {
      setIsAnimating(false);
      setSlideDirection(null);
      setSlidingOutIndex(prev => ({ ...prev, left: null }));
      setShouldSlideOut(false);
    }, 300); // Match animation duration
  };

  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShouldSlideOut(false);
    
    // Store the old index that's sliding out
    setSlidingOutIndex(prev => ({ ...prev, right: rightCardIndex }));
    setSlideDirection('right');
    
    // Update the index so new card appears
    const newIndex = rightCardIndex < carData.length - 1 ? rightCardIndex + 1 : 0;
    setRightCardIndex(newIndex);
    
    // Trigger slide-out animation after card renders
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShouldSlideOut(true);
      });
    });
    
    // After animation completes, reset state
    setTimeout(() => {
      setIsAnimating(false);
      setSlideDirection(null);
      setSlidingOutIndex(prev => ({ ...prev, right: null }));
      setShouldSlideOut(false);
    }, 300); // Match animation duration
  };
  
  // Get the new card index that will appear
  const getNewCardIndex = () => {
    if (slideDirection === 'left') {
      // New card appears on left, coming from right
      return (leftCardIndex - 1 + carData.length) % carData.length;
    } else if (slideDirection === 'right') {
      // New card appears on right, coming from left
      return (rightCardIndex + 1) % carData.length;
    }
    return null;
  };

  const newCardIndex = getNewCardIndex();

  const handleCardClick = (car: typeof carData[0]) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle chat prompt submission
    console.log('Chat prompt:', chatPrompt);
    setChatPrompt('');
  };

  // Add keyboard event listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys if not currently animating and not typing in an input
      if (isAnimating) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnimating, handlePrevious, handleNext]); // Include handlers in dependencies

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-4 px-4 py-4 items-start min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 w-full">
          {/* Chatbot Prompt Input */}
          <div className="mb-4">
            <form onSubmit={handleChatSubmit} className="w-full">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ask about cars, financing, or get recommendations..."
                  className="flex-1 px-4 py-6 border border-container-stroke rounded-lg bg-container-primary text-text-dark placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-6 bg-primary text-text-light rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
          
          {/* Two Cards Side-by-Side with Animation */}
          <div className="grid grid-cols-2 gap-4 mb-3 relative">
            {/* Left Card Container - Fixed position */}
            <div className="relative overflow-hidden">
              {/* Old Card - Slides out to the left when animating */}
              {slideDirection === 'left' && slidingOutIndex.left !== null && (
                <div
                  className="transition-transform duration-300 ease-in-out cursor-pointer"
                  style={{
                    transform: shouldSlideOut && slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(0)'
                  }}
                  onClick={() => handleCardClick(carData[slidingOutIndex.left!])}
                >
                  <CarRecCard 
                    key={`left-sliding-${slidingOutIndex.left}`}
                    carData={carData[slidingOutIndex.left]} 
                  />
                </div>
              )}
              
              {/* Current Left Card - Shows when not animating */}
              {slideDirection !== 'left' && (
                <div
                  className="cursor-pointer"
                  onClick={() => handleCardClick(carData[leftCardIndex])}
                >
                  <CarRecCard 
                    key={`left-${leftCardIndex}`}
                    carData={carData[leftCardIndex]} 
                  />
                </div>
              )}

              {/* New Card - Fades in to original spot when left arrow clicked */}
              {slideDirection === 'left' && newCardIndex !== null && (
                <div
                  className="absolute left-0 top-0 w-full cursor-pointer"
                  style={{ 
                    opacity: 0,
                    animation: 'fadeIn 0.3s ease-in-out forwards',
                    transform: 'translateX(0)'
                  }}
                  onClick={() => handleCardClick(carData[newCardIndex])}
                >
                  <CarRecCard 
                    key={`new-left-${newCardIndex}`}
                    carData={carData[newCardIndex]} 
                  />
                </div>
              )}
            </div>

            {/* Right Card Container - Fixed position */}
            <div className="relative overflow-hidden">
              {/* Old Card - Slides out to the right when animating */}
              {slideDirection === 'right' && slidingOutIndex.right !== null && (
                <div
                  className="transition-transform duration-300 ease-in-out cursor-pointer"
                  style={{
                    transform: shouldSlideOut && slideDirection === 'right' ? 'translateX(100%)' : 'translateX(0)'
                  }}
                  onClick={() => handleCardClick(carData[slidingOutIndex.right!])}
                >
                  <CarRecCard 
                    key={`right-sliding-${slidingOutIndex.right}`}
                    carData={carData[slidingOutIndex.right]} 
                  />
                </div>
              )}
              
              {/* Current Right Card - Shows when not animating */}
              {slideDirection !== 'right' && (
                <div
                  className="cursor-pointer"
                  onClick={() => handleCardClick(carData[rightCardIndex])}
                >
                  <CarRecCard 
                    key={`right-${rightCardIndex}`}
                    carData={carData[rightCardIndex]} 
                  />
                </div>
              )}

              {/* New Card - Fades in to original spot when right arrow clicked */}
              {slideDirection === 'right' && newCardIndex !== null && (
                <div
                  className="absolute right-0 top-0 w-full cursor-pointer"
                  style={{ 
                    opacity: 0,
                    animation: 'fadeIn 0.3s ease-in-out forwards',
                    transform: 'translateX(0)'
                  }}
                  onClick={() => handleCardClick(carData[newCardIndex])}
                >
                  <CarRecCard 
                    key={`new-right-${newCardIndex}`}
                    carData={carData[newCardIndex]} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 pb-2">
            <button
              onClick={handlePrevious}
              disabled={isAnimating}
              className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-text-dark" />
            </button>
            <button
              onClick={handleNext}
              disabled={isAnimating}
              className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-text-dark" />
            </button>
          </div>
        </main>
      </div>
      
      {/* Car Recommendation Modal */}
      <CarRecModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carData={selectedCar || undefined}
      />
    </div>
  )
}