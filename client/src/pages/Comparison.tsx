import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CarRecCard } from '../components/CarRecCard';
import { CarRecModal } from '../components/CarRecModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { ChatBot } from '../components/ChatBot';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export const Comparison = () => {
  interface BackendCar {
    car_id: string;
    make: string;
    model: string;
    Entry_price: number;
    year: number;
    image_url?: string;
    down_payment?: number;
    down_payment_rate?: number;
  }

  interface CarCardData {
    id: string;
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
    image?: string;
  }

  interface UserProfile {
    budget?: number;
    credit_score?: number;
    display_name?: string;
  }

  const { currentUser } = useAuth();

  const [cars, setCars] = useState<CarCardData[]>([]);
  const [leftCardIndex, setLeftCardIndex] = useState<number | null>(null);
  const [rightCardIndex, setRightCardIndex] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarCardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [swipingCard, setSwipingCard] = useState<{ side: 'left' | 'right'; direction: 'left' | 'right' } | null>(null);

  const mapBackendCar = (car: BackendCar): CarCardData => {
    const entryPrice = Number(car.Entry_price ?? 0);
    const downPayment = car.down_payment != null ? Number(car.down_payment) : entryPrice * 0.1;

    return {
      id: car.car_id,
      model: car.model,
      year: Number(car.year),
      totalCost: entryPrice,
      suggestedDownPayment: Math.round(downPayment),
      image: car.image_url,
    };
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userResponse = await api.get(`/users/${currentUser.uid}`);
        const profile: UserProfile | undefined = userResponse?.user;

        if (!profile?.budget || !profile?.credit_score) {
          setUserProfile(profile || null);
          setCars([]);
          setError(null); // Don't show error, show modal instead
          setShowOnboarding(true); // Show onboarding modal
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        const carsResponse = await api.get(`/cars/${currentUser.uid}`);
        const fetchedCars: BackendCar[] = carsResponse?.cars || [];

        if (fetchedCars.length === 0) {
          setCars([]);
          setLeftCardIndex(0);
          setRightCardIndex(1);
          setError('No cars found within your budget.');
          return;
        }

        const mappedCars = fetchedCars.map(mapBackendCar);
        setCars(mappedCars);

        const initialEvenIndex = mappedCars.findIndex((_, index) => index % 2 === 0);
        const initialOddIndex = mappedCars.findIndex((_, index) => index % 2 === 1);

        setLeftCardIndex(initialEvenIndex !== -1 ? initialEvenIndex : null);
        setRightCardIndex(initialOddIndex !== -1 ? initialOddIndex : null);
      } catch (err: any) {
        const message = err?.message || 'Failed to load comparison data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [currentUser]);

  const handleAdvance = useCallback(async (side: 'left' | 'right') => {
    if (!currentUser || isAdvancing[side]) {
      return;
    }

    // Start swipe animation
    // Left card swipes left, right card swipes right
    setSwipingCard({ side, direction: side === 'left' ? 'left' : 'right' });
    setIsAdvancing((prev) => ({ ...prev, [side]: true }));
    setError(null);

    // Wait for animation to complete before fetching new card
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const response = await api.get(`/cars/${currentUser.uid}/next?side=${side}`);

      if (response?.error) {
        setError(response.message || response.error || 'Reached the end of recommendations.');
        setSwipingCard(null);
        setIsAdvancing((prev) => ({ ...prev, [side]: false }));
        return;
      }

      const backendCar: BackendCar | undefined = response?.car;
      const newIndex: number | undefined = response?.index;

      if (!backendCar || typeof newIndex !== 'number') {
        throw new Error('Invalid response from server when fetching next car.');
      }

      const mappedCar = mapBackendCar(backendCar);
      setCars((prev) => {
        const updated = [...prev];
        if (newIndex >= updated.length) {
          updated.length = newIndex + 1;
        }
        updated[newIndex] = mappedCar;
        return updated;
      });

      if (side === 'left') {
        if (newIndex % 2 !== 0) {
          console.warn(`Received odd index ${newIndex} for left card; ignoring to maintain even indices.`);
        } else {
          setLeftCardIndex(newIndex);
        }
      } else {
        if (newIndex % 2 === 0) {
          console.warn(`Received even index ${newIndex} for right card; ignoring to maintain odd indices.`);
        } else {
          setRightCardIndex(newIndex);
        }
      }

      // Clear swipe animation after card is replaced
      setSwipingCard(null);
    } catch (err: any) {
      const message = err?.message || 'Failed to advance to the next car.';
      setError(message);
      setSwipingCard(null);
    } finally {
      setIsAdvancing((prev) => ({ ...prev, [side]: false }));
    }
  }, [currentUser, isAdvancing]);

  const handleCardClick = (car: CarCardData | null) => {
    if (!car) return;
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };


  const handleOnboardingComplete = async (creditScore: number, budget: number) => {
    if (currentUser) {
      // Save to localStorage as fallback
      localStorage.setItem(`onboarding_${currentUser.uid}`, 'true');
      localStorage.setItem(`user_preferences_${currentUser.uid}`, JSON.stringify({
        creditScore,
        budget,
      }));
      
      setShowOnboarding(false);
      
      // Refresh the data to fetch cars with the new profile information
      // The useEffect will run again when currentUser changes, but we can also trigger it manually
      setLoading(true);
      try {
        const userResponse = await api.get(`/users/${currentUser.uid}`);
        const profile: UserProfile | undefined = userResponse?.user;
        setUserProfile(profile || null);

        if (profile?.budget && profile?.credit_score) {
          const carsResponse = await api.get(`/cars/${currentUser.uid}`);
          const fetchedCars: BackendCar[] = carsResponse?.cars || [];

          if (fetchedCars.length === 0) {
            setCars([]);
            setLeftCardIndex(0);
            setRightCardIndex(1);
            setError('No cars found within your budget.');
          } else {
            const mappedCars = fetchedCars.map(mapBackendCar);
            setCars(mappedCars);

            const initialEvenIndex = mappedCars.findIndex((_, index) => index % 2 === 0);
            const initialOddIndex = mappedCars.findIndex((_, index) => index % 2 === 1);

            setLeftCardIndex(initialEvenIndex !== -1 ? initialEvenIndex : null);
            setRightCardIndex(initialOddIndex !== -1 ? initialOddIndex : null);
            setError(null);
          }
        }
      } catch (err: any) {
        const message = err?.message || 'Failed to load comparison data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  const leftCar = useMemo(() => {
    if (leftCardIndex === null) return null;
    return cars[leftCardIndex] ?? null;
  }, [cars, leftCardIndex]);

  const rightCar = useMemo(() => {
    if (rightCardIndex === null) return null;
    return cars[rightCardIndex] ?? null;
  }, [cars, rightCardIndex]);

  const isReady = !loading && (leftCar !== null || rightCar !== null);

  // Keyboard event handler for arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys if not currently animating and not typing in an input
      if (isAdvancing.left || isAdvancing.right) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (showOnboarding || isChatExpanded) return; // Don't handle keys when modals are open

      if (event.key === 'ArrowLeft' && leftCar && !isAdvancing.left) {
        event.preventDefault();
        handleAdvance('left');
      } else if (event.key === 'ArrowRight' && rightCar && !isAdvancing.right) {
        event.preventDefault();
        handleAdvance('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [leftCar, rightCar, isAdvancing, showOnboarding, isChatExpanded, handleAdvance]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-4 px-4 py-4 items-start min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 w-full">
          {/* ChatBot Component - At the top */}
          <div className="mb-6">
            <ChatBot 
              isExpanded={isChatExpanded}
              onToggle={() => setIsChatExpanded(!isChatExpanded)}
            />
          </div>

          {userProfile && (
            <div className="mb-4 flex flex-wrap items-center gap-4 bg-container-primary border border-container-stroke rounded-xl px-4 py-3 shadow-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-text-secondary">Budget</div>
                <div className="text-lg font-semibold text-text-dark">
                  {userProfile.budget ? `$${Number(userProfile.budget).toLocaleString()}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-text-secondary">Credit Score</div>
                <div className="text-lg font-semibold text-text-dark">
                  {userProfile.credit_score ?? '—'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">Loading car recommendations...</div>
            </div>
          )}

          {!loading && !currentUser && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">Please sign in to view car recommendations.</div>
            </div>
          )}

          {!loading && currentUser && (!leftCar && !rightCar) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-text-secondary">
                {error ? 'Please update your profile to generate recommendations.' : 'No car recommendations available yet.'}
              </div>
            </div>
          )}
          
          {isReady && (
            <>
              {/* Two Cards Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
                {leftCar ? (
                  <div
                    key={`left-${leftCardIndex}`}
                    className={`cursor-pointer transition-all duration-300 ease-in-out ${
                      swipingCard?.side === 'left' 
                        ? 'transform -translate-x-[150%] opacity-0 scale-95' // Left card swipes left
                        : 'transform translate-x-0 opacity-100 scale-100'
                    } ${isAdvancing.left ? 'pointer-events-none' : ''}`}
                    onClick={() => handleCardClick(leftCar)}
                  >
                    <CarRecCard carData={leftCar} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-container-stroke bg-container-primary text-text-secondary text-sm">
                    Generate recommendations to see a primary car.
                  </div>
                )}
                {rightCar ? (
                  <div
                    key={`right-${rightCardIndex}`}
                    className={`cursor-pointer transition-all duration-300 ease-in-out ${
                      swipingCard?.side === 'right' 
                        ? 'transform translate-x-[150%] opacity-0 scale-95' // Right card swipes right
                        : 'transform translate-x-0 opacity-100 scale-100'
                    } ${isAdvancing.right ? 'pointer-events-none' : ''}`}
                    onClick={() => handleCardClick(rightCar)}
                  >
                    <CarRecCard carData={rightCar} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-container-stroke bg-container-primary text-text-secondary text-sm">
                    Generate more recommendations to see a comparison car.
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              <div className="flex justify-center gap-4 pb-2">
                <button
                  onClick={() => handleAdvance('left')}
                  disabled={isAdvancing.left || !leftCar}
                  className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next left recommendation"
                >
                  <ChevronLeft className="w-5 h-5 text-text-dark" />
                </button>
                <button
                  onClick={() => handleAdvance('right')}
                  disabled={isAdvancing.right || !rightCar}
                  className="w-10 h-10 rounded-full bg-container-primary border border-container-stroke flex items-center justify-center hover:bg-container-secondary transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next right recommendation"
                >
                  <ChevronRight className="w-5 h-5 text-text-dark" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* Car Recommendation Modal */}
      <CarRecModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carData={selectedCar || undefined}
      />
      
      {/* Onboarding Modal - Required if user doesn't have budget/credit score */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          // Only allow closing if user has completed profile (has budget and credit_score)
          if (userProfile?.budget && userProfile?.credit_score) {
            setShowOnboarding(false);
          }
          // Otherwise, don't allow closing - user must complete onboarding
        }}
        onComplete={handleOnboardingComplete}
        required={!userProfile?.budget || !userProfile?.credit_score}
      />
    </div>
  )
}