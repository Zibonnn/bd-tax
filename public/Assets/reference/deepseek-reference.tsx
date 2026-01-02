import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  TrendingUp,
  HelpCircle,
  Info,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  PieChart,
  Wallet,
  ShieldCheck,
  Receipt,
  FileText,
  Percent,
  Target,
  Banknote,
  Building,
  Stethoscope,
  Car,
  PiggyBank,
  Sparkles
} from 'lucide-react';

const TaxCalculator = () => {
  // --- State ---
  const [grossIncome, setGrossIncome] = useState(75000);
  const [inputMode, setInputMode] = useState('monthly');
  const [investment, setInvestment] = useState(0);
  const [showRebate, setShowRebate] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [basicSalaryPercent, setBasicSalaryPercent] = useState(60);
  const [activeStep, setActiveStep] = useState(1); // For progressive guidance

  // --- Configuration (FY 2024-2025) ---
  const TAX_CONFIG = {
    fiscalYear: "2024-2025",
    currency: "BDT",
    brackets: [
      { upperLimit: 350000, rate: 0, description: "Tax-free" },
      { upperLimit: 450000, rate: 5, description: "5% slab" },
      { upperLimit: 850000, rate: 10, description: "10% slab" },
      { upperLimit: 1350000, rate: 15, description: "15% slab" },
      { upperLimit: 1850000, rate: 20, description: "20% slab" },
      { upperLimit: 3850000, rate: 25, description: "25% slab" },
      { upperLimit: null, rate: 30, description: "30% slab" },
    ],
    exemptions: {
      houseRent: { limit: 300000, percentOfBasic: 0.50 },
      medical: { limit: 120000, percentOfBasic: 0.10 },
      conveyance: { limit: 30000 }
    }
  };

  // --- Handlers ---
  const handleModeChange = (mode) => {
    if (mode === inputMode) return;
    setInputMode(mode);
    
    if (mode === 'yearly') {
      setGrossIncome(grossIncome * 12);
      setInvestment(investment * 12);
    } else {
      setGrossIncome(Math.round(grossIncome / 12));
      setInvestment(Math.round(investment / 12));
    }
  };

  // --- Calculations ---
  const calculation = useMemo(() => {
    const annualGross = inputMode === 'monthly' ? grossIncome * 12 : grossIncome;
    const annualInvestment = inputMode === 'monthly' ? investment * 12 : investment;
    
    const basicRatio = basicSalaryPercent / 100;
    const basicSalary = annualGross * basicRatio;
    
    const estHouseRent = annualGross * 0.25;
    const estMedical = annualGross * 0.10;
    const estConveyance = annualGross * 0.05;

    const exemptHR = Math.min(estHouseRent, basicSalary * 0.50, TAX_CONFIG.exemptions.houseRent.limit);
    const exemptMed = Math.min(estMedical, basicSalary * 0.10, TAX_CONFIG.exemptions.medical.limit);
    const exemptConv = Math.min(estConveyance, TAX_CONFIG.exemptions.conveyance.limit);
    
    const totalExemptions = exemptHR + exemptMed + exemptConv;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    let prevLimit = 0;
    let grossTax = 0;
    const detailedBreakdown = [];

    for (let bracket of TAX_CONFIG.brackets) {
      const limit = bracket.upperLimit === null ? Infinity : bracket.upperLimit;
      const slabSize = limit - prevLimit;
      
      const amountInSlab = Math.min(Math.max(0, taxableIncome - prevLimit), slabSize);
      const taxInSlab = amountInSlab * (bracket.rate / 100);
      
      if (amountInSlab > 0 || bracket.rate === 0) { 
        detailedBreakdown.push({
          rate: bracket.rate,
          description: bracket.description,
          amount: amountInSlab,
          tax: taxInSlab
        });
      }
      
      grossTax += taxInSlab;
      prevLimit = limit;
      
      if (taxableIncome < prevLimit) break; 
    }

    const maxAllowableInvestment = taxableIncome * 0.03; 
    const eligibleInvestment = Math.min(annualInvestment, maxAllowableInvestment);
    const taxRebate = showRebate ? eligibleInvestment * 0.15 : 0;

    const finalAnnualTax = Math.max(0, grossTax - taxRebate);
    const finalAnnualNet = annualGross - finalAnnualTax;

    const divisor = inputMode === 'monthly' ? 12 : 1;

    return {
      annualGross,
      finalAnnualTax,
      finalAnnualNet,
      effectiveRate: annualGross > 0 ? (finalAnnualTax / annualGross) * 100 : 0,

      display: {
        gross: annualGross / divisor,
        exemptions: totalExemptions / divisor,
        taxable: taxableIncome / divisor,
        basic: basicSalary / divisor,
        
        exemptionDetails: {
          hr: exemptHR / divisor,
          med: exemptMed / divisor,
          conv: exemptConv / divisor
        },

        grossTax: grossTax / divisor,
        rebate: taxRebate / divisor,
        maxInvestment: maxAllowableInvestment / divisor,
        
        netPay: finalAnnualNet / divisor,
        payableTax: finalAnnualTax / divisor,
        
        breakdown: detailedBreakdown.map(item => ({
          ...item,
          amount: item.amount / divisor,
          tax: item.tax / divisor
        }))
      },
      
      secondary: {
        netPay: inputMode === 'monthly' ? finalAnnualNet : finalAnnualNet / 12,
        label: inputMode === 'monthly' ? 'Annual' : 'Monthly'
      }
    };
  }, [grossIncome, inputMode, investment, showRebate, basicSalaryPercent]);

  // --- Formatting Helpers ---
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 font-sans text-slate-800 p-4 md:p-8">
      
      {/* Header - Inspired by financial documents */}
      <header className="max-w-6xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Calculator className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                Bangladesh Tax Calculator
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                  FY {TAX_CONFIG.fiscalYear}
                </span>
              </h1>
              <p className="text-slate-600 mt-1">Calculate your income tax in three simple steps</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-6">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`flex flex-col items-center transition-all ${activeStep === step ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${activeStep === step ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}`}>
                  {step}
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {step === 1 ? 'Income' : step === 2 ? 'Structure' : 'Results'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Tax-free Limit</p>
                <p className="text-lg font-bold text-slate-900">৳ 3,50,000</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Max Investment Rebate</p>
                <p className="text-lg font-bold text-slate-900">15%</p>
              </div>
              <PiggyBank className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">House Rent Exemption</p>
                <p className="text-lg font-bold text-slate-900">50% of Basic</p>
              </div>
              <Building className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Interactive Calculator - Inspired by bank deposit slips */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Income Card - Like ATM withdrawal slip */}
          <div className={`bg-white rounded-2xl shadow-lg border-2 ${activeStep === 1 ? 'border-emerald-500' : 'border-slate-200'} transition-all duration-300 overflow-hidden`}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeStep === 1 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Banknote className={`w-5 h-5 ${activeStep === 1 ? 'text-emerald-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Step 1: Enter Your Income</h2>
                    <p className="text-sm text-slate-500">Start with your gross salary</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">View as:</span>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => handleModeChange('monthly')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleModeChange('yearly')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'yearly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Large Input - Like calculator display */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-600 mb-3">
                  {inputMode === 'monthly' ? 'Gross Monthly Salary' : 'Gross Annual Salary'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <span className="text-3xl font-light text-slate-400">৳</span>
                  </div>
                  <input
                    type="text"
                    value={grossIncome.toLocaleString('en-BD')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(value)) setGrossIncome(Number(value));
                    }}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-xl text-3xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border-2 border-slate-200 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {inputMode === 'monthly' ? 'per month' : 'per year'}
                  </div>
                </div>
              </div>

              {/* Slider - Like volume control */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>৳ 0</span>
                  <span className="font-semibold">Adjust Income</span>
                  <span>{inputMode === 'monthly' ? '৳ 3,00,000+' : '৳ 36,00,000+'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={inputMode === 'monthly' ? 300000 : 3600000}
                  step={inputMode === 'monthly' ? 1000 : 5000}
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-center gap-4 mt-4">
                  {[50000, 100000, 150000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setGrossIncome(inputMode === 'monthly' ? amt : amt * 12)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                    >
                      ৳ {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Salary Structure - Like form sections */}
          <div className={`bg-white rounded-2xl shadow-lg border-2 ${activeStep === 2 ? 'border-amber-500' : 'border-slate-200'} transition-all duration-300 overflow-hidden`}>
            <button
              onClick={() => { setShowStructure(!showStructure); setActiveStep(2); }}
              className="w-full p-6 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showStructure ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    <FileText className={`w-5 h-5 ${showStructure ? 'text-amber-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Step 2: Configure Salary Structure</h2>
                    <p className="text-sm text-slate-500">Adjust allowances to maximize exemptions</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${showStructure ? 'text-amber-600' : 'text-slate-500'}`}>
                  {showStructure ? 'Collapse' : 'Expand'}
                  {showStructure ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>

            {showStructure && (
              <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top duration-200">
                {/* Basic Salary Slider - Like mixer faders */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 border border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-amber-600" />
                        Basic Salary Percentage
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">Higher basic = More exemptions for rent & medical</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-700">{basicSalaryPercent}%</div>
                      <div className="text-sm text-slate-600">{formatMoney(calculation.display.basic)}</div>
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min="30"
                    max="80"
                    step="5"
                    value={basicSalaryPercent}
                    onChange={(e) => setBasicSalaryPercent(Number(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-3">
                    <span>Lower Basic (30%)</span>
                    <span>Standard (60%)</span>
                    <span>Higher Basic (80%)</span>
                  </div>
                </div>

                {/* Exemptions Breakdown - Like receipt items */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Estimated Exemptions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ExemptionCard
                      icon={<Building className="w-5 h-5" />}
                      title="House Rent"
                      amount={calculation.display.exemptionDetails.hr}
                      color="bg-emerald-50"
                      iconColor="text-emerald-600"
                      description="50% of Basic (max ৳3L/year)"
                    />
                    <ExemptionCard
                      icon={<Stethoscope className="w-5 h-5" />}
                      title="Medical"
                      amount={calculation.display.exemptionDetails.med}
                      color="bg-blue-50"
                      iconColor="text-blue-600"
                      description="10% of Basic (max ৳1.2L/year)"
                    />
                    <ExemptionCard
                      icon={<Car className="w-5 h-5" />}
                      title="Conveyance"
                      amount={calculation.display.exemptionDetails.conv}
                      color="bg-purple-50"
                      iconColor="text-purple-600"
                      description="Fixed ৳30,000/year"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">Total Tax-free Allowance</span>
                    <span className="text-2xl font-bold text-emerald-700">
                      {formatMoney(calculation.display.exemptions)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Investments & Rebate - Like savings calculator */}
          <div className={`bg-white rounded-2xl shadow-lg border-2 ${activeStep === 3 ? 'border-indigo-500' : 'border-slate-200'} transition-all duration-300 overflow-hidden`}>
            <button
              onClick={() => { setShowRebate(!showRebate); setActiveStep(3); }}
              className="w-full p-6 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showRebate ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <PiggyBank className={`w-5 h-5 ${showRebate ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Step 3: Add Investments for Rebate</h2>
                    <p className="text-sm text-slate-500">Reduce tax through smart investments</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${showRebate ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {showRebate ? 'Collapse' : 'Expand'}
                  {showRebate ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>

            {showRebate && (
              <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top duration-200">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Investment Amount</h3>
                      <p className="text-sm text-slate-600 mt-1">Enter your planned investments for tax rebate</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Max allowed:</div>
                      <div className="text-lg font-bold text-indigo-700">
                        {formatMoney(calculation.display.maxInvestment)}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">৳</span>
                    <input
                      type="text"
                      value={investment.toLocaleString('en-BD')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(value)) setInvestment(Number(value));
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-white rounded-lg text-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-300"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    {[calculation.display.maxInvestment * 0.25, calculation.display.maxInvestment * 0.5, calculation.display.maxInvestment * 0.75].map((amt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInvestment(Math.round(amt))}
                        className="flex-1 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-sm font-medium text-indigo-700 transition-colors"
                      >
                        {idx === 0 ? '25%' : idx === 1 ? '50%' : '75%'}
                      </button>
                    ))}
                  </div>
                </div>

                {investment > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-emerald-800">Tax Rebate Applied!</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-700">
                        -{formatMoney(calculation.display.rebate)}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700/80">
                      You'll save 15% of your investment ({formatMoney(investment)}) as tax rebate
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Results - Inspired by bank statement */}
        <section className="lg:col-span-5 relative">
          <div className="sticky top-8">
            {/* Results Card - Like printed bank statement */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 overflow-hidden border border-slate-700">
              
              {/* Header like statement */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold">Tax Calculation Summary</h2>
                  </div>
                  <div className="text-xs bg-slate-700 px-3 py-1 rounded-full">
                    FY {TAX_CONFIG.fiscalYear}
                  </div>
                </div>
                <p className="text-sm text-slate-400">Based on your inputs</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Net Pay Highlight - Like ATM receipt */}
                <div className="text-center py-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                    Your {inputMode === 'monthly' ? 'Monthly Take Home' : 'Annual Take Home'}
                  </p>
                  <div className="text-5xl font-bold text-emerald-400 mb-2 font-mono">
                    {formatMoney(calculation.display.netPay)}
                  </div>
                  <p className="text-slate-500 text-sm">
                    {inputMode === 'monthly' ? 'Annual' : 'Monthly'} equivalent: {formatMoney(calculation.secondary.netPay)}
                  </p>
                </div>

                {/* Visual Tax Breakdown - Like pie chart simplified */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Where Your Money Goes
                  </h3>
                  <div className="space-y-3">
                    <TaxSegment
                      label="Tax You Pay"
                      amount={calculation.display.payableTax}
                      percentage={calculation.effectiveRate}
                      color="bg-rose-500"
                      icon={<TrendingDown className="w-4 h-4" />}
                    />
                    <TaxSegment
                      label="Money You Keep"
                      amount={calculation.display.netPay}
                      percentage={100 - calculation.effectiveRate}
                      color="bg-emerald-500"
                      icon={<TrendingUp className="w-4 h-4" />}
                    />
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${calculation.effectiveRate}%` }}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${100 - calculation.effectiveRate}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Breakdown - Like itemized receipt */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gross Income</span>
                      <span className="font-medium">{formatMoney(calculation.display.gross)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Less: Exemptions</span>
                      <span className="text-emerald-400">-{formatMoney(calculation.display.exemptions)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-700">
                      <span className="text-slate-300">Taxable Income</span>
                      <span className="text-white">{formatMoney(calculation.display.taxable)}</span>
                    </div>
                  </div>

                  {/* Tax Slabs - Like stepped progress */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase">Tax Slabs Applied</h4>
                    {calculation.display.breakdown
                      .filter(item => item.amount > 0)
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                            <span className="text-slate-300">
                              {item.description.split('(')[0]}
                            </span>
                            <span className="text-slate-500 text-xs">({item.rate}%)</span>
                          </div>
                          <span className={`font-mono ${item.tax > 0 ? 'text-rose-300' : 'text-slate-500'}`}>
                            {item.tax > 0 ? formatMoney(item.tax) : 'Free'}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Final Calculation - Like checkout total */}
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gross Tax</span>
                      <span className="text-slate-300">{formatMoney(calculation.display.grossTax)}</span>
                    </div>
                    {showRebate && calculation.display.rebate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Less: Investment Rebate</span>
                        <span className="text-emerald-400">-{formatMoney(calculation.display.rebate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                      <span className="text-slate-300">Final Tax Payable</span>
                      <span className="text-rose-400">{formatMoney(calculation.display.payableTax)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Effective Rate Badge */}
              <div className="p-6 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-slate-400">Effective Tax Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{calculation.effectiveRate.toFixed(2)}%</div>
                    <div className="text-xs text-slate-500">
                      {calculation.display.payableTax > 0 ? 'Lower than highest slab' : 'Within tax-free limit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Like form submission */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="px-4 py-3 bg-white rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                Save PDF
              </button>
              <button className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl text-white font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                <Calculator className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                <HelpCircle className="inline-block w-4 h-4 mr-1" />
                Adjust any input above to see real-time changes
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="text-center text-sm text-slate-500">
          <p>This calculator provides estimates based on standard assumptions. For exact calculations, consult with a tax professional.</p>
          <p className="mt-2">Made with ❤️ for Bangladesh taxpayers</p>
        </div>
      </footer>
    </div>
  );
};

// Reusable Components
const ExemptionCard = ({ icon, title, amount, color, iconColor, description }) => (
  <div className={`${color} rounded-xl p-4 border border-slate-200`}>
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-').replace('-50', '-100')}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
    </div>
    <div className="text-right">
      <div className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount)}</div>
    </div>
  </div>
);

const TaxSegment = ({ label, amount, percentage, color, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-sm text-slate-300">{label}</span>
      {icon}
    </div>
    <div className="text-right">
      <div className="text-sm font-medium">{formatMoney(amount)}</div>
      <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
    </div>
  </div>
);

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default TaxCalculator;