-- v1.1.3 Collaboration M1 (manual migration — run with prisma migrate deploy)

CREATE TABLE "CollaborationRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollaborationMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CollaborationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollaborationRoom_code_key" ON "CollaborationRoom"("code");
CREATE INDEX "CollaborationRoom_hostId_idx" ON "CollaborationRoom"("hostId");
CREATE UNIQUE INDEX "CollaborationMember_roomId_userId_key" ON "CollaborationMember"("roomId", "userId");
CREATE INDEX "CollaborationMember_userId_idx" ON "CollaborationMember"("userId");

ALTER TABLE "CollaborationRoom" ADD CONSTRAINT "CollaborationRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CollaborationRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
