# CORS Issue - To Fix Later

## The Problem
Firebase Storage uploads from localhost are blocked by CORS policy.

## The Solution (When Ready)
You'll need to configure CORS on your Firebase Storage bucket. This requires Google Cloud CLI (`gcloud`).

## Quick Steps (For Later):
1. Install gcloud CLI: `brew install google-cloud-sdk`
2. Create a `cors.json` file with this content:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Goog-Upload-Protocol", "X-Goog-Upload-Command", "X-Goog-Upload-Content-Length", "X-Goog-Upload-Offset"]
  }
]
```
3. Apply CORS:
```bash
gcloud auth login
gcloud config set project studio-9999949982-dd535
gcloud storage buckets update gs://studio-9999949982-dd535.appspot.com --cors-file=cors.json
```

## For Now
The app works fine without storage uploads. You can still:
- Generate logo grids (they show immediately)
- Edit logos
- Download logos
- Everything except saving to Firebase Storage

We'll fix CORS when you're ready to persist images to the cloud.
