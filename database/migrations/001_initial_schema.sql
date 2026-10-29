-- PostGIS Initialization Migration: 001_initial_schema.sql
-- Enables PostGIS extension and creates the core digital twin tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Study Areas
CREATE TABLE IF NOT EXISTS study_areas (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_latitude DECIMAL(10, 7) NOT NULL,
    center_longitude DECIMAL(10, 7) NOT NULL,
    radius_m DECIMAL(10, 2) NOT NULL,
    margin_m DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    boundary_geometry GEOMETRY(Polygon, 4326),
    source_name VARCHAR(128) NOT NULL,
    source_url VARCHAR(512),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Core Assets
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id) ON DELETE CASCADE,
    external_source_id VARCHAR(128),
    asset_type VARCHAR(32) NOT NULL, -- 'road', 'building', 'park', 'junction', 'amenity'
    name VARCHAR(255),
    description TEXT,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    condition_status VARCHAR(32) NOT NULL DEFAULT 'GOOD', -- 'EXCELLENT', 'GOOD', 'FAIR', 'DEGRADED', 'CRITICAL'
    criticality VARCHAR(32) NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'EMERGENCY_CORRIDOR'
    height_m DECIMAL(6, 2),
    height_source VARCHAR(64) NOT NULL DEFAULT 'default_visualization_fallback',
    height_is_estimated BOOLEAN NOT NULL DEFAULT TRUE,
    data_source VARCHAR(128) NOT NULL DEFAULT 'OpenStreetMap',
    source_url VARCHAR(512) DEFAULT 'https://www.openstreetmap.org/copyright',
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    is_margin BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_geometry ON assets USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_assets_centroid ON assets USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_study_area ON assets(study_area_id);

-- 3. Subtype: Roads
CREATE TABLE IF NOT EXISTS roads (
    asset_id VARCHAR(64) PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    road_name VARCHAR(255),
    road_class VARCHAR(64) NOT NULL, -- 'primary', 'secondary', 'tertiary', 'residential', etc.
    surface_type VARCHAR(64) DEFAULT 'asphalt',
    length_m DECIMAL(10, 2) NOT NULL,
    access_status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'RESTRICTED', 'CLOSED'
    speed_limit_kph INTEGER,
    width_m DECIMAL(6, 2)
);

-- 4. Subtype: Buildings
CREATE TABLE IF NOT EXISTS buildings (
    asset_id VARCHAR(64) PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    building_use VARCHAR(64) DEFAULT 'residential',
    floors INTEGER,
    height_m DECIMAL(6, 2),
    height_source VARCHAR(64) NOT NULL,
    height_is_estimated BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Departments
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    contact_email VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CITIZEN', -- 'CITIZEN', 'FIELD_OFFICER', 'ADMIN'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Citizen Grievances
CREATE TABLE IF NOT EXISTS grievances (
    id VARCHAR(64) PRIMARY KEY,
    reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'AI_CLASSIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
    severity VARCHAR(32) NOT NULL DEFAULT 'MODERATE', -- 'LOW', 'MODERATE', 'SEVERE', 'HAZARDOUS'
    priority_score DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    priority_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    assigned_department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    classification_result VARCHAR(64),
    classification_confidence DECIMAL(4, 3),
    image_url VARCHAR(512),
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_grievances_location ON grievances USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_asset ON grievances(asset_id);

-- 8. Grievance Status History & Audit
CREATE TABLE IF NOT EXISTS grievance_status_history (
    id VARCHAR(64) PRIMARY KEY,
    grievance_id VARCHAR(64) NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Maintenance Risk Predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
    id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    model_name VARCHAR(64) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    prediction_target VARCHAR(64) NOT NULL DEFAULT 'structural_failure_risk',
    risk_score DECIMAL(5, 2) NOT NULL,
    risk_category VARCHAR(32) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    confidence_or_uncertainty DECIMAL(4, 3),
    feature_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_predictions_asset ON risk_predictions(asset_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_category ON risk_predictions(risk_category);

-- 10. Knowledge Graph Edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id VARCHAR(64) PRIMARY KEY,
    source_type VARCHAR(32) NOT NULL,
    source_id VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    relationship_type VARCHAR(64) NOT NULL,
    provenance VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_type, target_id);

-- 11. Urban Scenario Simulations
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(64) NOT NULL,
    proposed_configuration JSONB NOT NULL,
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'READY',
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_results (
    id VARCHAR(64) PRIMARY KEY,
    scenario_id VARCHAR(64) NOT NULL REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
    affected_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_grievance_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    change_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
