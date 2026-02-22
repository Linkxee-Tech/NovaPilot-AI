# AWS Secrets Manager Setup

Use this only for deployed environments. Local development should use `backend/.env`.

## 1. Keep Local Mode (Default)

```env
USE_AWS_SECRETS=false
```

## 2. Create Secret

Create a JSON secret (example name: `novapilot/production`) with keys used by the app:

```json
{
  "SECRET_KEY": "<strong-random-secret>",
  "ENCRYPTION_KEY": "<fernet-key>",
  "POSTGRES_SERVER": "<db-host>",
  "POSTGRES_USER": "<db-user>",
  "POSTGRES_PASSWORD": "<db-password>",
  "POSTGRES_DB": "<db-name>",
  "REDIS_URL": "redis://<redis-host>:6379/0"
}
```

CLI example:

```bash
aws secretsmanager create-secret \
  --name novapilot/production \
  --secret-string file://secret.json
```

## 3. Enable Secrets in Runtime

```env
USE_AWS_SECRETS=true
AWS_REGION=us-east-1
AWS_SECRET_NAME=novapilot/production
```

## 4. IAM Permissions

Attach a policy that allows:
- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`

Limit `Resource` to your secret ARN.

## 5. Verify Access

```bash
aws secretsmanager get-secret-value \
  --secret-id novapilot/production \
  --region us-east-1
```

## Notes

- Prefer IAM roles over static AWS access keys.
- Do not store AWS access keys inside the same secret unless strictly required.
- The app falls back to `.env` values if secret retrieval fails.
