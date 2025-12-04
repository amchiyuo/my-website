import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { RiskRecord, RiskLevel, ReviewResult } from '../types';

const COLORS = {
  HIGH: '#ef4444', // Red-500
  MEDIUM: '#f59e0b', // Amber-500
  LOW: '#3b82f6', // Blue-500
  FRAUD: '#dc2626', // Red-600
  SUSPECT: '#f97316', // Orange-500
  FALSE: '#10b981', // Emerald-500
  ILLEGAL: '#8b5cf6', // Violet-500
  NORMAL_BG: '#e5e7eb' // Gray-200
};

interface ChartProps {
  data: RiskRecord[];
}

export const RiskTrendChart: React.FC<ChartProps> = ({ data }) => {
  // Aggregate data by day
  const dailyStats = React.useMemo(() => {
    const map = new Map<string, { date: string; [key: string]: any }>();
    
    data.forEach(d => {
      const dateStr = new Date(d.callTime).toLocaleDateString('zh-CN');
      if (!map.has(dateStr)) {
        map.set(dateStr, { date: dateStr, '高风险': 0, '中风险': 0, '低风险': 0 });
      }
      const entry = map.get(dateStr)!;
      const n = d.count || 1;
      
      if (entry[d.riskLevel] !== undefined) {
        entry[d.riskLevel] += n;
      }
    });

    return Array.from(map.values()).reverse(); 
  }, [data]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dailyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.HIGH} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={COLORS.HIGH} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.MEDIUM} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={COLORS.MEDIUM} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend iconType="circle" />
          <Area type="monotone" dataKey="高风险" stroke={COLORS.HIGH} fillOpacity={1} fill="url(#colorHigh)" name="高风险" />
          <Area type="monotone" dataKey="中风险" stroke={COLORS.MEDIUM} fillOpacity={1} fill="url(#colorMed)" name="中风险" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ReviewOutcomeChart: React.FC<ChartProps> = ({ data }) => {
  const stats = React.useMemo(() => {
    const counts = {
      [ReviewResult.TRUE_FRAUD]: 0,
      [ReviewResult.SUSPECTED_FRAUD]: 0,
      [ReviewResult.ILLEGAL_BUSINESS]: 0,
      [ReviewResult.FALSE_POSITIVE]: 0,
    };
    
    data.filter(d => d.reviewStatus === '已复核').forEach(d => {
      const n = d.count || 1;
      if (d.reviewResult in counts) {
        counts[d.reviewResult as keyof typeof counts] += n;
      }
    });

    return [
      { name: '真实诈骗', value: counts[ReviewResult.TRUE_FRAUD], color: COLORS.FRAUD },
      { name: '疑似诈骗', value: counts[ReviewResult.SUSPECTED_FRAUD], color: COLORS.SUSPECT },
      { name: '业务违法', value: counts[ReviewResult.ILLEGAL_BUSINESS], color: COLORS.ILLEGAL },
      { name: '场景误判', value: counts[ReviewResult.FALSE_POSITIVE], color: COLORS.FALSE },
    ];
  }, [data]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{fill: '#f3f4f6'}}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
            {stats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskDistributionPie: React.FC<ChartProps> = ({ data }) => {
  const stats = React.useMemo(() => {
    let h = 0, m = 0, l = 0;
    data.forEach(d => {
      const n = d.count || 1;
      if (d.riskLevel === RiskLevel.HIGH) h += n;
      if (d.riskLevel === RiskLevel.MEDIUM) m += n;
      if (d.riskLevel === RiskLevel.LOW) l += n;
    });

    const total = h + m + l;
    const abnormalTotal = h + m;
    const safetyRate = total > 0 ? (l / total) * 100 : 0;
    
    // Only show High and Medium in Pie to avoid Low risk dominating the chart
    const pieData = [
      { name: '高风险', value: h, color: COLORS.HIGH },
      { name: '中风险', value: m, color: COLORS.MEDIUM },
    ].filter(item => item.value > 0);

    return { total, h, m, l, safetyRate, pieData, abnormalTotal };
  }, [data]);

  return (
    <div className="h-[300px] w-full flex flex-col">
      {/* 1. Safety Level Bar (Macro View) */}
      <div className="mb-6 px-2">
        <div className="flex justify-between items-end mb-2">
           <span className="text-sm font-medium text-gray-500">平台安全水位</span>
           <span className="text-sm font-bold text-emerald-600">{stats.safetyRate.toFixed(2)}% <span className="text-xs font-normal text-gray-400">正常业务</span></span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
           {/* Low Risk (Safety) Part */}
           <div 
             className="h-full bg-emerald-400" 
             style={{ width: `${stats.safetyRate}%` }} 
           />
           {/* High/Med Risk Part */}
           <div 
             className="h-full bg-red-400" 
             style={{ width: `${100 - stats.safetyRate}%` }} 
           />
        </div>
      </div>

      {/* 2. Risk Composition Pie (Micro View - Only Abnormal) */}
      <div className="flex-1 relative">
         <div className="absolute top-0 left-0 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded">
            仅展示异常分布
         </div>
         {stats.abnormalTotal > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} 
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} 条`, '检测量']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
               <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-emerald-400">100%</span>
               </div>
               <p className="text-sm">暂无中高风险异常</p>
            </div>
         )}
      </div>
    </div>
  );
};
