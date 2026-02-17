import { Types } from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { ChildProfile } from "../modules/children/childProfile.model";
import { Device } from "../modules/devices/device.model";
import { validateObjectId } from "../utils/validators.util";

const WEEKLY_WINDOW_DAYS = 7;

type DigestTrend = "up" | "down" | "steady";

interface DailyDigestItem {
  date: string;
  minutes: number;
}

interface ChildWeeklyDigest {
  childProfileId: string;
  childName: string;
  age: number;
  dailyLimitMinutes: number;
  totalMinutes: number;
  activeDays: number;
  averageMinutesPerActiveDay: number;
  consistencyScore: number;
  trend: DigestTrend;
  recommendation: string;
  dailyBreakdown: DailyDigestItem[];
}

const getDateKeyUtc = (date = new Date()) => date.toISOString().slice(0, 10);

const getDateDaysAgoUtc = (daysAgo: number): Date => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
};

const getWeeklyDateKeys = (): string[] => {
  const keys: string[] = [];
  for (let day = WEEKLY_WINDOW_DAYS - 1; day >= 0; day -= 1) {
    keys.push(getDateKeyUtc(getDateDaysAgoUtc(day)));
  }
  return keys;
};

const toRoundedOneDecimal = (value: number): number => Math.round(value * 10) / 10;

const inferTrend = (dailyBreakdown: DailyDigestItem[]): DigestTrend => {
  if (dailyBreakdown.length < WEEKLY_WINDOW_DAYS) {
    return "steady";
  }

  const firstHalf = dailyBreakdown.slice(0, 3).reduce((sum, item) => sum + item.minutes, 0);
  const secondHalf = dailyBreakdown.slice(4).reduce((sum, item) => sum + item.minutes, 0);
  const difference = secondHalf - firstHalf;

  if (difference >= 12) {
    return "up";
  }
  if (difference <= -12) {
    return "down";
  }
  return "steady";
};

const buildChildRecommendation = (digest: {
  activeDays: number;
  dailyLimitMinutes: number;
  averageMinutesPerActiveDay: number;
  totalMinutes: number;
}): string => {
  if (digest.totalMinutes === 0) {
    return "Start with 8-10 minute reading blocks on three days this week.";
  }

  if (digest.activeDays <= 2) {
    return "Keep sessions short and aim for at least three reading days next week.";
  }

  if (digest.averageMinutesPerActiveDay >= digest.dailyLimitMinutes * 0.9) {
    return "Great consistency. Add one offline activity after reading to avoid over-screening.";
  }

  return "Keep the current pace and add a 1-minute parent check-in question after each session.";
};

const buildPortfolioNextStep = (totalMinutes: number, activeDays: number): string => {
  if (totalMinutes === 0) {
    return "Create a simple family routine: one short reading session after dinner on three weekdays.";
  }
  if (activeDays < 4) {
    return "Prioritize consistency over length: keep sessions brief but spread them across more days.";
  }
  return "Maintain the routine and end sessions with a quick offline reflection prompt.";
};

