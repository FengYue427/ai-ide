-- Paddle Billing external ids on Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paddleCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paddleSubscriptionId" TEXT;
