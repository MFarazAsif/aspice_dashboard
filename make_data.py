import csv
import os
import random
from datetime import date, timedelta

random.seed(42)

projects = [
    {"name": "engine_ctrl", "area": "software", "quality": 0.9},
    {"name": "battery_mgmt", "area": "software", "quality": 0.6},
    {"name": "start_stop", "area": "software", "quality": 0.75},
    {"name": "power_unit", "area": "system", "quality": 0.7},
    {"name": "rotor_board", "area": "hardware", "quality": 0.5},
]

groups = {
    "software": ["SWE.1", "SWE.2", "SWE.3", "SWE.4", "SWE.5", "SWE.6"],
    "system": ["SYS.2", "SYS.3", "SYS.4", "SYS.5"],
    "hardware": ["HWE.1", "HWE.2", "HWE.3", "HWE.4"],
}

# each area uses different column names on purpose
names = {
    "software": {
        "req": ["req_id", "title", "group", "status"],
        "test": ["test_id", "req_id", "result"],
        "defect": ["defect_id", "req_id", "opened", "closed"],
    },
    "system": {
        "req": ["id", "name", "process_area", "state"],
        "test": ["tid", "requirement", "outcome"],
        "defect": ["did", "requirement", "opened_on", "closed_on"],
    },
    "hardware": {
        "req": ["item", "description", "area_code", "status_text"],
        "test": ["check_id", "item", "verdict"],
        "defect": ["issue_id", "item", "raised", "resolved"],
    },
}


def write_csv(path, header, rows):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def make_project(p):
    area = p["area"]
    q = p["quality"]
    cols = names[area]
    folder = os.path.join("projects", p["name"])
    os.makedirs(folder, exist_ok=True)

    reqs = []
    for i in range(1, 41):
        rid = p["name"][:3].upper() + "-" + str(i).zfill(3)
        status = random.choice(["done", "in_progress", "open"])
        reqs.append([rid, "Requirement " + str(i), random.choice(groups[area]), status])

    tests = []
    n = 1
    for r in reqs:
        if random.random() < q + 0.1:
            result = random.choices(["pass", "fail", "not_run"], weights=[q, 1 - q, 0.15])[0]
            tests.append(["T-" + str(n).zfill(3), r[0], result])
            n += 1

    defects = []
    for d in range(1, int((1 - q) * 40) + 3):
        opened = date.today() - timedelta(days=random.randint(5, 120))
        closed = ""
        if random.random() < 0.5:
            closed = min(opened + timedelta(days=random.randint(1, 30)), date.today())
        defects.append(["D-" + str(d).zfill(3), random.choice(reqs)[0], opened, closed])

    # add two messy rows so we have something to clean later
    reqs.append(reqs[0])
    reqs.append(["", "Row without id", groups[area][0], "open"])

    write_csv(os.path.join(folder, "requirements.csv"), cols["req"], reqs)
    write_csv(os.path.join(folder, "tests.csv"), cols["test"], tests)
    write_csv(os.path.join(folder, "defects.csv"), cols["defect"], defects)


for p in projects:
    make_project(p)
    print("made", p["name"], p["area"])