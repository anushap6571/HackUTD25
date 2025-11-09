import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { OnboardingModal } from '../components/OnboardingModal';

export const Home = () => {
  const { currentUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${currentUser.uid}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [currentUser]);

  const handleOnboardingComplete = (creditScore: number, budget: number) => {
    if (currentUser) {
      // Mark onboarding as complete
      localStorage.setItem(`onboarding_${currentUser.uid}`, 'true');
      
      // Store the user preferences
      localStorage.setItem(`user_preferences_${currentUser.uid}`, JSON.stringify({
        creditScore,
        budget,
      }));
      
      setShowOnboarding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <div className="flex-1 flex gap-6 px-6 py-8 items-stretch min-h-0">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-auto">
          <h1 className="mb-4">Home</h1>
          <p className="text-lg text-text-secondary mb-6">
            Welcome, {currentUser?.email}!
          </p>
          <div className="bg-container-primary rounded-lg border border-container-stroke p-6">
            <h2 className="mb-4">Dashboard</h2>
            <p className="text-text-secondary">
              This is your home page. Navigate to Analytics or Profile using the sidebar.
            </p>
          </div>
        </main>
      </div>
      
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};
