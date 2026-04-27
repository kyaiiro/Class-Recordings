# OneDrive Video Gallery Setup Guide

This guide explains how to configure your corporate OneDrive to work with the video gallery on Vercel.

## Overview

The gallery now uses a **Vercel backend API** (`/api/videos.js`) that authenticates with your OneDrive using OAuth, then returns the list of videos to your frontend.

## Step 1: Register Microsoft App (One-time)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Click **Azure Active Directory** → **App registrations** → **New registration**
3. Fill in:
   - **Name**: `Video Gallery` (or your preferred name)
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: Web — `https://yourdomain.vercel.app/api/callback` (we'll skip OAuth flow, but set it anyway)
4. Click **Register**

## Step 2: Get Client ID & Secret

1. After registration, you'll see your app page
2. Copy the **Application (client) ID** - save this as `MICROSOFT_CLIENT_ID`
3. Click **Certificates & secrets** → **New client secret**
4. Copy the secret value (not the ID) - save this as `MICROSOFT_CLIENT_SECRET`

## Step 3: Grant API Permissions

1. On your app page, click **API permissions**
2. Click **Add a permission**
3. Search for **Microsoft Graph**
4. Click **Delegated permissions**
5. Search for and select:
   - `Files.Read.All`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent for [your org]**

## Step 4: Get Refresh Token

This is the manual step because OAuth redirect in a frontend is complex:

1. Build this URL (replace `CLIENT_ID`):
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost:3000&response_type=code&scope=Files.Read.All+offline_access
```

2. Open it in your browser, sign in with your corporate account
3. You'll be redirected to `localhost:3000?code=...`
4. Copy the `code` from the URL

5. In your terminal, run:
```bash
curl -X POST https://login.microsoftonline.com/common/oauth2/v2.0/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=CODE_FROM_STEP_4" \
  -d "redirect_uri=http://localhost:3000" \
  -d "grant_type=authorization_code"
```

6. From the response, copy the `refresh_token` - save this as `MICROSOFT_REFRESH_TOKEN`

## Step 5: Get OneDrive Folder IDs

Your share URL is already in this format:
```
https://1drv.ms/f/c/6e2e618f60c2f550/IgDw6QnPYubeQrgblVuFBz9gATWNUFT4SYPE-0dj6WPGQnY
```

Extract:
- **DRIVE_ID** (between `/c/` and next `/`): `6e2e618f60c2f550`
- **ITEM_ID** (after the last `/`): `IgDw6QnPYubeQrgblVuFBz9gATWNUFT4SYPE-0dj6WPGQnY`

## Step 6: Set Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value |
|----------|-------|
| `MICROSOFT_CLIENT_ID` | Your Client ID from Step 2 |
| `MICROSOFT_CLIENT_SECRET` | Your Client Secret from Step 2 |
| `MICROSOFT_REFRESH_TOKEN` | Your Refresh Token from Step 4 |
| `ONEDRIVE_DRIVE_ID` | `6e2e618f60c2f550` |
| `ONEDRIVE_ITEM_ID` | `IgDw6QnPYubeQrgblVuFBz9gATWNUFT4SYPE-0dj6WPGQnY` |

**Important**: Set them for **Production** environment

5. Redeploy your Vercel project (git push or redeploy button)

## Step 7: Test

1. Open your gallery in browser
2. Go to **Developer Console** (F12)
3. You should see: `Fetching videos from backend API...`
4. If successful: `Found video: ...` messages appear
5. Videos should display in the gallery

## Troubleshooting

**Error: "Missing configuration"**
- Environment variables not set on Vercel
- Redeploy after adding them

**Error: "Token request failed: 401"**
- Client ID or secret is incorrect
- Refresh token expired (need to get a new one)

**Error: "Graph API returned 401"**
- Refresh token is invalid
- Permission `Files.Read.All` not granted

**Videos not showing but no errors**
- Make sure your OneDrive folder actually contains video files (.mp4, .webm, etc.)
- Check that the folder is accessible to your user

## To Add More Videos

Simply upload `.mp4`, `.webm`, `.mov`, `.ogv`, `.mkv`, or `.avi` files to your OneDrive folder. They'll automatically appear in the gallery within seconds!
