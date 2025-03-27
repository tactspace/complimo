"use client"
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from "./Navbar";

interface PowerDataPoint {
  timestamp: string;
  kW: number;
}

interface FlowDataPoint {
  timestamp: string;
  flow: number;
  setpoint: number;
}

interface HVACMetrics {
  HVAC_Metrics: {
  Power_Consumption: {
    Absolute_Power_W: number;
  };
  Temperature_Differential: {
    Delta_Temperature_K: number;
    Setpoint_Delta_T_K: number;
    Temperature_1_Remote_K: number;
    Temperature_2_Embedded_K: number;
  };
  Flow_Performance: {
    Relative_Flow_Percentage: number;
    Absolute_Flow_m3_s: number;
    Flow_Volume_Total_m3: number;
  };
  Energy_Consumption: {
    Cooling_Energy_J: number;
    Heating_Energy_J: number;
  };
  Operational_Metrics: {
    Operating_Time_h: number;
    Active_Time_h: number;
  };
  System_Status: {
    Flow_Signal_Faulty: boolean;
  };
}
}

export default function Home() {
  const [metrics, setMetrics] = useState<HVACMetrics>({
    HVAC_Metrics: {
      Power_Consumption: { Absolute_Power_W: 0 },
      Temperature_Differential: {
        Delta_Temperature_K: 0,
        Setpoint_Delta_T_K: 0,
        Temperature_1_Remote_K: 0,
        Temperature_2_Embedded_K: 0
      },
      Flow_Performance: {
        Relative_Flow_Percentage: 0,
        Absolute_Flow_m3_s: 0,
        Flow_Volume_Total_m3: 0
      },
      Energy_Consumption: {
        Cooling_Energy_J: 0,
        Heating_Energy_J: 0
      },
      Operational_Metrics: {
        Operating_Time_h: 0,
        Active_Time_h: 0
      },
      System_Status: {
        Flow_Signal_Faulty: false
      }
    }
  });
  
  const [powerData, setPowerData] = useState<PowerDataPoint[]>([]);
  const [flowData, setFlowData] = useState<FlowDataPoint[]>([]);
  const stepRef = useRef(1);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/hvac-metrics/${stepRef.current}`
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data: HVACMetrics = await response.json();
      console.log('Faulty?', data.HVAC_Metrics.System_Status.Flow_Signal_Faulty, stepRef);
      
      // Update metrics state
      setMetrics(data);
      
      // Update chart data
      const timestamp = new Date().toLocaleTimeString();
      
      setPowerData(prev => [...prev.slice(-9), {
        timestamp,
        kW: data.HVAC_Metrics.Power_Consumption.Absolute_Power_W / 1000
      }]);
      
      setFlowData(prev => [...prev.slice(-9), {
        timestamp,
        flow: data.HVAC_Metrics.Flow_Performance.Relative_Flow_Percentage,
        setpoint: 75 // Setpoint from API or keep hardcoded
      }]);

      stepRef.current++;
    } catch (error) {
      console.error('Error fetching HVAC data:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchData, 2500);
    // Initial fetch
    fetchData();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Include the Navbar component */}
      <Navbar />

      {/* Dashboard Section */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-black">HVAC System Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
              <div className={`w-3 h-3 rounded-full ${
                metrics.HVAC_Metrics.System_Status.Flow_Signal_Faulty 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
              }`}></div>
              <span className="font-medium text-sm text-black">
                {metrics.HVAC_Metrics.System_Status.Flow_Signal_Faulty
                  ? 'Flow Signal Fault' 
                  : 'All Systems Normal'}
              </span>
            </div>
            <select 
              className="bg-white border border-gray-100 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 text-black focus:ring-[#FF6600]"
              defaultValue="belimo-3"
            >
              <option value="belimo-3">Belimo Energy Valve 3</option>
              <option value="other" disabled>Other Sources (Coming Soon)</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Consumption Graph */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-black mb-4">Power Consumption Trend (kW)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis unit="kW" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="kW" 
                    stroke="#FF6600" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flow Performance Graph */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-black mb-4">Relative Flow % </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar 
                    dataKey="flow" 
                    fill="#FF6600" 
                    radius={[4, 4, 0, 0]}
                  />
                 
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Updated cards grid (removed system status card) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Temperature Differential Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-black mb-4">Temperature Differential</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black">Current ΔT</span>
                    <span className="font-semibold text-black">{metrics.HVAC_Metrics.Temperature_Differential.Delta_Temperature_K.toFixed(2)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/70">Setpoint</span>
                    <span className="text-black/70 font-semibold">{metrics.HVAC_Metrics.Temperature_Differential.Setpoint_Delta_T_K.toFixed(2)}K</span>
                  </div>
                  <div className="flex gap-2 items-center text-sm w-full justify-between">
                    <span className="text-black">Remote: {metrics.HVAC_Metrics.Temperature_Differential.Temperature_1_Remote_K.toFixed(2)}K</span>
                    <span className="text-black">Embedded: {metrics.HVAC_Metrics.Temperature_Differential.Temperature_2_Embedded_K.toFixed(2)}K</span>
                  </div>
                </div>
              </div>

              {/* Energy Consumption Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-black mb-4">Energy Consumption</h3>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FF6600]">
                      {(metrics.HVAC_Metrics.Energy_Consumption.Cooling_Energy_J / 1e9).toFixed(1)}
                    </div>
                    <div className="text-sm text-black/70 mt-1">Cooling (GJ)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FF6600]">
                      {(metrics.HVAC_Metrics.Energy_Consumption.Heating_Energy_J / 1e9).toFixed(1)}
                    </div>
                    <div className="text-sm text-black/70 mt-1">Heating (GJ)</div>
                  </div>
                </div>
              </div>

              {/* Operational Metrics Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-black mb-4">Operational Hours</h3>
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{metrics.HVAC_Metrics.Operational_Metrics.Operating_Time_h}</div>
                    <div className="text-sm text-black/70">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{metrics.HVAC_Metrics.Operational_Metrics.Active_Time_h}</div>
                    <div className="text-sm text-black/70">Active Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
