import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export const checkTrialOrSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        trialEnd: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has active subscription
    if (user.subscriptionStatus === 'active') {
      return next();
    }

    // Check if trial is still valid
    if (user.trialEnd && new Date() < user.trialEnd) {
      return next();
    }

    // Trial expired and no active subscription
    return res.status(402).json({
      success: false,
      error: 'Trial expired. Please subscribe to continue.',
      code: 'TRIAL_EXPIRED',
      trialEnd: user.trialEnd,
    });
  } catch (error) {
    console.error('Trial check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify trial status',
    });
  }
};

export const getTrialStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialStart: true,
      trialEnd: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return null;
  }

  const now = new Date();
  const isTrialActive = user.trialEnd ? now < user.trialEnd : false;
  const hasActiveSubscription = user.subscriptionStatus === 'active';

  let hoursRemaining = 0;
  if (user.trialEnd && isTrialActive) {
    const msRemaining = user.trialEnd.getTime() - now.getTime();
    hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
  }

  return {
    isActive: isTrialActive || hasActiveSubscription,
    startDate: user.trialStart,
    endDate: user.trialEnd,
    hoursRemaining,
    hasSubscription: hasActiveSubscription,
  };
};
