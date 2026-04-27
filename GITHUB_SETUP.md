# GitHub Releases Video Gallery Setup Guide

This guide explains how to configure your video gallery to fetch videos from GitHub Releases.

## Overview

The gallery uses a **Vercel backend API** (`/api/videos.js`) that fetches videos from GitHub Releases, then returns the list to your frontend. No authentication required for public repos!

## Step 1: Create a GitHub Release

1. Go to your GitHub repository
2. Click the **Releases** tab (on the right side)
3. Click **Create a new release** (or "Draft a new release")
4. Fill in:
   - **Tag**: `v1.0` (or any version number)
   - **Title**: `Class Recordings` (or your preferred name)
   - **Description**: Optional description
5. Scroll to **Attach binaries by dropping them here or selecting them**
6. Upload your `.mp4`, `.webm`, or other video files
7. Click **Publish release**

Done! Your videos are now hosted on GitHub.

## Step 2: Get Your GitHub Details

You'll need:
- **GITHUB_OWNER**: Your GitHub username (e.g., `your-username`)
- **GITHUB_REPO**: Your repository name (e.g., `class-recordings`)

Example:
- If your repo is `https://github.com/mrjones/videos`, then:
  - `GITHUB_OWNER` = `mrjones`
  - `GITHUB_REPO` = `videos`

## Step 3: (Optional) Create a GitHub Token

For higher API rate limits, create a personal access token:

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Click **Generate new token**
3. Give it a name (e.g., "Video Gallery")
4. Select scope: `public_repo`
5. Click **Generate token**
6. Copy the token - save as `GITHUB_TOKEN`

This is optional - public repos work without it, but you get rate-limited at 60 requests/hour vs 5,000 with a token.

## Step 4: Set Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value |
|----------|-------|
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | Your repository name |
| `GITHUB_TOKEN` | (Optional) Your personal access token |

**Important**: Set them for **Production** environment

5. Click **Save**
6. Redeploy your Vercel project (git push or use the redeploy button)

## Step 5: Test

1. Open your gallery in a browser
2. Go to **Developer Console** (F12)
3. You should see: `Fetching videos from backend API...`
4. If successful: Videos should display in the gallery
5. If errors: Check the console for details

## Troubleshooting

**Error: "Missing configuration"**
- `GITHUB_OWNER` or `GITHUB_REPO` not set on Vercel
- Redeploy after adding them

**Error: "GitHub API returned 404"**
- Wrong repo name or owner
- Double-check `GITHUB_OWNER` and `GITHUB_REPO`

**Error: "GitHub API returned 403"**
- Rate limit exceeded (add `GITHUB_TOKEN` for higher limits)
- Or repo is private (make it public or use a token with private access)

**Videos not showing but no errors**
- Make sure videos are actually in the Release
- Videos must have supported extensions: `.mp4`, `.webm`, `.mov`, `.ogv`, `.mkv`, `.avi`

## To Add More Videos

1. Go to your repo's **Releases** tab
2. Either:
   - **Edit existing release**: Click **Edit** → upload more videos → save
   - **Create new release**: Click "Create a new release" → add videos → publish

Videos appear in the gallery automatically (may take a few seconds to cache).

## Date Sorting

Videos are automatically sorted by date if the filename contains a date pattern:
- `12-15-2024.mp4` → displayed with that date
- `2024-12-15.mp4` → also works
- `class-recording.mp4` → listed at bottom (no date extracted)

To name videos with dates, use formats like:
- `12-15-2024_lecture.mp4`
- `2024-12-15-class.mp4`
- `Dec-15-2024-intro.mp4`
