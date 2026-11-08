import json
import sqlite3

conn = sqlite3.connect("database/aspice.db")
conn.row_factory = sqlite3.Row


def rows(sql):
    return [dict(r) for r in conn.execute(sql)]


data = {
    "overview": rows("SELECT * FROM v_project_overview ORDER BY project"),
    "groups": rows("SELECT * FROM v_group_status ORDER BY project, grp"),
    "gaps": rows("SELECT * FROM v_traceability_gaps ORDER BY project, req_id"),
    "defects": rows("SELECT * FROM v_open_defects ORDER BY project"),
}

with open("dashboard/data.js", "w") as f:
    f.write("const DATA = " + json.dumps(data, indent=2) + ";\n")

print("exported", len(data["overview"]), "projects to dashboard/data.js")
conn.close()