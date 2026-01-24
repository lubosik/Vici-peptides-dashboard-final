-- Migration: Create ingestion_audit table
-- Description: Stores raw inbound payloads from Make.com for debugging and idempotency
-- Source: Not from CSV; created for ingestion flow

CREATE TABLE IF NOT EXISTS ingestion_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  payload_hash TEXT UNIQUE NOT NULL,
  payload_json JSONB NOT NULL,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  order_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  CONSTRAINT fk_ingestion_audit_order_number 
    FOREIGN KEY (order_number) 
    REFERENCES orders(order_number) 
    ON DELETE SET NULL
);

-- Indexes for ingestion_audit table
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_payload_hash ON ingestion_audit(payload_hash);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_order_number ON ingestion_audit(order_number);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_ingested_at ON ingestion_audit(ingested_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_status ON ingestion_audit(status);

-- Comments
COMMENT ON TABLE ingestion_audit IS 'Stores raw inbound payloads from Make.com for debugging and idempotency';
COMMENT ON COLUMN ingestion_audit.payload_hash IS 'SHA-256 hash of payload JSON (for idempotency)';
COMMENT ON COLUMN ingestion_audit.payload_json IS 'Raw payload from Make.com';
COMMENT ON COLUMN ingestion_audit.status IS 'Status: pending, success, or error';
