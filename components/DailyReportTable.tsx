import React, { useMemo, useState } from 'react';
import { RiskRecord, RiskLevel } from '../types';
import { ArrowDownCircle, BarChart2, X, Building2, Download } from 'lucide-react';

interface DailyReportTableProps {
  data: RiskRecord[];
}

interface DailyAggregatedData {
  date: string;
  timestamp: number;
  total: number;
  high: number;
  medium: number;
  low: number;
}

const DailyReportTable: React.FC<DailyReportTableProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 1. Aggregate data by date for the main table
  const dailyData = useMemo(() => {
    const map = new Map<string, DailyAggregatedData>();

    data.forEach(record => {
      const dateObj = new Date(record.callTime);
      const dateKey = dateObj.toLocaleDateString('zh-CN');
      const count = record.count || 1;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, { 
          date: dateKey, 
          timestamp: new Date(dateObj.toDateString()).getTime(),
          total: 0, 
          high: 0, 
          medium: 0, 
          low: 0 
        });
      }

      const stats = map.get(dateKey)!;
      stats.total += count;
      if (record.riskLevel === RiskLevel.HIGH) stats.high += count;
      else if (record.riskLevel === RiskLevel.MEDIUM) stats.medium += count;
      else if (record.riskLevel === RiskLevel.LOW) stats.low += count;
    });

    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  // 2. Calculate Drill-down data (Enterprise ranking for selected date)
  const drillDownData = useMemo(() => {
    if (!selectedDate) return null;

    // Filter data for the specific date AND only High/Medium risks
    // Note: High/Medium risks are generated as single records (count=1), so summing count is safe/correct
    const targetRecords = data.filter(d => {
      const dDate = new Date(d.callTime).toLocaleDateString('zh-CN');
      return dDate === selectedDate && (d.riskLevel === RiskLevel.HIGH || d.riskLevel === RiskLevel.MEDIUM);
    });

    let totalMidHighForDay = 0;
    
    // Group by Enterprise
    const enterpriseMap = new Map<string, { id: string; name: string; count: number }>();
    
    targetRecords.forEach(r => {
      const count = r.count || 1;
      totalMidHighForDay += count;

      if (!enterpriseMap.has(r.enterpriseId)) {
        enterpriseMap.set(r.enterpriseId, { id: r.enterpriseId, name: r.enterpriseName, count: 0 });
      }
      enterpriseMap.get(r.enterpriseId)!.count += count;
    });

    // Convert to array and sort by count desc
    const list = Array.from(enterpriseMap.values())
      .map(item => ({
        ...item,
        percentage: totalMidHighForDay > 0 ? (item.count / totalMidHighForDay) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return { total: totalMidHighForDay, list };
  }, [selectedDate, data]);


  // Helper to close modal
  const closeModal = () => setSelectedDate(null);

  // Export CSV Handler
  const handleExport = () => {
    if (dailyData.length === 0) return;

    const headers = ['日期', '总检测数', '高风险数', '中风险数', '中高风险占比', '低风险数'];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [
      headers.join(','),
      ...dailyData.map(row => {
        const midHighCount = row.high + row.medium;
        const midHighRate = row.total > 0 ? ((midHighCount / row.total) * 100).toFixed(2) + '%' : '0.00%';
        return `${row.date},${row.total},${row.high},${row.medium},${midHighRate},${row.low}`;
      })
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `每日风险检测报表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (dailyData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>当前筛选范围内无数据</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with Export Button */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">每日风险检测报表</h3>
            <p className="text-sm text-gray-500">按日期统计检测量与风险分布</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">日期</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">总检测数</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">高风险数</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-amber-600 uppercase tracking-wider">中风险数</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    中高风险占比
                    <span className="text-[10px] text-gray-400 font-normal">(点击查看详情)</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">低风险数</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyData.map((row) => {
                const midHighCount = row.high + row.medium;
                const midHighRate = row.total > 0 ? (midHighCount / row.total) * 100 : 0;
                
                let badgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
                if (midHighRate > 40) badgeClass = 'bg-red-50 text-red-700 border-red-200';
                else if (midHighRate > 20) badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                else if (midHighRate > 10) badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                else if (midHighRate > 0) badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                      {row.high.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-amber-600 font-medium">
                      {row.medium.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => setSelectedDate(row.date)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${badgeClass}`}
                        title="点击查看当天的企业风险排名"
                      >
                        {midHighRate.toFixed(1)}%
                        <BarChart2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {row.low.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <span>共 {dailyData.length} 天的数据</span>
           </div>
           <span className="flex items-center"><ArrowDownCircle className="w-3 h-3 mr-1"/> 按日期倒序排列</span>
        </div>
      </div>

      {/* Drill Down Modal */}
      {selectedDate && drillDownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <Building2 className="w-5 h-5 text-blue-600" />
                   中高风险企业分布
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">{selectedDate}</span> 
                  <span className="mx-2">•</span>
                  共 <span className="text-red-600 font-bold">{drillDownData.total}</span> 条中高风险检测
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/30">
              {drillDownData.list.length > 0 ? (
                <div className="space-y-3">
                  {drillDownData.list.map((item, index) => (
                    <div key={item.id} className="relative flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group overflow-hidden">
                       {/* Background Bar for visualization */}
                       <div 
                         className="absolute left-0 top-0 bottom-0 bg-blue-50/60 transition-all duration-500"
                         style={{ width: `${item.percentage}%` }}
                       />
                       
                       <div className="relative flex items-center gap-4 z-10">
                         <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border ${
                           index === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                           index === 1 ? 'bg-gray-100 text-gray-700 border-gray-300' :
                           index === 2 ? 'bg-orange-50 text-orange-800 border-orange-200' :
                           'bg-white text-gray-500 border-gray-200'
                         }`}>
                           {index + 1}
                         </div>
                         <div>
                           <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                           <div className="text-xs text-gray-500">ID: {item.id}</div>
                         </div>
                       </div>

                       <div className="relative z-10 text-right">
                         <div className="text-sm font-bold text-gray-900">{item.count} <span className="text-xs font-normal text-gray-400">条</span></div>
                         <div className="text-xs text-blue-600 font-medium">{item.percentage.toFixed(1)}%</div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  当天无中高风险数据
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-white text-xs text-gray-400 text-right">
               百分比表示该企业占当天全平台中高风险总量的比例
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyReportTable;