export type RunwayPoint = {
  date: string;
  balance: string;
};

export type StatsResponse = {
  currency: string;
  totalBalance: string;
  monthlyInflow: string;
  monthlyOutflow: string;
  inflowChangePercent: number | null;
  outflowChangePercent: number | null;
  netBurn: string;
  runwayDays: number | null;
  runwayLabel: string;
  cashZeroAt: string | null;
  periodStart: string;
  periodEnd: string;
  computedAt: string | null;
  projection: RunwayPoint[];
};
