-- Project share snapshots (cross-device read-only links, 30-day TTL)

CREATE TABLE "ProjectShare" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT,
    "files" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectShare_slug_key" ON "ProjectShare"("slug");
CREATE INDEX "ProjectShare_userId_createdAt_idx" ON "ProjectShare"("userId", "createdAt");
CREATE INDEX "ProjectShare_expiresAt_idx" ON "ProjectShare"("expiresAt");

ALTER TABLE "ProjectShare" ADD CONSTRAINT "ProjectShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
