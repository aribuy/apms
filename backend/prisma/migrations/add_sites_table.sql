-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "site_id" VARCHAR(100) NOT NULL,
    "site_name" VARCHAR(255) NOT NULL,
    "site_type" VARCHAR(50) DEFAULT 'MW',
    "region" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "ne_latitude" DECIMAL(10,8),
    "ne_longitude" DECIMAL(11,8),
    "fe_latitude" DECIMAL(10,8),
    "fe_longitude" DECIMAL(11,8),
    "status" VARCHAR(50) DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_site_id_key" ON "sites"("site_id");
CREATE INDEX "sites_region_idx" ON "sites"("region");
CREATE INDEX "sites_status_idx" ON "sites"("status");