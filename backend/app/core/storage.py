import logging
import os
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Initialize boto3 client
        self.client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    async def upload_file(self, file_path: str, destination: str) -> str:
        """
        Uploads a file to S3.
        Returns the public URL of the uploaded file.
        """
        try:
            self.client.upload_file(file_path, self.bucket_name, destination)
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{destination}"
        except ClientError as e:
            logger.error(f"S3 Upload failed: {e}")
            return f"local://{destination}"

    async def save_screenshot(self, binary_data: bytes, trace_id: str) -> str:
        """
        Saves a screenshot for audit evidence to S3.
        """
        filename = f"audit/evidence_{trace_id}.png"
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=binary_data,
                ContentType='image/png'
            )
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        except ClientError as e:
            logger.error(f"S3 Screenshot save failed: {e}")
            return f"local://{filename}"

storage_service = StorageService()

