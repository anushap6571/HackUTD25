import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CarRecCardProps {
  carData?: {
    image?: string;
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
  };
}

// Helper function to get car ID
const getCarId = (car: { model: string; year: number; totalCost: number }) => {
  return `${car.year}-${car.model}-${car.totalCost}`;
};

export const CarRecCard = ({ carData }: CarRecCardProps) => {
  const { currentUser } = useAuth();
  
  // Default car data if not provided
  const defaultCarData = {
    image: '/car-placeholder.jpg', // You can replace this with actual car image
    model: 'Toyota Corolla',
    year: 2026,
    totalCost: 10998,
    suggestedDownPayment: 4998,
  };

  const car = carData || defaultCarData;
  const [loanTerm, setLoanTerm] = useState(50); // Value from 0-100, representing 10-60 months
  const [downPayment, setDownPayment] = useState(50); // Value from 0-100, representing $1000-$10,998
  const [isSaved, setIsSaved] = useState(false);

  // Helper function to get saved vehicles from localStorage
  const getSavedVehicles = (uid: string) => {
    try {
      const saved = localStorage.getItem(`saved_vehicles_${uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Check if car is saved on mount
  useEffect(() => {
    if (currentUser && car) {
      const savedVehicles = getSavedVehicles(currentUser.uid);
      const carId = getCarId(car);
      setIsSaved(savedVehicles.some(saved => getCarId(saved) === carId));
    }
  }, [currentUser, car]);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    
    if (!currentUser) return;
    
    const savedVehicles = getSavedVehicles(currentUser.uid);
    const carId = getCarId(car);
    const carIndex = savedVehicles.findIndex(saved => getCarId(saved) === carId);
    
    if (carIndex >= 0) {
      // Remove from saved
      savedVehicles.splice(carIndex, 1);
      setIsSaved(false);
    } else {
      // Add to saved
      savedVehicles.push(car);
      setIsSaved(true);
    }
    
    localStorage.setItem(`saved_vehicles_${currentUser.uid}`, JSON.stringify(savedVehicles));
    
    // Dispatch custom event to update Profile page
    window.dispatchEvent(new Event('savedVehiclesUpdated'));
  };

  // Convert slider value (0-100) to loan term (10-60 months)
  const loanTermMonths = Math.round(10 + (loanTerm / 100) * 50);
  
  // Convert slider value (0-100) to down payment ($1000-$10,998)
  const downPaymentAmount = Math.round(1000 + (downPayment / 100) * 9998);
  
  // Calculate monthly payment (simplified calculation)
  const principal = car.totalCost - downPaymentAmount;
  const monthlyRate = 0.005; // 6% APR / 12 months (simplified)
  const numPayments = loanTermMonths;
  const monthlyPayment = principal > 0 && numPayments > 0
    ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1))
    : 0;

  // Calculate default risk (placeholder calculation)
  const defaultRisk = Math.round((downPaymentAmount / car.totalCost) * 100);

  // Calculate Predicted APR based on down payment percentage and loan term
  // Higher down payment and shorter term = lower APR
  const downPaymentPercentage = (downPaymentAmount / car.totalCost) * 100;
  // Base APR calculation: lower with higher down payment and shorter term
  const baseAPR = 8.0; // Base 8% APR
  const downPaymentDiscount = Math.max(0, (downPaymentPercentage - 20) * 0.1); // Up to 2% discount for high down payment
  const termDiscount = Math.max(0, (60 - loanTermMonths) * 0.02); // Up to 1% discount for shorter term
  const predictedAPR = Math.max(3.0, Math.min(15.0, baseAPR - downPaymentDiscount - termDiscount));
  const predictedAPRFormatted = predictedAPR.toFixed(1);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Tooltip component for terms
  const TermTooltip = ({ term, definition, children }: { term: string; definition: string; children: React.ReactNode }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <span 
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="underline decoration-primary decoration-2 cursor-help">{children}</span>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-text-dark text-text-light text-xs rounded-lg p-2 shadow-lg z-50 pointer-events-none">
            <div className="font-semibold mb-1">{term}</div>
            <div>{definition}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-text-dark"></div>
            </div>
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="bg-container-primary rounded-xl p-4 shadow-lg h-full flex flex-col relative">
      {/* Heart Icon */}
      {currentUser && (
        <button
          onClick={toggleSave}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-container-primary shadow-md hover:bg-container-secondary transition"
          aria-label={isSaved ? 'Remove from saved' : 'Save vehicle'}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isSaved ? 'fill-primary text-primary' : 'text-icon-dark'
            }`}
          />
        </button>
      )}
      
      {/* Car Image */}
      <div className="flex justify-center mb-2">
        {car.image ? (
          <img 
            src={car.image} 
            alt={car.model}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-container-secondary rounded-lg flex items-center justify-center">
            <span className="text-text-secondary text-xs">Car Image</span>
          </div>
        )}
      </div>

      {/* Car Model */}
      <h2 className="text-lg font-semibold text-text-dark text-center mb-2">
        {car.year} {car.model}
      </h2>

      {/* Total Cost */}
      <div className="text-center mb-2">
        <div className="text-2xl font-bold text-text-dark mb-0.5">
          {formatCurrency(car.totalCost)}
        </div>
        <div className="text-xs text-text-secondary">Total Cost</div>
      </div>

      {/* Suggested Down Payment */}
      <div className="text-center mb-3">
        <div className="text-lg font-semibold text-text-dark mb-0.5">
          {formatCurrency(car.suggestedDownPayment)}
        </div>
        <div className="text-xs text-text-secondary">
          Suggested <TermTooltip 
            term="Down Payment" 
            definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
          >
            Down Payment
          </TermTooltip>
        </div>
      </div>

      {/* Loan Term Slider */}
      <div className="mb-3">
        <label className="block text-text-dark font-medium text-sm mb-2">
          <TermTooltip 
            term="Loan Term" 
            definition="The length of time over which the loan will be repaid, typically measured in months. Longer terms result in lower monthly payments but higher total interest."
          >
            Loan Term
          </TermTooltip>
        </label>
        <div className="relative pt-6">
          {/* Value Display Bubble */}
          <div 
            className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
            style={{ left: `calc(${loanTerm}% - 0px)` }}
          >
            <div className="bg-primary text-text-light px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
              {loanTermMonths} months
            </div>
          </div>
          
          {/* Slider Container */}
          <div className="relative">
            {/* Slider Track Background */}
            <div className="relative h-1.5 bg-container-secondary rounded-full">
              {/* Filled portion (red) */}
              <div 
                className="absolute h-1.5 bg-primary rounded-full transition-all duration-150"
                style={{ width: `${loanTerm}%` }}
              />
              
              {/* Slider Input (invisible, for interaction) */}
              <input
                type="range"
                min="0"
                max="100"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
              />
              
              {/* Slider Thumb */}
              <div 
                className="absolute w-4 h-4 bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-y-1 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                style={{ left: `${loanTerm}%` }}
              />
            </div>
            
            {/* Min/Max Labels */}
            <div className="flex justify-between mt-1.5 text-xs text-text-secondary">
              <span>10 months</span>
              <span>60 months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Down Payment Slider */}
      <div className="mb-3">
        <label className="block text-text-dark font-medium text-sm mb-2">
          <TermTooltip 
            term="Down Payment" 
            definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
          >
            Down Payment
          </TermTooltip>
        </label>
        <div className="relative pt-6">
          {/* Value Display Bubble */}
          <div 
            className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
            style={{ left: `calc(${downPayment}% - 0px)` }}
          >
            <div className="bg-primary text-text-light px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
              {formatCurrency(downPaymentAmount)}
            </div>
          </div>
          
          {/* Slider Container */}
          <div className="relative">
            {/* Slider Track Background */}
            <div className="relative h-1.5 bg-container-secondary rounded-full">
              {/* Filled portion (red) */}
              <div 
                className="absolute h-1.5 bg-primary rounded-full transition-all duration-150"
                style={{ width: `${downPayment}%` }}
              />
              
              {/* Slider Input (invisible, for interaction) */}
              <input
                type="range"
                min="0"
                max="100"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
              />
              
              {/* Slider Thumb */}
              <div 
                className="absolute w-4 h-4 bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-y-1 -translate-x-1/2 top-1/2 transition-all duration-150 z-20"
                style={{ left: `${downPayment}%` }}
              />
            </div>
            
            {/* Min/Max Labels */}
            <div className="flex justify-between mt-1.5 text-xs text-text-secondary">
              <span>{formatCurrency(1000)}</span>
              <span>{formatCurrency(10998)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-container-stroke mt-auto">
        {/* Predicted APR */}
        <div className="text-center">
          <div className="text-lg font-semibold text-text-dark mb-0.5">
            {predictedAPRFormatted}%
          </div>
          <div className="text-xs text-text-secondary">
            <TermTooltip 
              term="Predicted APR" 
              definition="Annual Percentage Rate - the yearly cost of borrowing money, expressed as a percentage. Includes interest and fees. Lower APR means lower overall loan cost."
            >
              Predicted APR
            </TermTooltip>
          </div>
        </div>

        {/* Default Risk */}
        <div className="text-center">
          <div className="text-lg font-semibold text-text-dark mb-0.5">
            {defaultRisk}%
          </div>
          <div className="text-xs text-text-secondary">
            <TermTooltip 
              term="Default Risk" 
              definition="The likelihood that a borrower will fail to make required loan payments. Calculated based on down payment percentage and other factors."
            >
              Default Risk
            </TermTooltip>
          </div>
        </div>

        {/* Monthly Payment */}
        <div className="text-center">
          <div className="text-lg font-semibold text-text-dark mb-0.5">
            {formatCurrency(monthlyPayment)}
          </div>
          <div className="text-xs text-text-secondary">
            <TermTooltip 
              term="Monthly Payment" 
              definition="The fixed amount paid each month toward the loan, including both principal (the loan amount) and interest (the cost of borrowing)."
            >
              Monthly Payment
            </TermTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

