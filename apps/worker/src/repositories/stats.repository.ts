import { prisma } from '@coffer/database';

export const createSnapshot = async (input: {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  netBurn: number;
  runwayDays: number | null;
  cashZeroAt: Date | null;
}): Promise<void> => {
  await prisma.statsSnapshot.create({
    data: {
      userId: input.userId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalBalance: input.totalBalance.toFixed(2),
      monthlyInflow: input.monthlyInflow.toFixed(2),
      monthlyOutflow: input.monthlyOutflow.toFixed(2),
      netBurn: input.netBurn.toFixed(2),
      runwayDays: input.runwayDays,
      cashZeroAt: input.cashZeroAt,
    },
  });
};
