# services/ — Specialized Helper Tools

Services handle **specific technical tasks** that don't fit in models or controllers. They are reusable utilities that any controller can call.

## How Services Differ from Models

- **Models** = talk to the database (SQL queries)
- **Services** = talk to external systems (AWS S3, n8n, file parsing)

## Files in This Folder

### fitParser.js — .FIT File Parser (DONE)

Converts binary .FIT files (from Garmin/COROS watches) into JavaScript objects.

- **Input:** A raw binary Buffer (the uploaded file)
- **Output:** `{ summary, laps }` — structured data with all metrics
- Handles gzip-compressed files automatically
- Handles both Garmin (cascade mode) and COROS (flat mode) file structures
- Rejects workout plan files (only accepts completed activity files)

```
Used by: workoutController.js (during .FIT upload)
```

### s3.js — AWS S3 File Storage (DONE)

Uploads files to Amazon S3 (cloud storage) and generates download URLs.

- `uploadFitFile(buffer, athleteId, filename)` → uploads .FIT, returns the S3 key
- `uploadZwoFile(buffer, planId, filename)` → uploads .ZWO workout plan files
- `getPresignedUrl(s3Key)` → generates a temporary URL to download a private file

File paths in S3:
- .FIT files: `fit/{athleteId}/{YYYY-MM-DD}_{filename}`
- .ZWO files: `zwo/{planId}/{filename}`

```
Used by: workoutController.js (upload), future plan management
```

### n8n.js — AI Feedback Webhook (DONE)

Sends workout data to n8n (automation platform) which triggers AI analysis.

- **Fire-and-forget:** The upload doesn't wait for AI feedback to finish
- n8n receives the data, sends it to Claude AI, and the AI posts feedback back to our API at `POST /api/workouts/:id/feedback`
- If `N8N_WEBHOOK_URL` is not configured, it silently skips (no crash)

```
Used by: workoutController.js (after successful upload)
```

## Connection to Other Folders

```
services/ uses:
  └── External systems (AWS S3, n8n webhooks, zlib for decompression)

services/ is used by:
  └── controllers/ → controllers call service functions when needed
```

Services do NOT use models or the database directly. They are pure utilities.
