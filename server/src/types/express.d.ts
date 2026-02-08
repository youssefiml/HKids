import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "admin" | "editor";
      };
      parent?: {
        id: string;
        email: string;
      };
      readerContext?: {
        isPaired: boolean;
        deviceId: string;
        deviceMongoId?: string;
        parentId?: string;
        childProfileId?: string;
        childName?: string;
        childAge?: number;
        dailyLimitMinutes?: number;
        usedMinutes?: number;
        remainingMinutes?: number;
        isLocked?: boolean;
      };
    }
  }
}

export {};
