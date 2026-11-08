import sqlite3
from datetime import date

conn = sqlite3.connect("database/aspice.db")

rows = conn.execute(
    "SELECT project, area, coverage_pct, pass_rate_pct, open_defects, "
    "avg_defect_age_days, trace_gaps, loaded_at FROM v_project_overview"
).fetchall()

oldest = {}
for project, days in conn.execute("SELECT project, oldest_days FROM v_open_defects"):
    oldest[project] = days


def status(coverage, rate):
    if coverage < 70 or rate < 60:
        return "red"
    if coverage < 90 or rate < 80:
        return "amber"
    return "green"


items = []
for project, area, coverage, rate, defects, age, gaps, loaded_at in rows:
    rate = rate or 0
    items.append({
        "project": project, "area": area, "coverage": coverage, "rate": rate,
        "defects": defects, "age": age, "gaps": gaps,
        "status": status(coverage, rate), "oldest": oldest.get(project, 0),
    })

order = {"red": 0, "amber": 1, "green": 2}
items.sort(key=lambda i: (order[i["status"]], i["coverage"]))

lines = []
lines.append("ASPICE weekly summary " + str(date.today()))
lines.append("Data loaded at " + rows[0][7])
lines.append("")
lines.append("Projects: " + str(len(items)))
lines.append("Open defects: " + str(sum(i["defects"] for i in items)))
lines.append("Requirements without a test: " + str(sum(i["gaps"] for i in items)))
lines.append("")

lines.append("Needs attention first")
red = [i for i in items if i["status"] == "red"]
if not red:
    lines.append("Nothing is red this week.")
for i in red:
    reasons = []
    if i["coverage"] < 70:
        reasons.append("coverage is " + str(i["coverage"]) + "%")
    if i["rate"] < 60:
        reasons.append("pass rate is " + str(i["rate"]) + "%")
    lines.append(i["project"] + " (" + i["area"] + "): " + " and ".join(reasons))
    lines.append("  " + str(i["defects"]) + " open defects, the oldest is " + str(i["oldest"]) + " days old")
lines.append("")

lines.append("All projects")
for i in items:
    lines.append(
        i["status"].upper() + " | " + i["project"] + " | coverage " + str(i["coverage"]) +
        "% | pass rate " + str(i["rate"]) + "% | defects " + str(i["defects"]) +
        " | gaps " + str(i["gaps"])
    )

text = "\n".join(lines)
with open("weekly_summary.txt", "w") as f:
    f.write(text + "\n")

print(text)
conn.close()