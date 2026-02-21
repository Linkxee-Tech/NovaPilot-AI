import boto3
import json
import os
from typing import Dict, Any, Optional
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class SecretsManager:
    """
    AWS Secrets Manager integration with .env fallback for local development.
    """
    
    def __init__(self, region_name: str = "us-east-1"):
        self.region_name = region_name
        self.client = None
        self._use_aws = os.getenv("USE_AWS_SECRETS", "false").lower() == "true"
        
        if self._use_aws:
            try:
                self.client = boto3.client(
                    service_name='secretsmanager',
                    region_name=self.region_name
                )
                logger.info("AWS Secrets Manager client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize AWS Secrets Manager: {e}. Falling back to .env")
                self._use_aws = False
    
    @lru_cache(maxsize=32)
    def get_secret(self, secret_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve secret from AWS Secrets Manager or .env fallback.
        
        Args:
            secret_name: Name of the secret in AWS Secrets Manager
            
        Returns:
            Dictionary containing secret key-value pairs
        """
        if self._use_aws and self.client:
            try:
                response = self.client.get_secret_value(SecretId=secret_name)
                
                if 'SecretString' in response:
                    secret = json.loads(response['SecretString'])
                    logger.info(f"Retrieved secret '{secret_name}' from AWS Secrets Manager")
                    return secret
                else:
                    # Binary secrets not supported in this implementation
                    logger.error(f"Binary secrets not supported for '{secret_name}'")
                    return None
                    
            except Exception as e:
                logger.error(f"Error retrieving secret '{secret_name}' from AWS: {e}")
                return None
        else:
            logger.info(f"Using .env for secret '{secret_name}' (AWS Secrets Manager disabled)")
            return None
    
    def get_secret_value(self, secret_name: str, key: str, default: Any = None) -> Any:
        """
        Get a specific value from a secret.
        
        Args:
            secret_name: Name of the secret
            key: Key within the secret
            default: Default value if not found
            
        Returns:
            Secret value or default
        """
        secret = self.get_secret(secret_name)
        if secret:
            return secret.get(key, default)
        
        # Fallback to environment variable
        env_key = f"{secret_name.upper()}_{key.upper()}"
        return os.getenv(env_key, default)


# Global instance
_secrets_manager: Optional[SecretsManager] = None

def get_secrets_manager() -> SecretsManager:
    """Get or create the global SecretsManager instance."""
    global _secrets_manager
    if _secrets_manager is None:
        region = os.getenv("AWS_REGION", "us-east-1")
        _secrets_manager = SecretsManager(region_name=region)
    return _secrets_manager
