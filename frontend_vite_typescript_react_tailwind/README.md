# Simple k6 visual frontend

This frontend is designed for:
- manual API checks in the first tab
- simple k6 result upload in the second tab

## k6 upload flow
1. Open the second tab: **k6 upload**
2. Choose **Test summary** or **CPU summary**
3. Upload the required file
4. Take screenshots from the generated stat cards and charts

## Files to import
### Test summary JSON
- EV-K6-SB-SMOKE-VU1-M1-summary.json
- EV-K6-SB-READ-VU20-M1-summary.json
- EV-K6-DJ-SMOKE-VU1-M1-summary.json
- EV-K6-DJ-READ-VU20-M1-summary.json

### CPU summary text
- EV-RES-SB-SMOKE-VU1-M1-pidstat.txt
- EV-RES-SB-READ-VU20-M1-pidstat.txt
- EV-RES-DJ-SMOKE-VU1-M1-pidstat.txt
- EV-RES-DJ-READ-VU20-M1-pidstat.txt

The frontend reads the file name automatically.
