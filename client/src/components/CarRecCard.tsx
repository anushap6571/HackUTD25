import { useState, useEffect, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

interface CarData {
  image?: string;
  model: string;
  year: number;
  totalCost: number;
  suggestedDownPayment: number;
}

interface CarRecCardProps {
  carData?: CarData;
}

interface UserMetrics {
  creditScore?: number;
  budget?: number;
}

interface PredictionState {
  apr?: number;
  defaultRiskPercent?: number;
  monthlyPayment?: number;
  recommendation?: string;
}

const userProfileCache: Record<string, UserMetrics> = {};

// Helper function to get car ID
const getCarId = (car: { model: string; year: number; totalCost: number }) => {
  return `${car.year}-${car.model}-${car.totalCost}`;
};

export const CarRecCard = ({ carData }: CarRecCardProps) => {
  const { currentUser } = useAuth();
  
  // Default car data if not provided
  const defaultCarData: CarData = {
    image: '/car-placeholder.jpg', // You can replace this with actual car image
    model: 'Toyota Corolla',
    year: 2026,
    totalCost: 10998,
    suggestedDownPayment: 4998,
  };

  const car: CarData = carData || defaultCarData;
  const carPrice = useMemo(() => Number.isFinite(car.totalCost) ? Number(car.totalCost) : 0, [car.totalCost]);
  const [loanTerm, setLoanTerm] = useState(50); // Value from 0-100, representing 10-60 months
  const [downPayment, setDownPayment] = useState(50); // Value from 0-100, representing dynamic down payment range
  const [isSaved, setIsSaved] = useState(false);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Helper function to get saved vehicles from localStorage
  const getSavedVehicles = (uid: string): CarData[] => {
    try {
      const saved = localStorage.getItem(`saved_vehicles_${uid}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? (parsed as CarData[]) : [];
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

  // Sync down payment slider with suggested down payment when car changes
  useEffect(() => {
    if (!car) return;
    const carPrice = Number.isFinite(car.totalCost) ? Number(car.totalCost) : 0;
    const minDownPayment = Math.min(1000, carPrice * 0.1); // 10% of car price or $1000, whichever is lower
    const maxDownPayment = Math.max(carPrice * 0.9, 1000); // 90% of car price or $1000, whichever is higher
    const suggested = car.suggestedDownPayment ?? Math.max(minDownPayment, carPrice * 0.1);
    const clampedSuggested = Math.min(Math.max(suggested, minDownPayment), maxDownPayment);
    const range = maxDownPayment - minDownPayment;
    const normalized = range > 0 ? (clampedSuggested - minDownPayment) / range : 0.5;
    setDownPayment(Math.round(normalized * 100));
  }, [car?.model, car?.year, car?.totalCost, car?.suggestedDownPayment]);

  // Fetch user metrics (credit score) once per user
  useEffect(() => {
    if (!currentUser) {
      setUserMetrics(null);
      return;
    }

    const cachedMetrics = userProfileCache[currentUser.uid];
    if (cachedMetrics) {
      setUserMetrics(cachedMetrics);
      return;
    }

    let cancelled = false;

    const fetchUserMetrics = async () => {
      try {
        const response = await api.get(`/users/${currentUser.uid}`);
        const userData = response?.user;

        const creditScoreRaw = userData?.credit_score;
        const budgetRaw = userData?.budget;

        const normalizedMetrics: UserMetrics = {
          creditScore: creditScoreRaw != null && !Number.isNaN(Number(creditScoreRaw))
            ? Number(creditScoreRaw)
            : undefined,
          budget: budgetRaw != null && !Number.isNaN(Number(budgetRaw)) ? Number(budgetRaw) : undefined,
        };

        if (!cancelled) {
          userProfileCache[currentUser.uid] = normalizedMetrics;
          setUserMetrics(normalizedMetrics);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch user profile for car recommendation card:', error);
          setUserMetrics({});
        }
      }
    };

    fetchUserMetrics();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

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
  const loanTermMonths = useMemo(() => Math.round(10 + (loanTerm / 100) * 50), [loanTerm]);
  
  // Convert slider value (0-100) to down payment (dynamic based on car price)
  const downPaymentAmount = useMemo(() => {
    const minDownPayment = Math.min(1000, carPrice * 0.1); // 10% of car price or $1000, whichever is lower
    const maxDownPayment = Math.max(carPrice * 0.9, 1000); // 90% of car price or $1000, whichever is higher
    const range = maxDownPayment - minDownPayment;
    return Math.round(minDownPayment + (downPayment / 100) * range);
  }, [downPayment, carPrice]);
  const downPaymentRate = useMemo(() => {
    if (!carPrice || carPrice <= 0) return 0;
    const rate = downPaymentAmount / carPrice;
    if (!Number.isFinite(rate)) return 0;
    return Math.min(Math.max(rate, 0), 1);
  }, [downPaymentAmount, carPrice]);
  const vehicleAge = useMemo(() => {
    if (!car.year) return 0;
    const currentYear = 2025;
    return Math.max(0, currentYear - car.year);
  }, [car.year]);

  const sanitizedCreditScore = userMetrics?.creditScore != null && Number.isFinite(userMetrics.creditScore)
    ? Number(userMetrics.creditScore)
    : undefined;

  const predictionUnavailableMessage = useMemo(() => {
    if (!currentUser) {
      return 'Sign in to see personalized financing predictions.';
    }
    if (currentUser && sanitizedCreditScore == null) {
      return 'Add your credit score to your profile to see personalized financing predictions.';
    }
    return null;
  }, [currentUser, sanitizedCreditScore]);

  // Fetch predictions from backend when inputs change
  useEffect(() => {
    if (
      !currentUser ||
      sanitizedCreditScore == null ||
      !carPrice ||
      carPrice <= 0 ||
      loanTermMonths <= 0
    ) {
      setPrediction(null);
      setPredictionLoading(false);
       setPredictionError(null);
      return;
    }

    let cancelled = false;
    setPredictionLoading(true);
    setPredictionError(null);


    const timeoutId = setTimeout(async () => {
      try {
        const payload = {
          credit_score: sanitizedCreditScore,
          loan_term: loanTermMonths,
          car_price: carPrice,
          vehicle_age: vehicleAge,
          down_payment_rate: downPaymentRate,
        };
        console.log(payload);

        const result = await api.post('/predict', payload);
        console.log(result);
        if (cancelled) return;

        const aprRaw = result?.predicted_apr;
        const defaultRiskRaw = result?.default_risk_probability/10;
        console.log(defaultRiskRaw);
        const monthlyPaymentRaw = result?.monthly_payment;
        const recommendationRaw = result?.recommendation;

        const normalizedPrediction: PredictionState = {
          apr: aprRaw != null && !Number.isNaN(Number(aprRaw)) ? Number(aprRaw) : undefined,
          defaultRiskPercent:
            defaultRiskRaw != null && !Number.isNaN(Number(defaultRiskRaw))
              ? Math.round(Number(defaultRiskRaw) * 100)
              : undefined,
          monthlyPayment:
            monthlyPaymentRaw != null && !Number.isNaN(Number(monthlyPaymentRaw))
              ? Number(monthlyPaymentRaw)
              : undefined,
          recommendation: typeof recommendationRaw === 'string' ? recommendationRaw : undefined,
        };

        setPrediction(normalizedPrediction);
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to fetch car financing prediction:', error);
          setPrediction(null);
          setPredictionError(error?.message || 'Failed to fetch financing prediction.');
        }
      } finally {
        if (!cancelled) {
          setPredictionLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentUser, sanitizedCreditScore, carPrice, loanTermMonths, downPaymentRate, vehicleAge]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const aprDisplay = predictionLoading
    ? '...'
    : prediction?.apr != null
      ? `${prediction.apr.toFixed(2)}%`
      : '--';

  const defaultRiskDisplay = predictionLoading
    ? '...'
    : prediction?.defaultRiskPercent != null
      ? `${prediction.defaultRiskPercent}%`
      : '--';

  const monthlyPaymentDisplay = predictionLoading
    ? '...'
    : prediction?.monthlyPayment != null
      ? formatCurrency(Math.round(prediction.monthlyPayment))
      : '--';

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
              <span>{formatCurrency(Math.min(1000, carPrice * 0.1))}</span>
              <span>{formatCurrency(Math.max(carPrice * 0.9, 1000))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-container-stroke mt-auto">
        {/* Predicted APR */}
        <div className="text-center">
          <div className="text-lg font-semibold text-text-dark mb-0.5">
            {aprDisplay}
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
            {defaultRiskDisplay}
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
            {monthlyPaymentDisplay}
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

      {(prediction?.recommendation && !predictionLoading) && (
        <div className="mt-3 text-xs text-text-secondary text-center">   
          Recommendation: {prediction.defaultRiskPercent != null && !Number.isNaN(Number(prediction.defaultRiskPercent))
            ? prediction.defaultRiskPercent >= 0.8
              ? 'Increase down payment'
              : 'Good Standing'
            : undefined}
        </div>
      )}

      {predictionUnavailableMessage && (
        <div className="mt-3 text-xs text-text-secondary text-center">
          {predictionUnavailableMessage}
        </div>
      )}

      {predictionError && !predictionLoading && (
        <div className="mt-3 text-xs text-red-600 text-center">
          {predictionError}
        </div>
      )}
    </div>
  );
};
