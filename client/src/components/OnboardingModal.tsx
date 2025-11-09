import { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (creditScore: number, budget: number) => void;
}

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [creditScore, setCreditScore] = useState(50);
  const [budget, setBudget] = useState(100000);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onComplete(creditScore, budget);
    onClose();
  };

  const formatBudget = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Calculate budget value from 0-100 slider to actual dollar amount
  // Assuming max budget is $200,000
  const maxBudget = 200000;
  const budgetValue = Math.round((budget / maxBudget) * 100);
  const handleBudgetChange = (value: number) => {
    setBudget(Math.round((value / 100) * maxBudget));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-container-primary rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <h1 className="text-2xl font-semibold text-text-dark mb-8">
          To find you the best auto options, please fill in the following information
        </h1>

        {/* Credit Score Slider */}
        <div className="mb-10">
          <label className="block text-text-dark font-medium mb-4">
            Credit Score
          </label>
          <div className="relative pt-8">
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${creditScore}% - 0px)` }}
            >
              <div className="bg-primary text-text-light px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap shadow-lg">
                {creditScore}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className="relative h-2 bg-container-secondary rounded-full">
                {/* Filled portion (red) */}
                <div 
                  className="absolute h-2 bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${creditScore}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creditScore}
                  onChange={(e) => setCreditScore(Number(e.target.value))}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
                />
                
                {/* Slider Thumb */}
                <div 
                  className="absolute w-5 h-5 bg-primary rounded-full border-2 border-container-primary shadow-lg transform -translate-y-1.5 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                  style={{ left: `${creditScore}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className="flex justify-between mt-3 text-sm text-text-secondary">
                <span>300</span>
                <span>850</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Slider */}
        <div className="mb-10">
          <label className="block text-text-dark font-medium mb-4">
            Budget for total price of vehicle
          </label>
          <div className="relative pt-8">
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${budgetValue}% - 0px)` }}
            >
              <div className="bg-primary text-text-light px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap shadow-lg">
                {formatBudget(budget)}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className="relative h-2 bg-container-secondary rounded-full">
                {/* Filled portion (red) */}
                <div 
                  className="absolute h-2 bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${budgetValue}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={budgetValue}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer z-10"
                />
                
                {/* Slider Thumb */}
                <div 
                  className="absolute w-5 h-5 bg-primary rounded-full border-2 border-container-primary shadow-lg transform -translate-y-1.5 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                  style={{ left: `${budgetValue}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className="flex justify-between mt-3 text-sm text-text-secondary">
                <span>$0</span>
                <span>{formatBudget(maxBudget)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-text-light py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Start using CarCents
        </button>
      </div>
    </div>
  );
};

