
export enum RiskLevel {
  HIGH = '高风险',
  MEDIUM = '中风险',
  LOW = '低风险',
  NORMAL = '正常'
}

export enum ReviewResult {
  TRUE_FRAUD = '真实诈骗',
  SUSPECTED_FRAUD = '疑似诈骗',
  ILLEGAL_BUSINESS = '业务违法',
  FALSE_POSITIVE = '场景误判',
  PENDING = '待复核'
}

export enum ReviewStatus {
  REVIEWED = '已复核',
  PENDING = '待复核'
}

export interface RiskRecord {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  customerNumber: string;
  callTime: string; // ISO Date string
  duration: number;
  riskLevel: RiskLevel;
  fraudType: string;
  riskPoints: string[];
  reviewStatus: ReviewStatus;
  reviewResult: ReviewResult;
  reviewer?: string;
  /** 
   * For performance simulation: 
   * A single record can represent multiple calls (e.g. for low risk bulk data) 
   * Default is 1 if undefined.
   */
  count?: number; 
}

export interface DashboardStats {
  totalDetections: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  
  // Review Stats per Risk Level
  highRiskReviewedCount: number;
  mediumRiskReviewedCount: number;
  
  reviewedCount: number;
  reviewCompletionRate: number;
  highRiskRate: number;
  
  // Review Outcomes
  trueFraudCount: number;
  suspectedFraudCount: number;
  illegalBusinessCount: number;
  falsePositiveCount: number;
  accuracyRate: number; // (True + Suspected + Illegal) / Reviewed
}

export type TimeFilter = 'today' | 'yesterday' | '7days' | '30days' | 'year' | 'custom';
export type TabView = 'overview' | 'review' | 'enterprise';
