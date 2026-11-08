\# ASPICE Project Status Dashboard



Shows how several projects are doing against ASPICE KPIs. Uses sample data.
Live dashboard: https://mfarazasif.github.io/aspice\_dashboard/



!\[Overview](screenshots/overview.png)



\## What it does



Python loads project files into one SQL database. SQL views calculate the KPIs. A JavaScript dashboard reads only from those views.



\## KPIs



Requirements coverage, test pass rate, open defect age, traceability gaps, and status by process group.



\## Run it



&#x20;   python run\_all.py



Then open dashboard/index.html in a browser.



\## Data quality



Bad rows are skipped and written to database/bad\_rows.log with the reason.



\## Add a project



Add a folder inside projects with requirements.csv, tests.csv and defects.csv.



\## Tools



Python, SQL, JavaScript

