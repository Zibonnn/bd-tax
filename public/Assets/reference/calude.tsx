import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

const GlassTaxCalculator = () => {
  const [display, setDisplay] = useState('75000');
  const [mode, setMode] = useState('monthly');
  const [sliders, setSliders] = useState({
    basic: 60,
    houseRent: 25,
    medical: 10,
    conveyance: 5
  });
  
  // Investment types with different rebate rules
  const [investments, setInvestments] = useState([
    { id: 1, name: 'Life Insurance Premium', amount: 0, rebateRate: 100, limit: 50000, category: '100% Rebate' },
    { id: 2, name: 'DPS/Savings Certificate', amount: 0, rebateRate: 100, limit: 100000, category: '100% Rebate' },
    { id: 3, name: 'Provident Fund', amount: 0, rebateRate: 100, limit: null, category: '100% Rebate' },
    { id: 4, name: 'Stock Market Investment', amount: 0, rebateRate: 15, limit: null, category: '15% Rebate' },
    { id: 5, name: 'Donation (Zakat Fund)', amount: 0, rebateRate: 15, limit: null, category: '15% Rebate' },
  ]);
  
  const [isCalculated, setIsCalculated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const TAX_CONFIG = {
    brackets: [
      { upperLimit: 350000, rate: 0, description: "First 3,50,000" },
      { upperLimit: 450000, rate: 5, description: "Next 1,00,000" },
      { upperLimit: 850000, rate: 10, description: "Next 4,00,000" },
      { upperLimit: 1350000, rate: 15, description: "Next 5,00,000" },
      { upperLimit: 1850000, rate: 20, description: "Next 5,00,000" },
      { upperLimit: 3850000, rate: 25, description: "Next 20,00,000" },
      { upperLimit: null, rate: 30, description: "Remaining" },
    ],
    exemptions: {
      houseRent: { limit: 300000, percentOfBasic: 0.50 },
      medical: { limit: 120000, percentOfBasic: 0.10 },
      conveyance: { limit: 30000 }
    }
  };

  const calculate = () => {
    const income = parseFloat(display) || 0;
    const annualGross = mode === 'monthly' ? income * 12 : income;
    
    const basicSalary = annualGross * (sliders.basic / 100);
    const estHouseRent = annualGross * (sliders.houseRent / 100);
    const estMedical = annualGross * (sliders.medical / 100);
    const estConveyance = annualGross * (sliders.conveyance / 100);

    const exemptHR = Math.min(estHouseRent, basicSalary * 0.50, TAX_CONFIG.exemptions.houseRent.limit);
    const exemptMed = Math.min(estMedical, basicSalary * 0.10, TAX_CONFIG.exemptions.medical.limit);
    const exemptConv = Math.min(estConveyance, TAX_CONFIG.exemptions.conveyance.limit);
    
    const totalExemptions = exemptHR + exemptMed + exemptConv;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    let prevLimit = 0;
    let grossTax = 0;
    const breakdown = [];

    for (let bracket of TAX_CONFIG.brackets) {
      const limit = bracket.upperLimit === null ? Infinity : bracket.upperLimit;
      const slabSize = limit - prevLimit;
      const amountInSlab = Math.min(Math.max(0, taxableIncome - prevLimit), slabSize);
      const taxInSlab = amountInSlab * (bracket.rate / 100);
      
      if (amountInSlab > 0 || bracket.rate === 0) {
        breakdown.push({
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

    // Calculate rebates based on investment types
    let totalRebate = 0;
    const rebateBreakdown: Array<{ name: string; amount: number; rebate: number; rate: number }> = [];

    investments.forEach(inv => {
      const annualAmount = mode === 'monthly' ? inv.amount * 12 : inv.amount;
      if (annualAmount > 0) {
        let eligibleAmount = annualAmount;
        
        // Apply limit if exists
        if (inv.limit !== null) {
          eligibleAmount = Math.min(annualAmount, inv.limit);
        }
        
        // Calculate rebate
        let rebate = 0;
        if (inv.rebateRate === 100) {
          rebate = eligibleAmount; // 100% rebate means full amount deducted
        } else {
          rebate = eligibleAmount * (inv.rebateRate / 100);
        }
        
        totalRebate += rebate;
        rebateBreakdown.push({
          name: inv.name,
          amount: eligibleAmount,
          rebate: rebate,
          rate: inv.rebateRate
        });
      }
    });

    const finalAnnualTax = Math.max(0, grossTax - totalRebate);
    const finalAnnualNet = annualGross - finalAnnualTax;

    const divisor = mode === 'monthly' ? 12 : 1;

    return {
      gross: annualGross / divisor,
      exemptions: totalExemptions / divisor,
      taxable: taxableIncome / divisor,
      breakdown: breakdown.map(item => ({
        ...item,
        amount: item.amount / divisor,
        tax: item.tax / divisor
      })),
      grossTax: grossTax / divisor,
      rebateBreakdown: rebateBreakdown.map(item => ({
        ...item,
        amount: item.amount / divisor,
        rebate: item.rebate / divisor
      })),
      totalRebate: totalRebate / divisor,
      payableTax: finalAnnualTax / divisor,
      netPay: finalAnnualNet / divisor,
      effectiveRate: annualGross > 0 ? (finalAnnualTax / annualGross) * 100 : 0
    };
  };

  const result = calculate();

  const handleNumberClick = (num) => {
    if (display === '0' || display === '75000') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
    setIsCalculated(false);
  };

  const handleClear = () => {
    setDisplay('0');
    setIsCalculated(false);
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    
    // Convert display value
    const currentValue = parseFloat(display) || 0;
    if (newMode === 'yearly') {
      setDisplay(String(currentValue * 12));
    } else {
      setDisplay(String(Math.round(currentValue / 12)));
    }
    
    // Convert all investment amounts
    setInvestments(prev => prev.map(inv => ({
      ...inv,
      amount: newMode === 'yearly' ? inv.amount * 12 : Math.round(inv.amount / 12)
    })));
    
    setMode(newMode);
  };

  const handleCalculate = () => {
    setIsCalculated(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);
  };

  const handleSliderChange = (key, value) => {
    const newValue = parseFloat(value);
    setSliders(prev => ({
      ...prev,
      [key]: newValue
    }));
    setIsCalculated(false);
  };

  const handleInvestmentChange = (id, value) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, amount: parseFloat(value) || 0 } : inv
    ));
    setIsCalculated(false);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 shadow-2xl">
            <Calculator className="w-6 h-6 text-purple-300" />
            <h1 className="text-2xl font-bold text-white">Tax Receipt Machine</h1>
          </div>
          <p className="text-purple-200/60 text-sm mt-3">FY 2024-2025 • Bangladesh</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Calculator Interface */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calculator Display */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              
              {/* LED Display */}
              <div className="bg-gradient-to-br from-emerald-950 to-slate-950 rounded-2xl p-6 mb-6 border border-emerald-500/30 shadow-inner">
                <div className="text-right">
                  <div className="text-emerald-400/60 text-xs font-mono mb-1 uppercase tracking-wider">
                    {mode === 'monthly' ? 'Monthly' : 'Annual'} Input
                  </div>
                  <div className="text-5xl font-mono font-bold text-emerald-400 tracking-wider" style={{textShadow: '0 0 20px rgba(52, 211, 153, 0.5)'}}>
                    ৳{parseFloat(display || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex justify-center mb-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 inline-flex">
                  <button
                    onClick={() => handleModeChange('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      mode === 'monthly' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleModeChange('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      mode === 'yearly' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl h-16 text-white text-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg hover:border-purple-400/50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleNumberClick('0')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl h-16 text-white text-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg hover:border-purple-400/50"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumberClick('00')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl h-16 text-white text-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg hover:border-purple-400/50"
                >
                  00
                </button>
                <button
                  onClick={handleClear}
                  className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 rounded-2xl h-16 text-red-300 text-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg"
                >
                  C
                </button>
              </div>
            </div>

            {/* Salary Mixer */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-white font-bold mb-6 text-center flex items-center justify-center gap-2">
                <span className="text-lg">Salary Mixer</span>
              </h3>
              
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(sliders).map(([key, value]) => (
                  <div key={key} className="flex flex-col items-center">
                    <div className="relative w-12 h-40 bg-gradient-to-b from-white/5 to-white/10 rounded-full border border-white/20 overflow-hidden mb-3">
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ height: `${value}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={value}
                        onChange={(e) => handleSliderChange(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                      />
                    </div>
                    <div className="text-white/90 text-xs font-bold text-center mb-1">
                      {value}%
                    </div>
                    <div className="text-white/60 text-xs text-center capitalize">
                      {key === 'houseRent' ? 'H.Rent' : key}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Section */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-300" />
                <span>Investments & Rebates</span>
              </h3>
              
              <div className="space-y-4">
                {/* Group by category */}
                {['100% Rebate', '15% Rebate'].map(category => (
                  <div key={category}>
                    <div className="text-xs text-white/50 uppercase font-bold mb-3 tracking-wider">{category}</div>
                    <div className="space-y-3">
                      {investments.filter(inv => inv.category === category).map(inv => (
                        <div key={inv.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-white/80 text-sm font-medium">{inv.name}</label>
                            {inv.limit && (
                              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                                Max: {formatMoney(mode === 'monthly' ? inv.limit / 12 : inv.limit)}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-serif">৳</span>
                            <input 
                              type="number" 
                              value={inv.amount || ''}
                              onChange={(e) => handleInvestmentChange(inv.id, e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder-white/30"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-5 rounded-2xl shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 ${
                isCalculated ? 'ring-4 ring-emerald-400/50' : ''
              }`}
            >
              {isCalculated ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  CALCULATED
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  CALCULATE TAX
                </>
              )}
            </button>
          </div>

          {/* Right: Live Receipt */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              
              {/* Receipt Container */}
              <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden">
                
                {/* Receipt Paper Effect */}
                <div className="relative">
                  {/* Perforation Top */}
                  <div className="h-4 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 12px)',
                    borderBottom: '1px dashed rgba(0,0,0,0.1)'
                  }}/>
                  
                  {/* Receipt Content */}
                  <div className="p-6 font-mono text-xs text-slate-800">
                    
                    <div className="text-center mb-4 border-b-2 border-dashed border-slate-300 pb-3">
                      <div className="text-[10px] text-slate-500 mb-1">━━━━━━━━━━━━━━━━━</div>
                      <div className="font-bold text-sm">TAX RECEIPT</div>
                      <div className="text-[10px] text-slate-500">FY 2024-2025</div>
                      <div className="text-[10px] text-slate-500 mt-1">{new Date().toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500 mb-1">━━━━━━━━━━━━━━━━━</div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Gross {mode === 'monthly' ? 'Mo.' : 'Yr.'}:</span>
                        <span className="font-bold">{formatMoney(result.gross)}</span>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span>Exemptions:</span>
                        <span className="font-bold">-{formatMoney(result.exemptions)}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 mb-3">
                      <div className="flex justify-between font-bold">
                        <span>Taxable:</span>
                        <span>{formatMoney(result.taxable)}</span>
                      </div>
                    </div>

                    <div className="my-3">
                      <div className="text-[10px] text-slate-500 mb-2 text-center uppercase tracking-wider">Tax Slabs</div>
                    </div>

                    {result.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">{item.description.replace('First ', '').replace('Next ', '')} ({item.rate}%)</span>
                        <span className={item.tax > 0 ? 'font-semibold' : 'text-slate-400'}>
                          {item.tax > 0 ? formatMoney(item.tax) : '-'}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-slate-300 pt-2 mt-3 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>Gross Tax:</span>
                        <span>{formatMoney(result.grossTax)}</span>
                      </div>
                    </div>

                    {result.rebateBreakdown.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[10px] text-slate-500 mb-2 text-center uppercase tracking-wider">Rebates</div>
                        {result.rebateBreakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-green-700 text-[11px]">
                            <span className="truncate mr-2">{item.name}</span>
                            <span className="font-semibold whitespace-nowrap">-{formatMoney(item.rebate)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t-2 border-slate-400 pt-3 mt-3">
                      <div className="flex justify-between text-red-600 font-bold mb-3">
                        <span>Tax Payable:</span>
                        <span>{formatMoney(result.payableTax)}</span>
                      </div>
                    </div>

                    <div className="my-3 text-center">
                      <div className="text-[10px] text-slate-500 mb-2">━━━━━━━━━━━━━━━━━</div>
                    </div>

                    <div className={`bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border-2 transition-all duration-500 ${
                      isCalculated ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-emerald-200'
                    }`}>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Net Take Home</div>
                        <div className="text-2xl font-bold text-emerald-700" style={{textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                          {formatMoney(result.netPay)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Rate: {result.effectiveRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center text-[10px] text-slate-500">
                      <div className="mb-2">━━━━━━━━━━━━━━━━━</div>
                      <div>Updated in Real-time</div>
                      <div className="mt-1">Thank you!</div>
                    </div>

                  </div>
                </div>

                {/* Paper Curl Effect */}
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-gradient-to-b from-white/40 to-transparent rounded-b-3xl transform translate-y-2" 
                     style={{boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}/>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GlassTaxCalculator;