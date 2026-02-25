# VERCEL_DEPLOYMENT_CONFIG

## Vercel Deployment Setup

### Environment Variables

1. **VITE_API_URL**: Set the base URL for the API.
   - Example: `https://api.example.com`

2. **VITE_OTHER_KEY**: Any other required keys for your environment.
   - Example: `your-key`

### Troubleshooting Steps for 404 Errors

1. **Check API URLs**: Ensure that the API endpoints being called match the configured `VITE_API_URL`. 

2. **Inspect Your Routes**: Make sure the routing in your application correctly corresponds with the expected paths. Common causes of 404 errors include typos or incorrect paths.

3. **Deployment Logs**: Review the Vercel deployment logs for any build errors or warnings that might indicate issues with your code.

4. **Check Vercel Settings**: Ensure that your Vercel project settings are properly configured, reflecting the correct project structure.

5. **Clear Cache**: Sometimes, cached versions may lead to unexpected behavior. Clear cache and redeploy if necessary.

6. **Contact Support**: If problems persist, consider contacting Vercel support for further assistance.