-- AfriBridge enquiry database. Run once against your PostgreSQL database.
CREATE TABLE IF NOT EXISTS enquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  company VARCHAR(160),
  interest VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE CHECK (consent = TRUE),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','replied','closed','spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
