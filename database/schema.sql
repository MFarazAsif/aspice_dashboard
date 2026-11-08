DROP TABLE IF EXISTS defects;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS requirements;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
    project TEXT PRIMARY KEY,
    area TEXT NOT NULL,
    loaded_at TEXT NOT NULL
);

CREATE TABLE requirements (
    project TEXT NOT NULL,
    req_id TEXT NOT NULL,
    title TEXT,
    grp TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (project, req_id)
);

CREATE TABLE tests (
    project TEXT NOT NULL,
    test_id TEXT NOT NULL,
    req_id TEXT NOT NULL,
    result TEXT NOT NULL,
    PRIMARY KEY (project, test_id)
);

CREATE TABLE defects (
    project TEXT NOT NULL,
    defect_id TEXT NOT NULL,
    req_id TEXT NOT NULL,
    opened TEXT NOT NULL,
    closed TEXT,
    PRIMARY KEY (project, defect_id)
);