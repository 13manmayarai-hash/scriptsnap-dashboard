-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;

-- Create subscriptions tracking table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create api_usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scripts_generated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, date);
