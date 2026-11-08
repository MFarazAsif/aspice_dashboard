import sqlite3

conn = sqlite3.connect("database/aspice.db")

print("OVERVIEW")
for row in conn.execute(
    "SELECT project, area, coverage_pct, pass_rate_pct, open_defects, "
    "avg_defect_age_days, trace_gaps FROM v_project_overview"
):
    print(row)

print()
print("ENGINE_CTRL BY GROUP")
for row in conn.execute(
    "SELECT grp, total_reqs, done_reqs, covered_reqs, total_tests, passed_tests "
    "FROM v_group_status WHERE project = 'engine_ctrl' ORDER BY grp"
):
    print(row)

conn.close()