# PromptQL AML Demo — Setup & Live Demo Guide
// COMMENT: This is your step-by-step runbook for showtime.

## 1) Success Criteria (open with this)
- Surface real **Sanctions/PEP SLA leakage** with **lineage**
- Show a **Saved Investigation** anyone can re-run
- Prioritize with a simple visual (anomaly line or Fix-Now matrix)

---

## 2) Connection Strings (from the brief)
// COMMENT: Replace if your interview provides different test creds.
**Mongo (read-only):**
```
mongodb://aml_readonly:PromptQL25@aml-axiom.hasura-demo.com:27017/aml?authSource=aml
```
**Postgres (read-only):**
```
postgres://aml_readonly:PromptQL25@aml-axiom.hasura-demo.com:5432/postgres
```
(If JDBC)
```
jdbc:postgresql://aml-axiom.hasura-demo.com:5432/postgres?user=aml_readonly&password=PromptQL25
```

**Collections/Tables**
- **Mongo**: `Accounts`, `AML_Cases`, `Sanctions`
- **Postgres**: `Customers`, `Transfers`, `SARs`

> **COME BACK AND CHECK IN HERE SO WE CAN VALIDATE ASSUMPTIONS** about SLA definition, PEP flags, exclusions, fuzzy threshold.

---

## 3) Quickstart — Local PromptQL Project
**Install & verify**
- Docker Desktop running
- Hasura DDN CLI:
  ```bash
  curl -L https://graphql-engine-cdn.hasura.io/ddn/cli/v4/get.sh | bash
  ddn doctor
  ```

**Initialize**
```bash
ddn auth login
ddn supergraph init aml-demo --with-promptql
cd aml-demo
```

**Connect Postgres**
```bash
ddn connector init pg -i
# supply JDBC URL
ddn connector introspect pg
ddn model add pg "*"
ddn command add pg "*"
ddn relationship add pg "*"
```

**Connect Mongo**
```bash
ddn connector init mongo -i
# supply the Mongo URL
ddn connector introspect mongo
ddn model add mongo "*"
```

**Build, run, open Console**
```bash
ddn supergraph build local
ddn run docker-start
ddn console --local
```

**PromptQL config**
- Copy `promptql-config.hml` (v2 schema) into project.
- Encodes domain defaults in **systemInstructions** (lookback, SLA, fuzziness, exclusions, lineage output).

---

## 4) Run Saved Investigations (live)
Use `saved_investigations/*.txt` as **Saved Prompts** in the Playground.  
If strict pass yields zero hits, relax **once** (fuzzy 0.90 or SLA 48h).

Export to:
```
snapshots/leakage.json
snapshots/repeat_sar.json
snapshots/mule_burst.json
```

---

## 5) Visualization (offline-capable)
Open `viz/index.html`.  
Choose **Data Source**: `../snapshots` (offline) or `./data` (optional live export).

Panels:
- KPI cards
- Weekly time series (MAD anomalies)
- Risk Today × Risk Trajectory matrix
- Entity Details (reason codes, SLA hours, match confidence)
- Data Quality Snapshot (`meta.data_quality`)

**Data shapes:** see `viz/data/README_data_formats.md`.

---

## 6) Live vs Snapshot Demo
- **Live (preferred):** show plan, run, click entity → lineage.
- **Snapshot fallback:** switch to `../snapshots`.

---

## 7) Persona Talk Tracks
- **Compliance/AML:** lineage, SLA, defendability.  
- **Ops:** saved investigations reduce manual steps.  
- **Tech:** read-only connectors, masking, logs, exportability.  
- **Exec:** penalty-aware priority; time-to-value.

---

## 8) Deliverables Checklist
- ✅ Repo link  
- ✅ Saved Prompts  
- ✅ Compliant `promptql-config.hml` (v2)  
- ✅ Thin viz working

---

## 9) Troubleshooting
- **No hits** → widen lookback / relax once; still show monitors.  
- **Joins weird** → name+DOB fuzzy 0.90; show `match_confidence`.  
- **Performance** → weekly grain, pagination, snapshots.  
- **Compliance** → masking + lineage; avoid PII in screenshots.

---

## 10) Validate after connecting
- SLA event field, PEP flags, exclusions, fuzzy threshold, dormancy definition.  
- **COME BACK AND CHECK IN HERE SO WE CAN VALIDATE ASSUMPTIONS** and tune Saved Investigations.