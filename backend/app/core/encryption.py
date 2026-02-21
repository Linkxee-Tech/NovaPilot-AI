import hashlib
import base64
from cryptography.fernet import Fernet
from app.core.config import settings

# Derive a 32-byte key using SHA-256
key_hash = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
FERNET_KEY = base64.urlsafe_b64encode(key_hash)
cipher_suite = Fernet(FERNET_KEY)

def encrypt_data(data: str) -> str:
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    return cipher_suite.decrypt(token.encode()).decode()
