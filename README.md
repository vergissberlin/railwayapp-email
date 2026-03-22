# Railway Email Service

Deploy a lightweight transactional email API on Railway.

## Features

* JSON API endpoint for registration emails
* Health endpoint at `/healthz`
* Runtime configuration via environment variables
* Railway config as code via `railway.toml`

## Required variables

```bash
PORT=8080
EMAIL_SERVICE_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_CLIENT_USER=your-user@example.com
EMAIL_CLIENT_PASSWORD=your-app-password
EMAIL_CLIENT_FROM="Your App <noreply@example.com>"
```

## Production recommendations (Railway)

* Keep credentials only in Railway Variables
* Never commit `.env` files with real SMTP credentials
* Use app passwords or provider-specific API keys
* Monitor `/healthz` in Railway healthchecks
