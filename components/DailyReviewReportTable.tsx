import React, { useMemo } from 'react';
import { RiskRecord, RiskLevel, ReviewResult, ReviewStatus } from '../types';
import { ArrowDownCircle, Download } from 'lucide-react';

interface DailyReviewReportTableProps {
  data: RiskRecord[];
}

const DailyReviewReportTable: React.FC<DailyReviewReportTableProps> = ({ data }) => {
  // Aggregate data by date
  const dailyData = useMemo(() => {
    const map = new Map<string, { 
      date: string; 
      timestamp: number;
      midHighDetectionCount: number; 
      reviewedTotal: number;
      trueFraud: number;
      suspected: number;
      illegal: number;
      falsePositive: number;
    }>();

    data.forEach(record => {
      const dateObj = new Date(record.callTime);
      const dateKey = dateObj.toLocaleDateString('zh-CN');
      const count = record.count || 1;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, { 
          date: dateKey, 
          timestamp: new Date(dateObj.toDateString()).getTime(),
          midHighDetectionCount: 0,
          reviewedTotal: 0,
          trueFraud: 0,
          suspected: 0,
          illegal: 0,
          falsePositive: 0
        });
      }

      const stats = map.get(dateKey)!;

      // 1. Count Mid-High Risk Detections (Regardless of review status)
      if (record.riskLevel === RiskLevel.HIGH || record.riskLevel === RiskLevel.MEDIUM) {
        stats.midHighDetectionCount += count;
      }

      // 2. Count Review Results (Only if reviewed)
      if (record.reviewStatus === ReviewStatus.REVIEWED) {
        stats.reviewedTotal += count;
        
        switch (record.reviewResult) {
          case ReviewResult.TRUE_FRAUD:
            stats.trueFraud += count;
            break;
          case ReviewResult.SUSPECTED_FRAUD:
            stats.suspected += count;
            break;
          case ReviewResult.ILLEGAL_BUSINESS:
            stats.illegal += count;
            break;
          case ReviewResult.FALSE_POSITIVE:
            stats.falsePositive += count;
            break;
        }
      }
    });

    // Sort by date descending
    return Array.from(map.values())
      .filter(row => row.reviewedTotal > 0 || row.midHighDetectionCount > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  const handleExport = () => {
    if (dailyData.length === 0) return;

    const headers = [
      '日期', 
      '中高风险检测数', 
      '已复核总数', 
      '已复核占比', 
      '真实诈骗', 
      '疑似诈骗', 
      '业务违法', 
      '场景误判'
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [
      headers.join(','),
      ...dailyData.map(row => {
        const reviewRate = row.midHighDetectionCount > 0 
          ? ((row.reviewedTotal / row.midHighDetectionCount) * 100).toFixed(2) + '%' 
          : '0.00%';
          
        return `${row.date},${row.midHighDetectionCount},${row.reviewedTotal},${reviewRate},${row.trueFraud},${row.suspected},${row.illegal},${row.falsePositive}`;
      })
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `每日复核结果报表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (dailyData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>当前筛选范围内无相关数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Export */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-gray-900">每日复核结果报表</h3>
           <p className="text-sm text-gray-500">按日期统计各复核结果的数量</p>
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
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">中高风险检测数</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">已复核总数</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-emerald-600 uppercase tracking-wider">已复核占比</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider bg-red-50/50">真实诈骗</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-50/50">疑似诈骗</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-violet-600 uppercase tracking-wider">业务违法</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-emerald-600 uppercase tracking-wider">场景误判</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dailyData.map((row) => {
              const reviewRate = row.midHighDetectionCount > 0 
                ? (row.reviewedTotal / row.midHighDetectionCount) * 100 
                : 0;
              
              return (
                <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold bg-gray-50/50">
                    {row.midHighDetectionCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                    {row.reviewedTotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-emerald-700 font-medium">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${reviewRate >= 90 ? 'bg-emerald-100 text-emerald-800' : reviewRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                      {reviewRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium bg-red-50/30">
                    {row.trueFraud}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600 font-medium bg-orange-50/30">
                    {row.suspected}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-violet-600 font-medium">
                    {row.illegal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-emerald-600 font-medium">
                     {row.falsePositive}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <span>共 {dailyData.length} 天的复核数据</span>
         </div>
         <span className="flex items-center"><ArrowDownCircle className="w-3 h-3 mr-1"/> 按日期倒序排列</span>
      </div>
    </div>
  );
};

export default DailyReviewReportTable;