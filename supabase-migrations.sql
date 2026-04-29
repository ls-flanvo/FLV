-- ============================================
-- Flanvo — SQL migrazioni da eseguire su Supabase
-- Incolla nel SQL Editor di Supabase Dashboard
-- Sicuro da eseguire più volte (IF NOT EXISTS)
-- ============================================

-- 1. Colonne aggiunte al model User
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- 2. Colonne aggiunte al model Driver
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS "homeAirport" TEXT NOT NULL DEFAULT 'CTA';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- 3. Colonne aggiunte al model RideGroup (flight monitoring + meeting)
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "arrivalAirport" TEXT NOT NULL DEFAULT 'CTA';
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "flightStatus" TEXT DEFAULT 'scheduled';
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "flightActualLanding" TIMESTAMPTZ;
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "delayNotifiedMins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "lastFlightCheck" TIMESTAMPTZ;
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "meetingTime" TIMESTAMPTZ;
ALTER TABLE ride_groups ADD COLUMN IF NOT EXISTS "meetingPoint" TEXT;

-- 4. Tabella notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications ("userId", read);

-- 5. Tabella push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions ("userId");

-- 6. Tabella system_config (usata dall'admin config page)
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabella insurance_pool
CREATE TABLE IF NOT EXISTS insurance_pool (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  month TIMESTAMPTZ NOT NULL UNIQUE,
  collected FLOAT NOT NULL DEFAULT 0,
  used FLOAT NOT NULL DEFAULT 0,
  balance FLOAT NOT NULL DEFAULT 0,
  "driverCompensation" FLOAT NOT NULL DEFAULT 0,
  "refundLosses" FLOAT NOT NULL DEFAULT 0,
  operational FLOAT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
