import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  X
} from 'lucide-react';

import { generateMockData, calculateStats } from './utils/mockData';
import { RiskRecord, TimeFilter, TabView } from './types';
import StatCard from './components/StatCard';
import { RiskDistributionPie } from './components/Charts';
import EnterpriseTable from './components/EnterpriseTable';
import DailyReportTable from './components/DailyReportTable';

const App: React.FC = () => {
  // State
  const [rawData, setRawData] = useState<RiskRecord[]>([]);
  // Changed default filter to 'yesterday'
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('yesterday');
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Custom Date State
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Initialize data
  useEffect(() => {
    // Generate data for the last 90 days. 
    // The generation logic now produces ~60k total volume per day with batched records.
    const data = generateMockData(90); 
    setRawData(data);
    setIsLoading(false);
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    // Normalize "now" to midnight for consistent comparisons
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return rawData.filter(d => {
      const callDate = new Date(d.callTime);
      
      switch (timeFilter) {
        case 'today':
          return callDate >= startOfToday;
        
        case 'yesterday': {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          return callDate >= startOfYesterday && callDate < startOfToday;
        }

        case '7days': {
          const date = new Date(startOfToday);
          date.setDate(date.getDate() - 7);
          return callDate >= date;
        }
        
        case '30days': {
          const date = new Date(startOfToday);
          date.setDate(date.getDate() - 30);
          return callDate >= date;
        }
        
        case 'year': {
          const date = new Date(startOfToday);
          date.setFullYear(date.getFullYear() - 1);
          return callDate >= date;
        }
        
        case 'custom': {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          // Set end date to end of day
          end.setHours(23, 59, 59, 999);
          return callDate >= start && callDate <= end;
        }
        
        default:
          return true;
      }
    });
  }, [rawData, timeFilter, customDateRange]);

  // Derived Stats
  const stats = useMemo(() => calculateStats(filteredData), [filteredData]);

  // Calculate Medium Risk Rate for display
  const mediumRiskRate = stats.totalDetections > 0 
    ? ((stats.mediumRiskCount / stats.totalDetections) * 100).toFixed(1) 
    : '0.0';

  // Handlers
  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [type]: value }));
    setTimeFilter('custom');
  };

  const toggleCustomPicker = () => {
    setShowCustomPicker(!showCustomPicker);
    if (!showCustomPicker && timeFilter !== 'custom') {
       setTimeFilter('custom');
    }
  };

  // Render Helpers
  const renderTabButton = (id: TabView, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderFilterButton = (id: TimeFilter, label: string) => (
    <button
      onClick={() => {
        setTimeFilter(id);
        if (id !== 'custom') setShowCustomPicker(false);
      }}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
        timeFilter === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center h-auto md:h-16 py-3 md:py-0">
            {/* Logo and Title */}
            <div className="flex items-center mb-3 md:mb-0">
               <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 select-none" style={{fontFamily: "'Inter', sans-serif"}}>
                 ZENAVA
               </span>
               <div className="w-px h-6 bg-gray-300 mx-4"></div>
               <h1 className="text-xl font-bold text-gray-900">风控数据分析</h1>
            </div>
            
            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-2 relative">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full">
                {renderFilterButton('today', '今天')}
                {renderFilterButton('yesterday', '昨天')}
                {renderFilterButton('7days', '近7天')}
                {renderFilterButton('30days', '近30天')}
                {renderFilterButton('year', '近1年')}
              </div>
              
              <div className="relative">
                <button 
                  onClick={toggleCustomPicker}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                    timeFilter === 'custom' 
                      ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>自定义</span>
                </button>

                {/* Custom Date Picker Popover */}
                {showCustomPicker && (
                  <div className="absolute right-0 top-full mt-2 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50 w-72 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">选择日期范围</h4>
                      <button onClick={() => setShowCustomPicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                        <input 
                          type="date" 
                          value={customDateRange.start}
                          onChange={(e) => handleCustomDateChange('start', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                        <input 
                          type="date" 
                          value={customDateRange.end}
                          onChange={(e) => handleCustomDateChange('end', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="pt-2">
                         <button 
                           onClick={() => setShowCustomPicker(false)}
                           className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
                         >
                           确认
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs - Removed Review Analysis */}
          <div className="flex space-x-2 py-3 overflow-x-auto border-t border-gray-100 md:border-none mt-2 md:mt-0">
            {renderTabButton('overview', '风险概览', <LayoutDashboard className="w-4 h-4" />)}
            {renderTabButton('enterprise', '企业风控明细', <Building2 className="w-4 h-4" />)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Top-Level KPI Cards - Only shown on Overview tab now */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="总检测量" 
              value={stats.totalDetections.toLocaleString()} 
              // Removed subValue for total reviewed
              icon={Activity} 
              colorClass="bg-blue-600 text-blue-600"
            />
            <StatCard 
              title="高风险总量" 
              value={stats.highRiskCount.toLocaleString()} 
              subValue={`已复核 ${stats.highRiskReviewedCount.toLocaleString()} 条`}
              icon={AlertTriangle} 
              colorClass="bg-red-600 text-red-600"
            />
            <StatCard 
              title="中风险总量" 
              value={stats.mediumRiskCount.toLocaleString()} 
              subValue={`已复核 ${stats.mediumRiskReviewedCount.toLocaleString()} 条`}
              icon={AlertTriangle} 
              colorClass="bg-amber-500 text-amber-500"
            />
             <StatCard 
              title="中高风险复核完成率" 
              value={`${stats.reviewCompletionRate.toFixed(1)}%`}
              subValue={`已复核 / (高+中风险)`}
              icon={CheckCircle2} 
              colorClass="bg-emerald-600 text-emerald-600"
            />
          </div>
        )}

        {/* Tab Content: Risk Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Distribution Chart - Now Full Width since Trend Chart is removed */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">异常风险构成分析</h3>
                <span className="text-sm text-gray-500">安全水位与异常分布</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 {/* Updated Chart Component */}
                 <RiskDistributionPie data={filteredData} />
                 
                 <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">风险占比详情</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-red-700 font-medium">高风险</span>
                        <div className="text-right">
                           <span className="block text-lg font-bold text-red-800">{stats.highRiskRate.toFixed(2)}%</span>
                           <span className="text-xs text-red-600">{stats.highRiskCount.toLocaleString()} 条</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-amber-700 font-medium">中风险</span>
                        <div className="text-right">
                           <span className="block text-lg font-bold text-amber-800">{mediumRiskRate}%</span>
                           <span className="text-xs text-amber-600">{stats.mediumRiskCount.toLocaleString()} 条</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-blue-700 font-medium">低风险 (正常)</span>
                        <div className="text-right">
                           <span className="block text-lg font-bold text-blue-800">{((stats.lowRiskCount / stats.totalDetections) * 100).toFixed(2)}%</span>
                           <span className="text-xs text-blue-600">{stats.lowRiskCount.toLocaleString()} 条</span>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Daily Data Table Report - Now contains merged review data */}
            <DailyReportTable data={filteredData} />
          </div>
        )}

        {/* Tab Content: Enterprise Risk */}
        {activeTab === 'enterprise' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <EnterpriseTable data={filteredData} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;