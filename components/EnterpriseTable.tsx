import React, { useState, useMemo } from 'react';
import { RiskRecord, RiskLevel, ReviewResult, ReviewStatus } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

interface EnterpriseTableProps {
  data: RiskRecord[];
}

type SortKey = 'high' | 'medium' | 'low' | 'trueFraud' | 'suspected' | 'illegal' | 'falsePositive';
type SortDirection = 'asc' | 'desc';

interface EnterpriseStat {
  id: string;
  name: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  trueFraud: number;
  suspected: number;
  illegal: number;
  falsePositive: number;
}

const EnterpriseTable: React.FC<EnterpriseTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: 'high',
    direction: 'desc'
  });

  // 1. Aggregate data by Enterprise
  const rawStats = useMemo(() => {
    const map = new Map<string, EnterpriseStat>();
    
    data.forEach(record => {
      const count = record.count || 1;
      
      if (!map.has(record.enterpriseId)) {
        map.set(record.enterpriseId, {
          id: record.enterpriseId,
          name: record.enterpriseName,
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          trueFraud: 0,
          suspected: 0,
          illegal: 0,
          falsePositive: 0
        });
      }
      
      const stats = map.get(record.enterpriseId)!;
      stats.total += count;
      if (record.riskLevel === RiskLevel.HIGH) stats.high += count;
      if (record.riskLevel === RiskLevel.MEDIUM) stats.medium += count;
      if (record.riskLevel === RiskLevel.LOW) stats.low += count;
      
      if (record.reviewStatus === ReviewStatus.REVIEWED) {
        if (record.reviewResult === ReviewResult.TRUE_FRAUD) stats.trueFraud += count;
        if (record.reviewResult === ReviewResult.SUSPECTED_FRAUD) stats.suspected += count;
        if (record.reviewResult === ReviewResult.ILLEGAL_BUSINESS) stats.illegal += count;
        if (record.reviewResult === ReviewResult.FALSE_POSITIVE) stats.falsePositive += count;
      }
    });
    
    return Array.from(map.values());
  }, [data]);

  // 2. Filter & Sort
  const processedData = useMemo(() => {
    let result = rawStats;

    // Filter
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerTerm) || 
        item.id.includes(lowerTerm)
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        
        if (sortConfig.direction === 'asc') {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
    }

    return result;
  }, [rawStats, searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const handleExport = () => {
    if (processedData.length === 0) return;

    const headers = [
      '企业名称', 
      '企业ID', 
      '高风险', 
      '中风险', 
      '低风险', 
      '真实诈骗', 
      '疑似诈骗', 
      '业务违法', 
      '场景误判'
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [
      headers.join(','),
      ...processedData.map(row => {
        return `${row.name},${row.id},${row.high},${row.medium},${row.low},${row.trueFraud},${row.suspected},${row.illegal},${row.falsePositive}`;
      })
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `企业风控明细报表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHeader = (label: string, key: SortKey, colorClass: string = 'text-gray-500', bgClass: string = '') => {
    const isActive = sortConfig.key === key;
    return (
      <th 
        scope="col" 
        className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-gray-100 ${colorClass} ${bgClass}`}
        onClick={() => handleSort(key)}
      >
        <div className="flex items-center justify-end space-x-1">
          <span>{label}</span>
          {isActive ? (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">企业风控明细</h3>
          <p className="text-sm text-gray-500">各企业风险与复核结果详情</p>
        </div>

        <div className="flex items-center gap-3">
           {/* Search Bar */}
           <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
               placeholder="搜索企业名称或ID..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Export Button */}
           <button
             onClick={handleExport}
             className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
           >
             <Download className="w-4 h-4" />
             导出明细
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企业信息</th>
              {renderHeader('高风险', 'high', 'text-gray-900')}
              {renderHeader('中风险', 'medium')}
              {renderHeader('低风险', 'low')}
              {renderHeader('真实诈骗', 'trueFraud', 'text-red-600', 'bg-red-50/50')}
              {renderHeader('疑似诈骗', 'suspected', 'text-orange-600', 'bg-orange-50/50')}
              {renderHeader('业务违法', 'illegal', 'text-violet-600')}
              {renderHeader('场景误判', 'falsePositive', 'text-emerald-600')}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.length > 0 ? (
              processedData.map((ent) => (
                <tr key={ent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{ent.name}</span>
                      <span className="text-xs text-gray-500">ID: {ent.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {ent.high.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    {ent.medium.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {ent.low.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-red-50/30">
                    {ent.trueFraud.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600 bg-orange-50/30">
                    {ent.suspected.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-violet-600">
                    {ent.illegal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-emerald-600">
                    {ent.falsePositive.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  没有找到匹配的企业数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnterpriseTable;