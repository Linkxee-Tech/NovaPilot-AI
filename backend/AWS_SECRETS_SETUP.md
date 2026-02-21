# AWS Secrets Manager Setup Guide

## Overview
NovaPilot AI now supports AWS Secrets Manager for secure credential management in production environments.

## Local Development (Default)
By default, the application uses `.env` file for configuration:
```bash
USE_AWS_SECRETS=false
```

## Production Setup

### 1. Create Secret in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
    --name novapilot/production \
    --description "NovaPilot AI production secrets" \
    --secret-string '{
        "SECRET_KEY": "your-production-secret-key-min-32-chars",
        "ENCRYPTION_KEY": "your-fernet-key-base64-encoded-32-bytes",
        "POSTGRES_SERVER": "your-rds-endpoint.amazonaws.com",
        "POSTGRES_USER": "novapilot_user",
        "POSTGRES_PASSWORD": "your-secure-db-password",
        "POSTGRES_DB": "novapilot_prod",
        "AWS_ACCESS_KEY_ID": "your-aws-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-aws-secret-key",
        "REDIS_URL": "redis://your-elasticache-endpoint:6379/0"
    }'
```

### 2. Generate Fernet Encryption Key

```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Use this for ENCRYPTION_KEY
```

### 3. Enable AWS Secrets Manager

Set environment variable:
```bash
USE_AWS_SECRETS=true
AWS_REGION=us-east-1
AWS_SECRET_NAME=novapilot/production
```

### 4. IAM Permissions

Ensure your EC2 instance role or ECS task role has:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:novapilot/production-*"
        }
    ]
}
```

## How It Works

1. **Development**: Reads from `.env` file
2. **Production**: 
   - If `USE_AWS_SECRETS=true`, fetches from AWS Secrets Manager
   - Falls back to `.env` if AWS fetch fails
   - Caches secrets for performance

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_AWS_SECRETS` | No | Enable AWS Secrets Manager (default: false) |
| `AWS_SECRET_NAME` | Yes* | Secret name in AWS (default: novapilot/production) |
| `AWS_REGION` | Yes* | AWS region (default: us-east-1) |

*Required when `USE_AWS_SECRETS=true`

## Testing

Test AWS Secrets Manager integration:
```python
from app.core.secrets_manager import get_secrets_manager

sm = get_secrets_manager()
secrets = sm.get_secret("novapilot/production")
print(secrets)
```

## Security Best Practices

1. ✅ Never commit `.env` to version control
2. ✅ Use IAM roles instead of hardcoded AWS credentials
3. ✅ Rotate secrets regularly via AWS Secrets Manager
4. ✅ Use different secrets for dev/staging/production
5. ✅ Enable CloudTrail logging for secret access
