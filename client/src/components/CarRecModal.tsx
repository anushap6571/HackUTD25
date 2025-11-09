import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

interface CarRecModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    image?: string;
    model: string;
    year: number;
    totalCost: number;
    suggestedDownPayment: number;
  };
  fullScreen?: boolean;
}

interface CarData {
  image?: string;
  model: string;
  year: number;
  totalCost: number;
  suggestedDownPayment: number;
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

export const CarRecModal = ({ isOpen, onClose, carData, fullScreen = false }: CarRecModalProps) => {
  // Default car data if not provided
  const defaultCarData: CarData = {
    image: '/car-placeholder.jpg', // You can replace this with actual car image
    model: 'Toyota Corolla',
    year: 2026,
    totalCost: 10998,
    suggestedDownPayment: 4998,
  };

  const { currentUser } = useAuth();
  const car: CarData = carData || defaultCarData;
  const [loanTerm, setLoanTerm] = useState(50); // Value from 0-100, representing 10-60 months
  const [downPayment, setDownPayment] = useState(50); // Value from 0-100, representing $1000-$10,998
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    if (!car || !isOpen) return;
    const carPrice = Number.isFinite(car.totalCost) ? Number(car.totalCost) : 0;
    const minDownPayment = Math.min(1000, carPrice * 0.1); // 10% of car price or $1000, whichever is lower
    const maxDownPayment = Math.max(carPrice * 0.9, 1000); // 90% of car price or $1000, whichever is higher
    const suggested = car.suggestedDownPayment ?? Math.max(minDownPayment, carPrice * 0.1);
    const clampedSuggested = Math.min(Math.max(suggested, minDownPayment), maxDownPayment);
    const range = maxDownPayment - minDownPayment;
    const normalized = range > 0 ? (clampedSuggested - minDownPayment) / range : 0.5;
    setDownPayment(Math.round(normalized * 100));
  }, [car?.model, car?.year, car?.totalCost, car?.suggestedDownPayment, isOpen]);

  useEffect(() => {
    if (!currentUser || !isOpen) {
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
          console.error('Failed to fetch user profile for car recommendation modal:', error);
          setUserMetrics({});
        }
      }
    };

    fetchUserMetrics();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isOpen]);

  // Convert slider value (0-100) to loan term (10-60 months)
  const loanTermMonths = useMemo(() => Math.round(10 + (loanTerm / 100) * 50), [loanTerm]);
  
  const carPrice = useMemo(() => Number.isFinite(car.totalCost) ? Number(car.totalCost) : 0, [car.totalCost]);
  
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

  useEffect(() => {
    if (
      !isOpen ||
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

        const result = await api.post('/predict', payload);
        if (cancelled) return;

        const aprRaw = result?.predicted_apr;
        const defaultRiskRaw = 1 - result?.default_risk_probability;
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
          console.error('Failed to fetch car financing prediction (modal):', error);
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
  }, [isOpen, currentUser, sanitizedCreditScore, carPrice, loanTermMonths, downPaymentRate, vehicleAge]);

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
      ? `$${Number(prediction.monthlyPayment).toLocaleString()}`
      : '--';

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (!isOpen) return null;

  // Tooltip component for terms
  const TermTooltip = ({ term, definition, children }: { term: string; definition: string; children: ReactNode }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-container-primary shadow-2xl overflow-y-auto ${
        fullScreen 
          ? 'w-full h-full rounded-none p-8' 
          : 'rounded-xl p-6 max-w-xl w-full mx-4 max-h-[90vh]'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-container-primary hover:bg-container-secondary rounded-full flex items-center justify-center shadow-md transition"
          aria-label="Close modal"
        >
          <span className="text-2xl text-text-dark">×</span>
        </button>

        {/* Car Image */}
        <div className={`flex justify-center mb-4 ${fullScreen ? 'mt-8' : ''}`}>
          {car.image ? (
            <img 
              src={car.image} 
              alt={car.model}
              className={`rounded-lg object-cover ${
                fullScreen 
                  ? 'w-full max-w-2xl h-auto' 
                  : 'w-full max-w-xs h-auto'
              }`}
            />
          ) : (
            <div className={`bg-container-secondary rounded-lg flex items-center justify-center ${
              fullScreen 
                ? 'w-full max-w-2xl h-64' 
                : 'w-full max-w-xs h-32'
            }`}>
              <span className="text-text-secondary text-xs">Car Image</span>
            </div>
          )}
        </div>

        {/* Car Model */}
        <h2 className={`font-semibold text-text-dark text-center mb-3 ${fullScreen ? 'text-3xl mb-6' : ''}`}>
          {car.year} {car.model}
        </h2>

        {/* Total Cost */}
        <div className={`text-center mb-4 ${fullScreen ? 'mb-6' : ''}`}>
          <div className={`font-bold text-text-dark mb-1 ${fullScreen ? 'text-3xl' : 'text-xl'}`}>
            {formatCurrency(car.totalCost)}
          </div>
          <div className={`text-text-secondary ${fullScreen ? 'text-base' : 'text-sm'}`}>Total Cost</div>
        </div>

        {/* Suggested Down Payment */}
        <div className={`text-center mb-6 ${fullScreen ? 'mb-8' : ''}`}>
          <div className={`font-semibold text-text-dark mb-1 ${fullScreen ? 'text-2xl' : 'text-xl'}`}>
            {formatCurrency(car.suggestedDownPayment)}
          </div>
          <div className={`text-text-secondary ${fullScreen ? 'text-base' : 'text-sm'}`}>
            <TermTooltip 
              term="Down Payment" 
              definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
            >
              Down Payment
            </TermTooltip>
          </div>
        </div>

        {/* Loan Term Slider */}
        <div className={`mb-6 ${fullScreen ? 'mb-8' : ''}`}>
          <label className={`block text-text-dark font-medium mb-3 ${fullScreen ? 'text-lg mb-4' : 'text-sm'}`}>
            <TermTooltip 
              term="Loan Term" 
              definition="The length of time over which the loan will be repaid, typically measured in months. Longer terms result in lower monthly payments but higher total interest."
            >
              Loan Term
            </TermTooltip>
          </label>
          <div className={`relative ${fullScreen ? 'pt-10' : 'pt-8'}`}>
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${loanTerm}% - 0px)` }}
            >
              <div className={`bg-primary text-text-light px-3 py-1.5 rounded font-medium whitespace-nowrap shadow-lg ${fullScreen ? 'text-base' : 'text-sm'}`}>
                {loanTermMonths} months
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className={`relative bg-container-secondary rounded-full ${fullScreen ? 'h-3' : 'h-2'}`}>
                {/* Filled portion (red) */}
                <div 
                  className={`absolute bg-primary rounded-full transition-all duration-150 ${fullScreen ? 'h-3' : 'h-2'}`}
                  style={{ width: `${loanTerm}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className={`absolute inset-0 w-full opacity-0 cursor-pointer z-10 ${fullScreen ? 'h-3' : 'h-2'}`}
                />
                
                {/* Slider Thumb */}
                <div 
                  className={`absolute bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-x-1/2 top-1/2 transition-all duration-150 z-20 ${fullScreen ? 'w-6 h-6 -translate-y-3' : 'w-5 h-5 -translate-y-1.5'}`}
                  style={{ left: `${loanTerm}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className={`flex justify-between mt-3 text-text-secondary ${fullScreen ? 'text-base mt-4' : 'text-sm'}`}>
                <span>10 months</span>
                <span>60 months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Down Payment Slider */}
        <div className={`mb-6 ${fullScreen ? 'mb-8' : ''}`}>
          <label className={`block text-text-dark font-medium mb-3 ${fullScreen ? 'text-lg mb-4' : 'text-sm'}`}>
            <TermTooltip 
              term="Down Payment" 
              definition="The initial payment made when purchasing a vehicle, paid upfront. A larger down payment reduces the loan amount and can result in better interest rates."
            >
              Down Payment
            </TermTooltip>
          </label>
          <div className={`relative ${fullScreen ? 'pt-10' : 'pt-8'}`}>
            {/* Value Display Bubble */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(${downPayment}% - 0px)` }}
            >
              <div className={`bg-primary text-text-light px-3 py-1.5 rounded font-medium whitespace-nowrap shadow-lg ${fullScreen ? 'text-base' : 'text-sm'}`}>
                {formatCurrency(downPaymentAmount)}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="relative">
              {/* Slider Track Background */}
              <div className={`relative bg-container-secondary rounded-full ${fullScreen ? 'h-3' : 'h-2'}`}>
                {/* Filled portion (red) */}
                <div 
                  className={`absolute bg-primary rounded-full transition-all duration-150 ${fullScreen ? 'h-3' : 'h-2'}`}
                  style={{ width: `${downPayment}%` }}
                />
                
                {/* Slider Input (invisible, for interaction) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className={`absolute inset-0 w-full opacity-0 cursor-pointer z-10 ${fullScreen ? 'h-3' : 'h-2'}`}
                />
                
                {/* Slider Thumb */}
                <div 
                  className={`absolute bg-container-primary rounded-full border-2 border-primary shadow-lg transform -translate-x-1/2 top-1/2 transition-all duration-150 z-20 ${fullScreen ? 'w-6 h-6 -translate-y-3' : 'w-5 h-5 -translate-y-1.5'}`}
                  style={{ left: `${downPayment}%` }}
                />
              </div>
              
              {/* Min/Max Labels */}
              <div className={`flex justify-between mt-3 text-text-secondary ${fullScreen ? 'text-base mt-4' : 'text-sm'}`}>
                <span>{formatCurrency(Math.min(1000, carPrice * 0.1))}</span>
                <span>{formatCurrency(Math.max(carPrice * 0.9, 1000))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className={`grid grid-cols-3 gap-4 pt-4 border-t border-container-stroke ${fullScreen ? 'pt-6 gap-6' : ''}`}>
          {/* Predicted APR */}
          <div className="text-center">
            <div className={`font-semibold text-text-dark mb-1 ${fullScreen ? 'text-2xl mb-2' : 'text-lg'}`}>
              {aprDisplay}
            </div>
            <div className={`text-text-secondary ${fullScreen ? 'text-sm' : 'text-xs'}`}>
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
            <div className={`font-semibold text-text-dark mb-1 ${fullScreen ? 'text-2xl mb-2' : 'text-lg'}`}>
              {defaultRiskDisplay}
            </div>
            <div className={`text-text-secondary ${fullScreen ? 'text-sm' : 'text-xs'}`}>
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
            <div className={`font-semibold text-text-dark mb-1 ${fullScreen ? 'text-2xl mb-2' : 'text-lg'}`}>
              {monthlyPaymentDisplay}
            </div>
            <div className={`text-text-secondary ${fullScreen ? 'text-sm' : 'text-xs'}`}>
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
          <div className={`mt-4 text-text-secondary text-center ${fullScreen ? 'text-sm mt-6' : 'text-xs'}`}>
            Recommendation: {prediction.recommendation}
          </div>
        )}

        {predictionUnavailableMessage && (
          <div className={`mt-4 text-text-secondary text-center ${fullScreen ? 'text-sm mt-6' : 'text-xs'}`}>
            {predictionUnavailableMessage}
          </div>
        )}

        {predictionError && !predictionLoading && (
          <div className={`mt-4 text-red-600 text-center ${fullScreen ? 'text-sm mt-6' : 'text-xs'}`}>
            {predictionError}
          </div>
        )}
      </div>
    </div>
  );
};

