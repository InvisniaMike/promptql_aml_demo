#!/usr/bin/env bash
# Refresh snapshot JSON files for the viz from PromptQL NL API.
# Env:
#   PROMPTQL_API_KEY (required)
#   PROMPTQL_VERSION=v1|v2 (default v2)
#   PROMPTQL_TZ=America/Detroit (default)
#   DDN_URL=https://<PROJECT>.ddn.hasura.app/v1/sql (only for v1)

set -euo pipefail
: "${PROMPTQL_API_KEY:?Set PROMPTQL_API_KEY}"
: "${PROMPTQL_VERSION:=v2}"
: "${PROMPTQL_TZ:=America/Detroit}"
: "${DDN_URL:=https://<PROJECT>.ddn.hasura.app/v1/sql}"

AUTHZ_HEADER=(-H "Authorization: Bearer ${PROMPTQL_API_KEY}" -H "Content-Type: application/json")

request_body_v1() {
  jq -n --arg tz "$PROMPTQL_TZ" --arg url "$DDN_URL" --arg text "$1" '
    {version:"v1", timezone:$tz, llm:{provider:"hasura"},
     ddn:{url:$url, headers:{}}, interactions:[{user_message:{text:$text}}], stream:false}'
}
request_body_v2() {
  jq -n --arg tz "$PROMPTQL_TZ" --arg text "$1" '
    {version:"v2", timezone:$tz,
     interactions:[{user_message:{text:$text}}], stream:false}'
}
run_prompt() { # $1 prompt
  local body
  if [[ "$PROMPTQL_VERSION" == "v1" ]]; then body="$(request_body_v1 "$1")"; else body="$(request_body_v2 "$1")"; fi
  curl -sS -X POST "https://promptql.ddn.hasura.app/api/query" "${AUTHZ_HEADER[@]}" -d "$body"
}

mkdir -p snapshots

PROMPT_TEXT_LEAKAGE=${PROMPT_TEXT_LEAKAGE:-'Detect sanctions/PEP SLA leakage over 12 months.
Criteria:
- Party match: sanctions (exact first; if low results, fuzzy 0.90 on name+dob) OR customers.is_pep=true
- SLA breach: no AML_Case within 24 hours
Return JSON with:
- "meta": {"sla_breach_pct": <number>, "data_quality": {"nulls":<pct>,"duplicate_ids":<count>,"timestamp_gaps":<count>}},
- "timeseries": [{"date":"YYYY-MM-DD","value":<number>,"is_anomaly":<bool>}],
- "entities": [{
    "entity_id":"<id>","label":"<name>","risk_today":<0..1>,"risk_trajectory":<0..1>,
    "exposure_amount":<number>,"tx_count":<int>,"first_seen":"YYYY-MM-DD","last_seen":"YYYY-MM-DD",
    "sla_hours_to_case":<int>,"match_confidence":<0..1>,
    "reason_codes":["No case â‰¤24h","Fuzzy watchlist match â‰¥0.9"],
    "lineage":{"tables":["Transfers","Customers","Sanctions"],"filters":{}}}]'}
PROMPT_TEXT_REPEAT_SAR=${PROMPT_TEXT_REPEAT_SAR:-'Detect repeat-SAR governance gaps over 12 months.
Criteria: >=2 SARs in 6 months AND missing EDD or risk-tier change.
Return JSON with "entities" shaped like above.'}
PROMPT_TEXT_MULE=${PROMPT_TEXT_MULE:-'Detect dormantâ†’mule burst patterns over 12 months.
Criteria: dormant >180d; in last 14d >=10 new counterparties; >=8 tx; sum_amount >= 5000.
Return JSON with "entities" and optional "timeseries".'}

echo "Exporting leakage.json â€¦"
run_prompt "$PROMPT_TEXT_LEAKAGE" > snapshots/leakage.json
echo "Exporting repeat_sar.json â€¦"
run_prompt "$PROMPT_TEXT_REPEAT_SAR" > snapshots/repeat_sar.json
echo "Exporting mule_burst.json â€¦"
run_prompt "$PROMPT_TEXT_MULE" > snapshots/mule_burst.json

echo "Done. Open viz/index.html and select ../snapshots."
