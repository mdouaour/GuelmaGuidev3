import boto3
from botocore.config import Config
from fastapi import UploadFile, HTTPException
import uuid
import mimetypes
from app.core.config import settings

class StorageService:
    def __init__(self):
        if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY, settings.R2_BUCKET_NAME]):
            self.client = None
            return

        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.NEXT_PUBLIC_R2_PUBLIC_URL or f"https://{self.bucket_name}.r2.cloudflarestorage.com"
        
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    async def upload_image(self, file: UploadFile, folder: str = "places") -> str:
        if not self.client:
            raise HTTPException(status_code=500, detail="Storage service not configured")
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}")
        
        # Validate file size (5MB max)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max size is 5MB")
        
        await file.seek(0)
        
        # Generate unique filename
        extension = mimetypes.guess_extension(file.content_type) or ".jpg"
        file_key = f"{folder}/{uuid.uuid4()}{extension}"
        
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=file.content_type,
            )
        except Exception as e:
            print(f"R2 Upload Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload image")
            
        return f"{self.public_url}/{file_key}"

    def delete_image(self, url: str):
        if not self.client:
            return
            
        # Extract key from URL
        if not url.startswith(self.public_url):
            return
            
        file_key = url.replace(f"{self.public_url}/", "")
        
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key,
            )
        except Exception as e:
            print(f"R2 Delete Error: {e}")

storage_service = StorageService()
