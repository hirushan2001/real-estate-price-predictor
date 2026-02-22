import { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, MapPin, Map as MapIcon, Droplets, Zap, Ruler, Calculator, Printer, Info, TrendingUp } from 'lucide-react';
import './App.css';

// Sample insight generator
const getMarketInsight = (district) => {
  if (!district) return "Select a district to view regional market insights and trends.";
  const insights = {
    "Colombo": "Colombo commands the highest premium in the country, driven by commercial development and luxury residential projects.",
    "Gampaha": "Gampaha represents a rapidly growing suburban corridor with high demand for residential plots due to highway connectivity.",
    "Kandy": "Kandy's real estate market is heavily influenced by tourism, heritage value, and pleasant climate, keeping land prices robust.",
    "Galle": "Galle shows strong foreign investment interest, particularly in coastal and heritage properties, creating a dual-tier market.",
    "Kurunegala": "A major transit hub, Kurunegala is seeing steady appreciation in land values, particularly for commercial use.",
    "Default": `${district} shows steady market activity with regional development projects influencing long-term property values.`
  };
  return insights[district] || insights["Default"];
}

function App() {
  const [locations, setLocations] = useState({});
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [landSize, setLandSize] = useState(10);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasWater, setHasWater] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/locations');
        setLocations(response.data);

        const districtList = Object.keys(response.data).sort();
        setDistricts(districtList);

        // Form default
        if (districtList.length > 0) {
          const defaultDistrict = districtList[0];
          setDistrict(defaultDistrict);
          setCity(response.data[defaultDistrict][0] || '');
          setCities(response.data[defaultDistrict]);
        }
      } catch (err) {
        setError('Failed to load locations. Please ensure the backend server is running.');
        console.error(err);
      }
    };

    fetchLocations();
  }, []);

  // Update cities when district changes
  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    const newCities = locations[newDistrict] || [];

    setDistrict(newDistrict);
    setCity(newCities.length > 0 ? newCities[0] : '');
    setCities(newCities);
    setResult(null); // Clear previous result
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setResult(null); // Clear previous result
  };

  const handleLandSizeChange = (e) => {
    setLandSize(e.target.value);
    setResult(null); // Clear previous result
  };

  const handleWaterChange = (e) => {
    setHasWater(e.target.checked);
    setResult(null); // Clear previous result
  };

  const handleElectricityChange = (e) => {
    setHasElectricity(e.target.checked);
    setResult(null); // Clear previous result
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        district: district,
        city: city,
        land_size: Number(landSize),
        has_electricity: hasElectricity ? 1 : 0,
        has_water: hasWater ? 1 : 0
      };

      const response = await axios.post('http://localhost:5000/api/predict', payload);
      setResult(response.data);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction. Please ensure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            LankaLand Predictor
          </h1>
        </div>
        <p className="text-lg text-slate-500 font-medium">
          Analytics Dashboard & Intelligent Real Estate Valuation
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Property Details
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* District Select */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <MapIcon className="w-4 h-4 text-indigo-400" /> District
                  </label>
                  <select
                    value={district}
                    onChange={handleDistrictChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    <option value="" disabled>Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* City Select */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" /> City
                  </label>
                  <select
                    value={city}
                    onChange={handleCityChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    required
                    disabled={!district}
                  >
                    <option value="" disabled>Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Land Size */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-indigo-400" /> Land Size (Perches)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={landSize}
                    onChange={handleLandSizeChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">perches</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={hasWater}
                      onChange={handleWaterChange}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" /> Tap Water Access
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">Connected to main water supply</div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={hasElectricity}
                      onChange={handleElectricityChange}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" /> National Grid Electricity
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">Direct connection to power grid</div>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all ${loading
                    ? 'bg-indigo-400 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-200'
                    }`}
                >
                  {loading ? 'Analyzing Market Data...' : 'Calculate Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Insights & Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Market Insight Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Regional Market Insight
            </h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              {getMarketInsight(district)}
            </p>
          </div>

          {/* Valuation Results Card */}
          <div className="bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden flex-grow flex flex-col relative border border-slate-800 isolate transition-all">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="p-8 flex-grow flex flex-col justify-center">
              {result ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-start border-b border-slate-700/50 pb-6 print:border-b-0 print:pb-0">
                    <div>
                      <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Estimated Value</h2>
                      <div className="text-xl text-white font-medium flex items-center gap-2 print:text-slate-900">
                        {city}, {district}
                      </div>
                    </div>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700 print:hidden"
                    >
                      <Printer className="w-4 h-4" /> Export Report
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-slate-400 text-sm font-medium mb-2 print:text-slate-500">Price Per Perch</p>
                      <p className="text-3xl font-bold text-slate-100 tracking-tight print:text-slate-900">
                        {formatCurrency(result.price_per_perch)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium mb-2 print:text-slate-500">Total Property Value ({landSize} perches)</p>
                      <p className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 tracking-tight print:text-indigo-700">
                        {formatCurrency(result.total_price)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-slate-700 opacity-50" />
                  <p className="text-lg">Enter property details and calculate to see valuation results here.</p>
                </div>
              )}
            </div>

            {/* AI Model Transparency (XAI) Box */}
            <div className="bg-slate-900/50 border-t border-slate-800 p-6 mt-auto print:hidden rounded-b-2xl">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-1">Local Model Explainability (SHAP)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This chart explains exactly how the ML algorithm calculated this specific property's value.
                    It starts from a baseline market average and adds/subtracts value based on your unique inputs.
                  </p>
                </div>
              </div>

              {result?.xai && (
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 border-b border-slate-700 pb-2">
                    <span>Feature</span>
                    <span className="text-center flex-1">Impact Direction</span>
                    <span className="text-right w-24">Value Change</span>
                  </div>

                  {Object.entries(result.xai.contributions)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)) // Sort by absolute impact
                    .map(([feature, impact]) => {
                      const isPositive = impact >= 0;
                      // Calculate width percentage relative to max impact for scaling
                      const maxImpact = Math.max(...Object.values(result.xai.contributions).map(Math.abs));
                      const widthPercent = Math.max((Math.abs(impact) / maxImpact) * 100, 1);

                      return (
                        <div key={feature} className="flex items-center gap-3">
                          <div className="w-[85px] text-xs font-medium text-slate-300 truncate" title={feature}>
                            {feature}
                          </div>

                          <div className="flex-1 flex items-center relative h-5">
                            {/* Zero line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-0"></div>

                            {/* Bar container */}
                            <div className="w-full flex h-full">
                              {/* Negative side */}
                              <div className="w-1/2 flex justify-end items-center pr-1 relative z-10">
                                {!isPositive && (
                                  <div
                                    className="h-3.5 bg-rose-500/90 rounded-l shadow-[0_0_8px_rgba(244,63,94,0.3)] cursor-help transition-all hover:bg-rose-400"
                                    style={{ width: `${widthPercent}%` }}
                                    title={`${feature} decreased value by ${formatCurrency(Math.abs(impact))}`}
                                  ></div>
                                )}
                              </div>

                              {/* Positive side */}
                              <div className="w-1/2 flex justify-start items-center pl-1 relative z-10">
                                {isPositive && (
                                  <div
                                    className="h-3.5 bg-emerald-500/90 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-help transition-all hover:bg-emerald-400"
                                    style={{ width: `${widthPercent}%` }}
                                    title={`${feature} increased value by ${formatCurrency(Math.abs(impact))}`}
                                  ></div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={`w-24 text-right text-xs font-bold font-mono tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : '-'}{formatCurrency(Math.abs(impact))}
                          </div>
                        </div>
                      );
                    })}

                  <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                    <span>Baseline Average: <strong className="text-slate-300">{formatCurrency(result.xai.base_value)}</strong></span>
                    <span>Predicted Price: <strong className="text-white">{formatCurrency(result.price_per_perch)}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
