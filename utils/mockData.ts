import { RiskRecord, RiskLevel, ReviewResult, ReviewStatus, DashboardStats } from '../types';

const ENTERPRISES = [
  { id: '7501556', name: '快手中间号 (Migration)' },
  { id: '7122191', name: '火山-抖音来客呼叫' },
  { id: '7100725', name: '火山Sopen' },
  { id: '7882910', name: '某电商客服中心' },
  { id: '7991022', name: '信贷催收外包A' },
  { id: '8829101', name: '某知名保险电销' },
  { id: '6629122', name: '线上教育回访' },
  { id: '9921001', name: '某银行信用卡中心' },
  { id: '9921002', name: '消费金融催收B' },
];

const FRAUD_TYPES = [
  '仿冒身份-公检法',
  '涉嫌违法违规',
  '贷款推销',
  '虚假理财',
  '杀猪盘',
  '正常业务'
];

const RISK_POINTS = [
  '座席自称警察',
  '讨论期权股票',
  '销售可疑软件',
  '提及验证码',
  '要求转账',
  '高频呼叫',
  '辱骂客户',
  '诱导投诉'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate data for the last N days
// Strategy: 
// 1. Generate individual records for High/Medium risk (approx 300/day total)
// 2. Generate "Batched" records for Low risk (approx 60,000/day total)
export const generateMockData = (daysToGenerate: number = 30): RiskRecord[] => {
  const data: RiskRecord[] = [];
  const now = new Date();
  
  // Daily targets
  const DAILY_TOTAL_TARGET = 60000;
  const DAILY_HIGH_RISK_TARGET = 80 + Math.random() * 40; // ~100
  const DAILY_MEDIUM_RISK_TARGET = 180 + Math.random() * 60; // ~200
  // The rest are low risk

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() - i);
    
    // 1. Generate High Risk (Individual records)
    const highCount = Math.floor(DAILY_HIGH_RISK_TARGET * (0.8 + Math.random() * 0.4));
    for (let j = 0; j < highCount; j++) {
      data.push(createSingleRecord(currentDate, RiskLevel.HIGH));
    }

    // 2. Generate Medium Risk (Individual records)
    const medCount = Math.floor(DAILY_MEDIUM_RISK_TARGET * (0.8 + Math.random() * 0.4));
    for (let j = 0; j < medCount; j++) {
      data.push(createSingleRecord(currentDate, RiskLevel.MEDIUM));
    }

    // 3. Generate Low Risk (Batched records)
    // We want ~59700 low risk items. We'll create about 50 batches per day to distribute among enterprises
    const lowTotal = Math.floor((DAILY_TOTAL_TARGET - highCount - medCount) * (0.9 + Math.random() * 0.2));
    const batchCount = 50;
    const batchSize = Math.floor(lowTotal / batchCount);

    for (let k = 0; k < batchCount; k++) {
      data.push(createBatchRecord(currentDate, RiskLevel.LOW, batchSize));
    }
  }
  
  return data.sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime());
};

