-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "position" TEXT,
ADD COLUMN     "profession" TEXT;

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profession" TEXT,
    "position" TEXT,
    "photoUrl" TEXT,
    "workloadSection" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);
