# IONOS DNS Update Guide for NovaPilot AI

The domain `novapilot.ai` is currently managed by IONOS nameservers. To complete the production deployment (SSL/HTTPS and custom domain), you must perform the following actions in your IONOS Control Panel.

## Option A: Keep IONOS for DNS (Recommended for simplicity)

Add the following **CNAME** records to your IONOS DNS settings to validate the SSL certificate and point the domain to CloudFront.

### 1. SSL Certificate Validation (ACM)
| Host / Name | Type | Value |
| :--- | :--- | :--- |
| `_a36bdacc181b5ac2e9e64de034e06fd9` | CNAME | `_5d3dd2fe594a68a449009313dcbbad05.jkddzztszm.acm-validations.aws.` |
| `_dd9cbe75f3110ab5c0263de8e3f2f838.www` | CNAME | `_08f8a99eacd9d7ea462296b5dcfa2425.jkddzztszm.acm-validations.aws.` |

### 2. Point Domain to CloudFront
After the certificate status becomes **ISSUED** (usually within 30 minutes of adding the records above), add these records:

| Host / Name | Type | Value |
| :--- | :--- | :--- |
| `@` (Root) | CNAME / A (ALIAS) | `d2v9dvboqxqocd.cloudfront.net.` |
| `www` | CNAME | `d2v9dvboqxqocd.cloudfront.net.` |

---

## Option B: Move DNS to AWS Route53 (Recommended for full AWS integration)

1. Create a **Public Hosted Zone** in Route53 for `novapilot.ai`.
2. Note the 4 Name Servers (NS) provided by Route53.
3. In IONOS, change the Name Servers for `novapilot.ai` to the 4 AWS Name Servers.
4. Once propagation is complete (can take up to 24h), AWS will automatically handle DNS validation for ACM.

---

> [!IMPORTANT]
> **Database Password Fix Required**
> The backend is currently reporting a "Database authentication failure". Please update the `DATABASE_URL` or `POSTGRES_PASSWORD` environment variable in the Elastic Beanstalk console with the correct production password.
