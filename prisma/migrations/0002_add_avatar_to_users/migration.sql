-- Migration: Add avatar field to User
-- Date: 2025-01-09

ALTER TABLE "users" ADD COLUMN "avatar" TEXT;