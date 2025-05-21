# Deployment Guide for Banani Test Challenge

## Frontend Deployment (Vercel)

The frontend is configured to be deployed on Vercel. The `vercel.json` file contains the necessary configuration to route API requests to the backend.

### Setup Steps

1. Push your code to a GitHub repository
2. Log in to Vercel and create a new project
3. Import your repository
4. Set the following environment variables:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g., `https://banani-backend.onrender.com`)
5. Deploy the application

### Local Development

For local development, the API calls will be proxied to the local backend server running on port 3001.

## Backend Deployment (Render)

The backend should be deployed on Render with the following environment variables:

### Required Environment Variables

```
HUGGINGFACE_API_KEY=your_huggingface_api_key
HUGGINGFACE_BASE_URL=https://api.openai.com/v1
AI_MODEL_NAME=gpt-4o
AI_MAX_TOKENS=1000
DB_PATH=/var/data/banani.sqlite
DB_SYNC=true
DB_LOGGING=false
PORT=3001
HANDLER_ENCRYPTION_KEY=your-secure-encryption-key-min-32-chars
```

### Setup Steps

1. Log in to Render and create a new Web Service
2. Connect your GitHub repository
3. Configure the following settings:
   - **Name**: `banani-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. Set the environment variables listed above
5. Create a persistent disk for SQLite data:
   - Mount path: `/var/data`
   - Size: 1 GB (minimum)
6. Deploy the service

### CORS Configuration

The backend is configured to accept requests from your Vercel frontend domain. If you're using a custom domain, make sure to update the CORS settings in the backend code if necessary.

## Database Setup

The application uses SQLite, which is a file-based database. On Render, you need to use a persistent disk to store the database file.

Make sure to set the `DB_PATH` environment variable to point to a location on the persistent disk.

## Troubleshooting

If you encounter issues with API connections:

1. Check that your environment variables are set correctly
2. Verify that the `vercel.json` rewrites are correctly configured
3. Check the CORS settings in the backend
4. Examine the logs in both Vercel and Render for specific error messages 