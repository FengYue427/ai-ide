-- CreateTable
CREATE TABLE "PluginPublishReview" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginPublishReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PluginPublishReview_reviewId_key" ON "PluginPublishReview"("reviewId");

-- CreateIndex
CREATE INDEX "PluginPublishReview_userId_submittedAt_idx" ON "PluginPublishReview"("userId", "submittedAt");

-- AddForeignKey
ALTER TABLE "PluginPublishReview" ADD CONSTRAINT "PluginPublishReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
