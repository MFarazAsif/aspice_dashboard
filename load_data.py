import csv
import os
import sqlite3
from datetime import datetime

DB_FILE = os.path.join("database", "aspice.db")
SCHEMA_FILE = os.path.join("database", "schema.sql")
VIEWS_FILE = os.path.join("database", "views.sql")
LOG_FILE = os.path.join("database", "bad_rows.log")

# left side is the column name in the project file
# right side is the common name used in the database
AREAS = {
    "software": {
        "requirements": {"req_id": "req_id", "title": "title", "group": "grp", "status": "status"},
        "tests": {"test_id": "test_id", "req_id": "req_id", "result": "result"},
        "defects": {"defect_id": "defect_id", "req_id": "req_id", "opened": "opened", "closed": "closed"},
    },
    "system": {
        "requirements": {"id": "req_id", "name": "title", "process_area": "grp", "state": "status"},
        "tests": {"tid": "test_id", "requirement": "req_id", "outcome": "result"},
        "defects": {"did": "defect_id", "requirement": "req_id", "opened_on": "opened", "closed_on": "closed"},
    },
    "hardware": {
        "requirements": {"item": "req_id", "description": "title", "area_code": "grp", "status_text": "status"},
        "tests": {"check_id": "test_id", "item": "req_id", "verdict": "result"},
        "defects": {"issue_id": "defect_id", "item": "req_id", "raised": "opened", "resolved": "closed"},
    },
}


def find_area(folder):
    path = os.path.join(folder, "requirements.csv")
    with open(path, newline="") as f:
        header = next(csv.reader(f))
    for area, maps in AREAS.items():
        if set(header) == set(maps["requirements"]):
            return area
    raise ValueError("unknown column layout in " + path)


def read_rows(path, mapping):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        if set(reader.fieldnames or []) != set(mapping):
            raise ValueError("wrong columns in " + path)
        rows = []
        for line, raw in enumerate(reader, start=2):
            row = {mapping[k]: (v or "").strip() for k, v in raw.items()}
            row["line"] = line
            rows.append(row)
    return rows


def good_date(text):
    try:
        datetime.strptime(text, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def log_bad(log, project, file_name, line, reason):
    log.write(project + " | " + file_name + " | line " + str(line) + " | " + reason + "\n")


def load_project(conn, log, name):
    folder = os.path.join("projects", name)
    area = find_area(folder)
    maps = AREAS[area]

    reqs = read_rows(os.path.join(folder, "requirements.csv"), maps["requirements"])
    tests = read_rows(os.path.join(folder, "tests.csv"), maps["tests"])
    defects = read_rows(os.path.join(folder, "defects.csv"), maps["defects"])

    loaded_at = datetime.now().isoformat(timespec="seconds")
    conn.execute("INSERT INTO projects VALUES (?, ?, ?)", (name, area, loaded_at))

    good_reqs = set()
    for r in reqs:
        reason = ""
        if r["req_id"] == "":
            reason = "missing id"
        elif r["req_id"] in good_reqs:
            reason = "duplicate id"
        elif r["status"] not in ("done", "in_progress", "open"):
            reason = "unknown status"
        if reason:
            log_bad(log, name, "requirements", r["line"], reason)
            continue
        good_reqs.add(r["req_id"])
        conn.execute(
            "INSERT INTO requirements VALUES (?, ?, ?, ?, ?)",
            (name, r["req_id"], r["title"], r["grp"], r["status"]),
        )

    seen_tests = set()
    for r in tests:
        reason = ""
        if r["test_id"] == "":
            reason = "missing id"
        elif r["test_id"] in seen_tests:
            reason = "duplicate id"
        elif r["req_id"] not in good_reqs:
            reason = "unknown requirement"
        elif r["result"] not in ("pass", "fail", "not_run"):
            reason = "unknown result"
        if reason:
            log_bad(log, name, "tests", r["line"], reason)
            continue
        seen_tests.add(r["test_id"])
        conn.execute(
            "INSERT INTO tests VALUES (?, ?, ?, ?)",
            (name, r["test_id"], r["req_id"], r["result"]),
        )

    seen_defects = set()
    for r in defects:
        reason = ""
        if r["defect_id"] == "":
            reason = "missing id"
        elif r["defect_id"] in seen_defects:
            reason = "duplicate id"
        elif r["req_id"] not in good_reqs:
            reason = "unknown requirement"
        elif not good_date(r["opened"]):
            reason = "bad opened date"
        elif r["closed"] != "" and not good_date(r["closed"]):
            reason = "bad closed date"
        if reason:
            log_bad(log, name, "defects", r["line"], reason)
            continue
        seen_defects.add(r["defect_id"])
        conn.execute(
            "INSERT INTO defects VALUES (?, ?, ?, ?, ?)",
            (name, r["defect_id"], r["req_id"], r["opened"], r["closed"] or None),
        )


def main():
    conn = sqlite3.connect(DB_FILE)
    with open(SCHEMA_FILE) as f:
        conn.executescript(f.read())

    with open(VIEWS_FILE) as f:
        conn.executescript(f.read())

    with open(LOG_FILE, "w") as log:
        for name in sorted(os.listdir("projects")):
            if not os.path.isdir(os.path.join("projects", name)):
                continue
            try:
                load_project(conn, log, name)
                conn.commit()
                print("loaded", name)
            except (ValueError, FileNotFoundError) as error:
                conn.rollback()
                log_bad(log, name, "folder", 0, str(error))
                print("skipped", name)

    for table in ("projects", "requirements", "tests", "defects"):
        count = conn.execute("SELECT COUNT(*) FROM " + table).fetchone()[0]
        print(table, count)
    conn.close()


main()