# PromptQL AML Demo — Quickstart

This repo lets you demo **three Saved Investigations** with a thin, offline-capable viz:
1) **Sanctions/PEP SLA Leakage**
2) **Repeat-SAR Subjects Not Escalated**
3) **Dormant → Mule Burst**

You can run **live** via PromptQL **or** use JSON **snapshots** for a guaranteed demo.

🔎 Quick links

- 👉 [Setup & Live Demo Guide](./viz)            

- 🧭 [Data Formats (viz)](./viz/data)
---

## 0) Folder Layout
```
promptql_aml_demo/
├─ promptql-config.hml
├─ saved_investigations/
│  ├─ 01_sanctions_pep_sla_leakage.txt
│  ├─ 02_repeat_sar_not_escalated.txt
│  └─ 03_dormant_to_mule_burst.txt
├─ snapshots/
│  ├─ leakage.json
│  ├─ repeat_sar.json
│  └─ mule_burst.json
└─ viz/
   ├─ index.html
   ├─ app.js
   ├─ styles.css
   └─ data/
      └─ README_data_formats.md
```

---

## 1) What we can show (above the line)
- **Live run** of **Sanctions/PEP SLA Leakage** with **lineage** (reason codes + SLA hours to case).
- **Prompt ladder**: naïve → assisted chips (lookback/SLA/match/exclusions) → **Saved Investigation**.
- **One visual**: weekly anomaly line **or** **Risk Today × Risk Trajectory** matrix.
- **Cleanup close**: small remediation CSV + weekly monitor plan.
- **Snapshot fallback**: same visuals from `snapshots/*.json`.

---

## 2) Configure PromptQL (compliant config)
Use `promptql-config.hml` (v2 schema). AML guidance lives in **systemInstructions**—no custom keys.

---

## 3) Run the three Saved Investigations
Use the text prompts in `saved_investigations/` as **Saved Prompts** in the Playground.  
Export results to JSON as:
- `snapshots/leakage.json`
- `snapshots/repeat_sar.json`
- `snapshots/mule_burst.json`

Or run `export_for_viz.sh`.

---

## 4) Launch the viz
Open `viz/index.html`. Choose **Data Source**:
- `../snapshots` (offline, safest)
- `./data` (optional live-export destination)

Panels:
- **KPI cards** (counts, SLA %)
- **Weekly time series** (MAD anomalies)
- **Risk Today × Risk Trajectory** matrix
- **Entity Details** (reason codes, SLA hours, match confidence)
- **Data Quality Snapshot** (`meta.data_quality` in JSON)

---

## 5) PromptQL quickstart (per docs)
// COMMENT: Keep this short—enough to run the NL API and export JSON with timezone + v2.

**Install CLI**
```bash
curl -L https://graphql-engine-cdn.hasura.io/ddn/cli/v4/get.sh | bash
ddn version
```

**Auth & API key**
```bash
ddn auth login
ddn auth generate-promptql-secret-key
# Use as: Authorization: Bearer <key>
```

**Run NL requests (timezone-aware)**
```bash
export PROMPTQL_API_KEY=***
export PROMPTQL_VERSION=v2          # or v1 if passing DDN_URL
export PROMPTQL_TZ=America/Detroit
./export_for_viz.sh                 # writes snapshots/*.json
```

---

## 6) ELI5 Glossary
- **Lineage**: the receipt per result (tables, filters, joins, timestamp, config hash).
- **Fuzzy 0.90**: “close” name+DOB match; tighten or relax once.
- **SLA 24h**: time limit to open a case after a risky transfer/event.
- **Anomaly (MAD)**: flags points ~3× Median Absolute Deviation.
- **Priority matrix**: X=Risk Today, Y=Risk Trajectory. Top-right = Fix Now.

---

## 7) Preflight checklist
- [ ] Confirm SLA event (“case opened” status/timestamp)
- [ ] Verify fuzzy threshold (0.90) & exclusions (TEST/TRAINING/INTERNAL)
- [ ] Validate dormancy logic
- [ ] Ensure timezones & lookbacks are sane
- [ ] Export/update snapshots and test the viz