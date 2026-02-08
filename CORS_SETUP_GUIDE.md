# Firebase Storage CORS Configuration Guide

## What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature that controls which websites can access resources from your Firebase Storage. When you upload images from your website (safepass.toolteek.com) to Firebase Storage, the browser needs permission to make these requests.

## Why You Need This

Without CORS configuration, you'll see errors like:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://safepass.toolteek.com' has been blocked by CORS policy
```

## Method 1: Using Google Cloud SDK (gsutil) - Recommended

### Step 1: Install Google Cloud SDK

**Windows:**
1. Download from: https://cloud.google.com/sdk/docs/install
2. Run the installer
3. Open a new Command Prompt or PowerShell

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Authenticate

```bash
gcloud auth login
```

### Step 3: Set Your Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your Firebase project ID (found in Firebase Console > Project Settings).

### Step 4: Apply CORS Configuration

```bash
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME
```

**To find your Storage Bucket Name:**
1. Go to Firebase Console
2. Click on Storage
3. Look at the URL or the bucket name shown (format: `your-project-id.appspot.com` or `your-project-id.firebasestorage.app`)

**Example:**
```bash
gsutil cors set cors.json gs://gen-lang-client-0423786194.firebasestorage.app
```

### Step 5: Verify CORS is Set

```bash
gsutil cors get gs://YOUR_STORAGE_BUCKET_NAME
```

You should see the CORS configuration from `cors.json`.

---

## Method 2: Using Firebase Console (If Available)

Some Firebase projects allow CORS configuration through the console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Storage** > **Settings** (or **Configuration**)
4. Look for **CORS configuration** section
5. Paste the content from `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

**Note:** This option may not be available in all Firebase projects. If you don't see it, use Method 1.

---

## Method 3: Using Firebase CLI

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login

```bash
firebase login
```

### Step 3: Initialize (if not done)

```bash
firebase init storage
```

### Step 4: Deploy CORS

Unfortunately, Firebase CLI doesn't directly support CORS deployment. You'll need to use `gsutil` (Method 1) or the Google Cloud Console.

---

## Method 4: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **Cloud Storage** > **Buckets**
4. Click on your storage bucket
5. Go to **Configuration** tab
6. Scroll to **CORS** section
7. Click **Edit CORS configuration**
8. Paste the JSON from `cors.json`
9. Click **Save**

---

## Troubleshooting

### Error: "gsutil: command not found"
- Make sure Google Cloud SDK is installed and added to PATH
- Restart your terminal/command prompt

### Error: "Access Denied"
- Make sure you're authenticated: `gcloud auth login`
- Verify you have Storage Admin permissions in the project

### Still Getting CORS Errors After Configuration
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache
3. Try in incognito/private mode
4. Verify CORS is set: `gsutil cors get gs://YOUR_BUCKET_NAME`
5. Check that your domain is allowed (we use `["*"]` which allows all)

### Check Current CORS Settings

```bash
gsutil cors get gs://YOUR_STORAGE_BUCKET_NAME
```

---

## Security Note

The current `cors.json` uses `"origin": ["*"]` which allows all domains. For production, you may want to restrict this to specific domains:

```json
[
  {
    "origin": [
      "https://safepass.toolteek.com",
      "https://www.safepass.toolteek.com",
      "http://localhost:5173"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

Then update CORS again:
```bash
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME
```

---

## Quick Test

After configuring CORS, test by:
1. Opening your app
2. Trying to upload an image
3. Check browser console for CORS errors
4. If no errors, CORS is working! ✅

---

## Need Help?

If you're still having issues:
1. Check Firebase Storage rules are correct
2. Verify your Firebase project ID and bucket name
3. Ensure you have proper permissions
4. Check browser console for specific error messages
