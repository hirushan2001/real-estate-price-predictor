import { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, MapPin, Map, Droplets, Zap, Ruler, Calculator } from 'lucide-react';
import './App.css';

function App() {
  const [locations, setLocations] = useState({});
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    district: '',
    city: '',
    land_size: 10,
    has_electricity: false,
    has_water: false
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
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
          setFormData(prev => ({
            ...prev,
            district: defaultDistrict,
            city: response.data[defaultDistrict][0] || ''
          }));
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
    
    setFormData(prev => ({
      ...prev,
      district: newDistrict,
      city: newCities.length > 0 ? newCities[0] : ''
    }));
    
    setCities(newCities);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    setPrediction(null);
    
    try {
      const payload = {
        district: formData.district,
        city: formData.city,
        land_size: Number(formData.land_size),
        has_electricity: formData.has_electricity ? 1 : 0,
        has_water: formData.has_water ? 1 : 0
      };
      
      const response = await axios.post('http://localhost:5000/api/predict', payload);
      setPrediction(response.data);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction. Please ensure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header Label */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-3 rounded-full shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              LankaLand Predictor
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-600">
            Intelligent Machine Learning API for Real Estate Valuations
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                {/* District Select */}
                <div>
                  <label htmlFor="district" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Map className="w-4 h-4 text-indigo-500" />
                    District
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-colors border shadow-sm"
                    required
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* City Select */}
                <div>
                  <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    City
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-colors border shadow-sm"
                    required
                    disabled={!formData.district}
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Land Size */}
              <div>
                <label htmlFor="land_size" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 text-indigo-500" />
                  Land Size (Perches)
                </label>
                <div className="relative rounded-md shadow-sm mt-1">
                  <input
                    type="number"
                    name="land_size"
                    id="land_size"
                    step="0.01"
                    min="1"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 py-3 sm:text-sm border-gray-300 rounded-lg border bg-gray-50 transition-colors"
                    placeholder="10.0"
                    value={formData.land_size}
                    onChange={handleChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">perches</span>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col sm:flex-row gap-6 pt-2">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="has_electricity"
                      name="has_electricity"
                      type="checkbox"
                      checked={formData.has_electricity}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="has_electricity" className="font-semibold text-gray-700 flex items-center gap-2 cursor-pointer select-none">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Availability of Electricity
                    </label>
                    <p className="text-gray-500">Connected to the national grid</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="has_water"
                      name="has_water"
                      type="checkbox"
                      checked={formData.has_water}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="has_water" className="font-semibold text-gray-700 flex items-center gap-2 cursor-pointer select-none">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      Availability of Tap Water
                    </label>
                    <p className="text-gray-500">Connected to main water supply</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all duration-200 transform ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-xl'}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating Valuation...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Estimate Property Value
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Prediction Results Card */}
        {prediction && (
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-8 py-10">
              <h2 className="text-xl font-medium text-indigo-100 mb-6 flex items-center justify-center gap-2">
                <span className="w-10 h-px bg-indigo-400"></span>
                Valuation Results
                <span className="w-10 h-px bg-indigo-400"></span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                  <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-2">Price Per Perch</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(prediction.price_per_perch)}
                  </p>
                  <p className="text-indigo-300 text-sm mt-3 flex items-center gap-1">
                    Based on CatBoost Model ML
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500 rounded-full opacity-20 blur-xl"></div>
                  <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-2">Total Est. Value</p>
                  <p className="text-4xl font-extrabold text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">
                    {formatCurrency(prediction.total_price)}
                  </p>
                  <p className="text-indigo-300 text-sm mt-3">
                    For {formData.land_size} {Number(formData.land_size) === 1 ? 'perch' : 'perches'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;
