import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
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
  ILLEGAL: '#8b5cf6' // Violet-500
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
      
      // d.riskLevel is now localized (e.g. "高风险")
      if (entry[d.riskLevel] !== undefined) {
        entry[d.riskLevel] += n;
      }
    });

    return Array.from(map.values()).reverse(); // Should be chronological
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
    return [
      { name: '高风险', value: h, color: COLORS.HIGH },
      { name: '中风险', value: m, color: COLORS.MEDIUM },
      { name: '低风险', value: l, color: COLORS.LOW },
    ];
  }, [data]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={stats}
            cx="50%"
            cy="50%"
            innerRadius={50} 
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {stats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