// Helper to create a single detailed record
function createSingleRecord(dateBase: Date, level: RiskLevel): RiskRecord {
  // Random time within that day (09:00 - 20:00)
  const callTime = new Date(dateBase);
  callTime.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));

  const ent = randomItem(ENTERPRISES);
  
  // Review Logic
  let isReviewed = false;
  if (level === RiskLevel.HIGH) isReviewed = Math.random() > 0.05; // 95% reviewed
  else if (level === RiskLevel.MEDIUM) isReviewed = Math.random() > 0.3; // 70% reviewed
  else isReviewed = Math.random() > 0.99; // 1% spot check
  
  let result = ReviewResult.PENDING;
  if (isReviewed) {
    const r = Math.random();
    if (level === RiskLevel.HIGH) {
      if (r > 0.4) result = ReviewResult.TRUE_FRAUD;
      else if (r > 0.15) result = ReviewResult.SUSPECTED_FRAUD;
      else if (r > 0.05) result = ReviewResult.ILLEGAL_BUSINESS;
      else result = ReviewResult.FALSE_POSITIVE;
    } else if (level === RiskLevel.MEDIUM) {
      if (r > 0.6) result = ReviewResult.FALSE_POSITIVE;
      else if (r > 0.3) result = ReviewResult.SUSPECTED_FRAUD;
      else if (r > 0.1) result = ReviewResult.ILLEGAL_BUSINESS;
      else result = ReviewResult.TRUE_FRAUD;
    } else {
      result = ReviewResult.FALSE_POSITIVE;
    }
  }

  return {
    id: `REC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    enterpriseId: ent.id,
    enterpriseName: ent.name,
    customerNumber: `1${Math.floor(Math.random() * 900) + 100}****${Math.floor(Math.random() * 9000) + 1000}`,
    callTime: callTime.toISOString(),
    duration: Math.floor(Math.random() * 600) + 30,
    riskLevel: level,
    fraudType: level === RiskLevel.LOW ? '正常业务' : randomItem(FRAUD_TYPES),
    riskPoints: level === RiskLevel.LOW ? [] : [randomItem(RISK_POINTS)],
    reviewStatus: isReviewed ? ReviewStatus.REVIEWED : ReviewStatus.PENDING,
    reviewResult: result,
    reviewer: isReviewed ? ['renyl', 'zhangzeng', 'fangsy'][Math.floor(Math.random() * 3)] : undefined,
    count: 1
  };
}

// Helper to create a batch record (mostly for Low Risk)
function createBatchRecord(dateBase: Date, level: RiskLevel, count: number): RiskRecord {
   const callTime = new Date(dateBase);
   callTime.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
   const ent = randomItem(ENTERPRISES);

   return {
    id: `BATCH-${Math.random().toString(36).substr(2, 9)}`,
    enterpriseId: ent.id,
    enterpriseName: ent.name,
    customerNumber: 'BATCH_DATA',
    callTime: callTime.toISOString(),
    duration: 0,
    riskLevel: level,
    fraudType: '正常业务',
    riskPoints: [],
    reviewStatus: ReviewStatus.PENDING,
    reviewResult: ReviewResult.PENDING,
    count: count
   };
}

export const calculateStats = (data: RiskRecord[]): DashboardStats => {
  // We must sum up 'count' properties
  let total = 0;
  let highRisk = 0;
  let medRisk = 0;
  let lowRisk = 0;
  let highRiskReviewed = 0;
  let mediumRiskReviewed = 0;
  let reviewedTotal = 0;
  
  let trueFraud = 0;
  let suspFraud = 0;
  let illegal = 0;
  let falsePos = 0;

  for (const d of data) {
    const n = d.count || 1;
    total += n;
    
    if (d.riskLevel === RiskLevel.HIGH) highRisk += n;
    else if (d.riskLevel === RiskLevel.MEDIUM) medRisk += n;
    else if (d.riskLevel === RiskLevel.LOW) lowRisk += n;
    
    if (d.reviewStatus === ReviewStatus.REVIEWED) {
      // Assuming batch records are NOT reviewed for now (simplification)
      // If a batch was reviewed, we would add 'n', but our generation logic only reviews single records
      reviewedTotal += n;
      
      if (d.riskLevel === RiskLevel.HIGH) highRiskReviewed += n;
      else if (d.riskLevel === RiskLevel.MEDIUM) mediumRiskReviewed += n;

      if (d.reviewResult === ReviewResult.TRUE_FRAUD) trueFraud += n;
      else if (d.reviewResult === ReviewResult.SUSPECTED_FRAUD) suspFraud += n;
      else if (d.reviewResult === ReviewResult.ILLEGAL_BUSINESS) illegal += n;
      else if (d.reviewResult === ReviewResult.FALSE_POSITIVE) falsePos += n;
    }
  }

  const validDetections = trueFraud + suspFraud + illegal;
  
  // Review Completion Rate base: High Risk + Medium Risk
  const reviewTargetCount = highRisk + medRisk;
  const reviewedTargetCount = highRiskReviewed + mediumRiskReviewed;

  return {
    totalDetections: total,
    highRiskCount: highRisk,
    mediumRiskCount: medRisk,
    lowRiskCount: lowRisk,
    highRiskReviewedCount: highRiskReviewed,
    mediumRiskReviewedCount: mediumRiskReviewed,
    reviewedCount: reviewedTotal,
    reviewCompletionRate: reviewTargetCount > 0 ? (reviewedTargetCount / reviewTargetCount) * 100 : 0,
    highRiskRate: total > 0 ? (highRisk / total) * 100 : 0,
    trueFraudCount: trueFraud,
    suspectedFraudCount: suspFraud,
    illegalBusinessCount: illegal,
    falsePositiveCount: falsePos,
    accuracyRate: reviewedTotal > 0 ? (validDetections / reviewedTotal) * 100 : 0
  };
};
