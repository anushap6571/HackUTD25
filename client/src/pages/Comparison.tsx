import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CarRecCard } from '../components/CarRecCard';
import { CarRecModal } from '../components/CarRecModal';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

// Type for car data from backend
interface BackendCar {
  make: string;
  model: string;
  Entry_price: number;
  year: number;
  image_url: string;
  down_payment: number;
  down_payment_rate: number;
  car_id: string;
}

// Type for car data expected by CarRecCard
interface CarData {
  image?: string;
  model: string;
  year: number;
  totalCost: number;
  suggestedDownPayment: number;
}

// Helper function to map backend car to CarRecCard format
const mapBackendCarToCarData = (backendCar: BackendCar): CarData => {
  return {
    image: backendCar.image_url,
    model: backendCar.model,
    year: backendCar.year,
    totalCost: backendCar.Entry_price,
    suggestedDownPayment: backendCar.down_payment,
  };
};

export const Comparison = () => {
  const { currentUser } = useAuth();
  const [leftCar, setLeftCar] = useState<CarData | null>(null);
  const [rightCar, setRightCar] = useState<CarData | null>(null);
  const [newLeftCar, setNewLeftCar] = useState<CarData | null>(null);
  const [newRightCar, setNewRightCar] = useState<CarData | null>(null);
  const [isLeftAnimating, setIsLeftAnimating] = useState(false);
  const [isRightAnimating, setIsRightAnimating] = useState(false);
  const [leftSlideDirection, setLeftSlideDirection] = useState<'left' | 'right' | null>(null);
  const [rightSlideDirection, setRightSlideDirection] = useState<'left' | 'right' | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial car recommendations
  useEffect(() => {
    const fetchInitialCars = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch car recommendations from backend
        const response = await api.get(`/cars/${currentUser.uid}`);
        console.log(currentUser.uid);
        console.log(response);

        
        if (response.success && response.cars && response.cars.length >= 2) {
          // Map backend cars to CarRecCard format
          const mappedCars = response.cars.map(mapBackendCarToCarData);
          setLeftCar(mappedCars[0]);  // First car (index 0 - even)
          setRightCar(mappedCars[1]); // Second car (index 1 - odd)
        } else if (response.success && response.cars && response.cars.length === 1) {
          // Only one car available - use it for both sides
          const mappedCar = mapBackendCarToCarData(response.cars[0]);
          setLeftCar(mappedCar);
          setRightCar(mappedCar);
        } else {
          setError('No car recommendations available. Please update your profile with budget and credit score.');
        }
      } catch (err: any) {
        console.error('Error fetching car recommendations:', err);
        setError(err.message || 'Failed to load car recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialCars();
  }, [currentUser?.uid]);

  // Left card navigation handlers
  const handleLeftCardPrev = async () => {
    if (isLeftAnimating || !currentUser?.uid) return;
    
    setIsLeftAnimating(true);
    setLeftSlideDirection('left');
    
    try {
      const response = await api.get(`/cars/${currentUser.uid}/prev?side=left`);
      
      if (response.error) {
        console.log(response.message || response.error);
        setIsLeftAnimating(false);
        setLeftSlideDirection(null);
        return;
      }
      
      if (response.success && response.car) {
        const mappedCar = mapBackendCarToCarData(response.car);
        setNewLeftCar(mappedCar);
        
        setTimeout(() => {
          setLeftCar(mappedCar);
          setNewLeftCar(null);
          setIsLeftAnimating(false);
          setLeftSlideDirection(null);
        }, 300);
      } else {
        setIsLeftAnimating(false);
        setLeftSlideDirection(null);
      }
    } catch (err: any) {
      console.error('Error fetching previous car for left:', err);
      setIsLeftAnimating(false);
      setLeftSlideDirection(null);
    }
  };

  const handleLeftCardNext = async () => {
    if (isLeftAnimating || !currentUser?.uid) return;
    
    setIsLeftAnimating(true);
    setLeftSlideDirection('right');
    
    try {
      const response = await api.get(`/cars/${currentUser.uid}/next?side=left`);
      
      if (response.error) {
        console.log(response.message || response.error);
        setIsLeftAnimating(false);
        setLeftSlideDirection(null);
        return;
      }
      
      if (response.success && response.car) {
        const mappedCar = mapBackendCarToCarData(response.car);
        setNewLeftCar(mappedCar);
        
        setTimeout(() => {
          setLeftCar(mappedCar);
          setNewLeftCar(null);
          setIsLeftAnimating(false);
          setLeftSlideDirection(null);
        }, 300);
      } else {
        setIsLeftAnimating(false);
        setLeftSlideDirection(null);
      }
    } catch (err: any) {
      console.error('Error fetching next car for left:', err);
      setIsLeftAnimating(false);
      setLeftSlideDirection(null);
    }
  };

  // Right card navigation handlers
  const handleRightCardPrev = async () => {
    if (isRightAnimating || !currentUser?.uid) return;
    
    setIsRightAnimating(true);
    setRightSlideDirection('left');
    
    try {
      const response = await api.get(`/cars/${currentUser.uid}/prev?side=right`);
      
      if (response.error) {
        console.log(response.message || response.error);
        setIsRightAnimating(false);
        setRightSlideDirection(null);
        return;
      }
      
      if (response.success && response.car) {
        const mappedCar = mapBackendCarToCarData(response.car);
        setNewRightCar(mappedCar);
        
        setTimeout(() => {
          setRightCar(mappedCar);
          setNewRightCar(null);
          setIsRightAnimating(false);
          setRightSlideDirection(null);
        }, 300);
      } else {
        setIsRightAnimating(false);
        setRightSlideDirection(null);
      }
    } catch (err: any) {
      console.error('Error fetching previous car for right:', err);
      setIsRightAnimating(false);
      setRightSlideDirection(null);
    }
  };

  const handleRightCardNext = async () => {
    if (isRightAnimating || !currentUser?.uid) return;
    
    setIsRightAnimating(true);
    setRightSlideDirection('right');
    
    try {
      const response = await api.get(`/cars/${currentUser.uid}/next?side=right`);
      
      if (response.error) {
        console.log(response.message || response.error);
        setIsRightAnimating(false);
        setRightSlideDirection(null);
        return;
      }
      
      if (response.success && response.car) {
        const mappedCar = mapBackendCarToCarData(response.car);
        setNewRightCar(mappedCar);
        
        setTimeout(() => {
          setRightCar(mappedCar);
          setNewRightCar(null);
          setIsRightAnimating(false);
          setRightSlideDirection(null);
        }, 300);
      } else {
        setIsRightAnimating(false);
        setRightSlideDirection(null);
      }
    } catch (err: any) {
      console.error('Error fetching next car for right:', err);
      setIsRightAnimating(false);
      setRightSlideDirection(null);
    }
  };
  
  // Calculate positions for animation
  const getLeftCardTransform = () => {
    if (leftSlideDirection === 'left') return '-translate-x-full';
    if (leftSlideDirection === 'right') return 'translate-x-full';
    return '';
  };

  const getRightCardTransform = () => {
    if (rightSlideDirection === 'left') return '-translate-x-full';
    if (rightSlideDirection === 'right') return 'translate-x-full';
    return '';
  };

  const handleCardClick = (car: CarData) => {
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

  // Add keyboard event listener for arrow keys (optional - can be removed if not needed)
  // Note: Keyboard navigation is now handled by individual card arrows

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
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <p className="text-text-secondary">Loading car recommendations...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex justify-center items-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Two Cards Side-by-Side with Animation */}
          {!loading && !error && leftCar && rightCar && (
            <div className="grid grid-cols-2 gap-4 mb-3 relative">
              {/* Left Card Container - Fixed position */}
              <div className="relative overflow-hidden">
                {/* Navigation Arrows for Left Card */}
                <div className="absolute top-1/2 left-2 z-10 transform -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeftCardPrev();
                    }}
                    disabled={isLeftAnimating || !currentUser?.uid}
                    className="w-8 h-8 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous Left Card"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-dark" />
                  </button>
                </div>
                <div className="absolute top-1/2 right-2 z-10 transform -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeftCardNext();
                    }}
                    disabled={isLeftAnimating || !currentUser?.uid}
                    className="w-8 h-8 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next Left Card"
                  >
                    <ChevronRight className="w-4 h-4 text-text-dark" />
                  </button>
                </div>

                {/* Existing Left Card */}
                <div
                  className={`transition-transform duration-300 ease-in-out ${getLeftCardTransform()} cursor-pointer`}
                  onClick={() => handleCardClick(leftCar)}
                >
                  <CarRecCard 
                    key={`left-${leftCar.model}-${leftCar.year}`}
                    carData={leftCar} 
                  />
                </div>

                {/* New Card - Slides in when navigating */}
                {leftSlideDirection === 'left' && newLeftCar && (
                  <div
                    className="absolute left-0 top-0 w-full animate-slideInFromRight cursor-pointer"
                    onClick={() => handleCardClick(newLeftCar)}
                  >
                    <CarRecCard 
                      key={`new-left-${newLeftCar.model}-${newLeftCar.year}`}
                      carData={newLeftCar} 
                    />
                  </div>
                )}
                {leftSlideDirection === 'right' && newLeftCar && (
                  <div
                    className="absolute left-0 top-0 w-full animate-slideInFromLeft cursor-pointer"
                    onClick={() => handleCardClick(newLeftCar)}
                  >
                    <CarRecCard 
                      key={`new-left-${newLeftCar.model}-${newLeftCar.year}`}
                      carData={newLeftCar} 
                    />
                  </div>
                )}
              </div>

              {/* Right Card Container - Fixed position */}
              <div className="relative overflow-hidden">
                {/* Navigation Arrows for Right Card */}
                <div className="absolute top-1/2 left-2 z-10 transform -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRightCardPrev();
                    }}
                    disabled={isRightAnimating || !currentUser?.uid}
                    className="w-8 h-8 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous Right Card"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-dark" />
                  </button>
                </div>
                <div className="absolute top-1/2 right-2 z-10 transform -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRightCardNext();
                    }}
                    disabled={isRightAnimating || !currentUser?.uid}
                    className="w-8 h-8 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next Right Card"
                  >
                    <ChevronRight className="w-4 h-4 text-text-dark" />
                  </button>
                </div>

                {/* Existing Right Card */}
                <div
                  className={`transition-transform duration-300 ease-in-out ${getRightCardTransform()} cursor-pointer`}
                  onClick={() => handleCardClick(rightCar)}
                >
                  <CarRecCard 
                    key={`right-${rightCar.model}-${rightCar.year}`}
                    carData={rightCar} 
                  />
                </div>

                {/* New Card - Slides in when navigating */}
                {rightSlideDirection === 'left' && newRightCar && (
                  <div
                    className="absolute right-0 top-0 w-full animate-slideInFromRight cursor-pointer"
                    onClick={() => handleCardClick(newRightCar)}
                  >
                    <CarRecCard 
                      key={`new-right-${newRightCar.model}-${newRightCar.year}`}
                      carData={newRightCar} 
                    />
                  </div>
                )}
                {rightSlideDirection === 'right' && newRightCar && (
                  <div
                    className="absolute right-0 top-0 w-full animate-slideInFromLeft cursor-pointer"
                    onClick={() => handleCardClick(newRightCar)}
                  >
                    <CarRecCard 
                      key={`new-right-${newRightCar.model}-${newRightCar.year}`}
                      carData={newRightCar} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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