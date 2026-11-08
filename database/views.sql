DROP VIEW IF EXISTS v_project_overview;
DROP VIEW IF EXISTS v_group_status;
DROP VIEW IF EXISTS v_traceability_gaps;
DROP VIEW IF EXISTS v_open_defects;
DROP VIEW IF EXISTS v_test_pass_rate;
DROP VIEW IF EXISTS v_req_coverage;

CREATE VIEW v_req_coverage AS
SELECT r.project,
       COUNT(*) AS total_reqs,
       SUM(CASE WHEN EXISTS (
             SELECT 1 FROM tests t
             WHERE t.project = r.project AND t.req_id = r.req_id
           ) THEN 1 ELSE 0 END) AS covered_reqs
FROM requirements r
GROUP BY r.project;

CREATE VIEW v_test_pass_rate AS
SELECT project,
       COUNT(*) AS total_tests,
       SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) AS passed,
       SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN result = 'not_run' THEN 1 ELSE 0 END) AS not_run
FROM tests
GROUP BY project;

CREATE VIEW v_open_defects AS
SELECT project,
       COUNT(*) AS open_defects,
       ROUND(AVG(julianday('now') - julianday(opened)), 1) AS avg_age_days,
       CAST(MAX(julianday('now') - julianday(opened)) AS INTEGER) AS oldest_days
FROM defects
WHERE closed IS NULL
GROUP BY project;

CREATE VIEW v_traceability_gaps AS
SELECT r.project, r.req_id, r.grp, r.status
FROM requirements r
WHERE NOT EXISTS (
  SELECT 1 FROM tests t
  WHERE t.project = r.project AND t.req_id = r.req_id
);

CREATE VIEW v_group_status AS
SELECT r.project,
       r.grp,
       COUNT(*) AS total_reqs,
       SUM(CASE WHEN r.status = 'done' THEN 1 ELSE 0 END) AS done_reqs,
       SUM(CASE WHEN EXISTS (
             SELECT 1 FROM tests t
             WHERE t.project = r.project AND t.req_id = r.req_id
           ) THEN 1 ELSE 0 END) AS covered_reqs,
       (SELECT COUNT(*) FROM tests t
          JOIN requirements r2 ON r2.project = t.project AND r2.req_id = t.req_id
          WHERE r2.project = r.project AND r2.grp = r.grp) AS total_tests,
       (SELECT COUNT(*) FROM tests t
          JOIN requirements r2 ON r2.project = t.project AND r2.req_id = t.req_id
          WHERE r2.project = r.project AND r2.grp = r.grp
            AND t.result = 'pass') AS passed_tests
FROM requirements r
GROUP BY r.project, r.grp;

CREATE VIEW v_project_overview AS
SELECT p.project,
       p.area,
       p.loaded_at,
       c.total_reqs,
       c.covered_reqs,
       c.total_reqs - c.covered_reqs AS trace_gaps,
       ROUND(100.0 * c.covered_reqs / c.total_reqs, 1) AS coverage_pct,
       COALESCE(t.total_tests, 0) AS total_tests,
       ROUND(100.0 * COALESCE(t.passed, 0) / NULLIF(t.total_tests, 0), 1) AS pass_rate_pct,
       COALESCE(d.open_defects, 0) AS open_defects,
       COALESCE(d.avg_age_days, 0) AS avg_defect_age_days
FROM projects p
JOIN v_req_coverage c ON c.project = p.project
LEFT JOIN v_test_pass_rate t ON t.project = p.project
LEFT JOIN v_open_defects d ON d.project = p.project;