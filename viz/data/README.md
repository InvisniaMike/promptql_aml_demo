# Data formats for the thin viz
// COMMENT: Minimal shapes; the viz is forgiving but expects these keys.

Put JSON in `../snapshots` (preferred for demos) or `viz/data`.

1) leakage.json
```json
{
  "meta": {"sla_breach_pct": 12.3},
  "timeseries": [{"date":"2025-01-01","value":10,"is_anomaly":false}],
  "entities": [
    {
      "entity_id":"C123",
      "label":"Customer C123",
      "risk_today":0.87,
      "risk_trajectory":0.65,
      "lineage":{"tables":["Transfers","Customers","Sanctions"],"filters":{}}
    }
  ]
}
```

2) repeat_sar.json
```json
{"entities":[{"customer_id":"X1","label":"Cust X1","risk_today":0.62,"risk_trajectory":0.10,"lineage":{}}]}
```

3) mule_burst.json
```json
{"entities":[{"account_id":"A77","label":"Acct A77","risk_today":0.55,"risk_trajectory":0.72,"lineage":{}}]}
```

Optional entity fields shown in **Entity Details**:
```json
{
  "exposure_amount": 120000.5,
  "tx_count": 43,
  "first_seen": "2025-02-01",
  "last_seen": "2025-03-14",
  "sla_hours_to_case": 49,
  "match_confidence": 0.92,
  "reason_codes": ["No case ≤24h","Fuzzy watchlist match 0.92"]
}
```

Optional data quality meta:
```json
{"meta":{"data_quality":{"nulls":1.8,"duplicate_ids":12,"timestamp_gaps":3}}}
```