export const getParentWeeklyDigest = async (parentId: string, childProfileId?: string) => {
  if (childProfileId) {
    validateObjectId(childProfileId, "Child profile ID");
  }

  const parentObjectId = new Types.ObjectId(parentId);
  const childFilter = childProfileId ? { _id: new Types.ObjectId(childProfileId) } : {};
  const children = await ChildProfile.find({
    parent: parentObjectId,
    isActive: true,
    ...childFilter,
  }).sort({ name: 1 });

  if (childProfileId && children.length === 0) {
    throw new AppError("Child profile not found for this parent", 404);
  }

  const dateKeys = getWeeklyDateKeys();
  const dateSet = new Set(dateKeys);
  const usageByChild = new Map<string, Map<string, number>>();

  children.forEach((child) => {
    const dailyMap = new Map<string, number>();
    dateKeys.forEach((dateKey) => dailyMap.set(dateKey, 0));
    usageByChild.set(child._id.toString(), dailyMap);
  });

  const devices = await Device.find({ parent: parentObjectId }).select(
    "activeChildProfile dailyUsageDate dailyUsageMinutes usageHistory"
  );

  const addMinutes = (childId: string, dateKey: string, minutes: number) => {
    const dailyMap = usageByChild.get(childId);
    if (!dailyMap || !dateSet.has(dateKey) || minutes <= 0) {
      return;
    }
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + minutes);
  };

  devices.forEach((device: any) => {
    const usageHistory = Array.isArray(device.usageHistory) ? device.usageHistory : [];

    usageHistory.forEach((entry: any) => {
      const childId = typeof entry?.childProfileId === "string" ? entry.childProfileId : "";
      const dateKey = typeof entry?.date === "string" ? entry.date : "";
      const minutes = Number(entry?.minutes ?? 0);
      addMinutes(childId, dateKey, Math.max(Math.floor(minutes), 0));
    });

    const activeChildId = device.activeChildProfile?.toString();
    const deviceDateKey = typeof device.dailyUsageDate === "string" ? device.dailyUsageDate : "";
    const deviceMinutes = Math.max(Math.floor(Number(device.dailyUsageMinutes ?? 0)), 0);
    const alreadyTracked = usageHistory.some(
      (entry: any) => entry?.date === deviceDateKey && entry?.childProfileId === activeChildId
    );

    if (!alreadyTracked && activeChildId && deviceDateKey) {
      addMinutes(activeChildId, deviceDateKey, deviceMinutes);
    }
  });

  const childDigests: ChildWeeklyDigest[] = children.map((child) => {
    const childId = child._id.toString();
    const dailyMap = usageByChild.get(childId) ?? new Map<string, number>();
    const dailyBreakdown = dateKeys.map((dateKey) => ({
      date: dateKey,
      minutes: dailyMap.get(dateKey) ?? 0,
    }));

    const totalMinutes = dailyBreakdown.reduce((sum, item) => sum + item.minutes, 0);
    const activeDays = dailyBreakdown.filter((item) => item.minutes > 0).length;
    const averageMinutesPerActiveDay =
      activeDays > 0 ? toRoundedOneDecimal(totalMinutes / activeDays) : 0;
    const consistencyScore = Math.round((activeDays / WEEKLY_WINDOW_DAYS) * 100);

    return {
      childProfileId: childId,
      childName: child.name,
      age: child.age,
      dailyLimitMinutes: child.dailyReadingLimitMinutes,
      totalMinutes,
      activeDays,
      averageMinutesPerActiveDay,
      consistencyScore,
      trend: inferTrend(dailyBreakdown),
      recommendation: buildChildRecommendation({
        activeDays,
        dailyLimitMinutes: child.dailyReadingLimitMinutes,
        averageMinutesPerActiveDay,
        totalMinutes,
      }),
      dailyBreakdown,
    };
  });

  const totalMinutes = childDigests.reduce((sum, childDigest) => sum + childDigest.totalMinutes, 0);
  const readingDays = dateKeys.filter((dateKey) =>
    childDigests.some(
      (childDigest) => (childDigest.dailyBreakdown.find((item) => item.date === dateKey)?.minutes ?? 0) > 0
    )
  ).length;
  const topChild = childDigests.reduce<ChildWeeklyDigest | null>((currentTop, childDigest) => {
    if (!currentTop || childDigest.totalMinutes > currentTop.totalMinutes) {
      return childDigest;
    }
    return currentTop;
  }, null);

  return {
    generatedAt: new Date().toISOString(),
    period: {
      startDate: dateKeys[0],
      endDate: dateKeys[dateKeys.length - 1],
      days: WEEKLY_WINDOW_DAYS,
    },
    summary: {
      childrenCount: childDigests.length,
      totalMinutes,
      readingDays,
      topReader: topChild
        ? {
            childProfileId: topChild.childProfileId,
            childName: topChild.childName,
            totalMinutes: topChild.totalMinutes,
          }
        : null,
      nextStep: buildPortfolioNextStep(totalMinutes, readingDays),
    },
    children: childDigests,
  };
};
