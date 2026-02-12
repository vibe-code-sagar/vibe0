"""
Auth routes — register, login, get_current_user dependency.
Uses passlib for hashing, python-jose for JWT (JWS Compact Serialization).
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from database import get_db, User

# Load environment variables
load_dotenv()

router = APIRouter(tags=["Auth"])

# ── Config ──────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is not set!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10000  # Extended for debugging

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ── Request / Response schemas ──────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ── Helpers ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(email: str) -> str:
    """
    Create JWT access token using JWS Compact Serialization.
    Returns: header.payload.signature format
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "exp": expire
    }
    
    # jwt.encode from python-jose produces JWS Compact Serialization
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"[Auth] ✅ Created JWT token for: {email}")
    print(f"[Auth] Using SECRET_KEY: {SECRET_KEY[:20]}...")
    print(f"[Auth] Token preview: {token[:50]}...")
    
    return token

# ── Dependency: get current user ────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode JWT token and return authenticated user.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials
    
    print(f"\n[Auth] 🔍 Validating token...")
    print(f"[Auth] Token received: {token[:50]}...")
    print(f"[Auth] Using SECRET_KEY: {SECRET_KEY[:20]}...")
    print(f"[Auth] Using ALGORITHM: {ALGORITHM}")
    
    try:
        # Decode JWT (JWS Compact Serialization)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        print(f"[Auth] ✅ Token decoded successfully")
        print(f"[Auth] Email from token: {email}")
        
        if email is None:
            print(f"[Auth] ❌ FAIL: 'sub' claim is missing from token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token - missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except JWTError as e:
        print(f"[Auth] ❌ JWT decode error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Look up user by email
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        print(f"[Auth] ❌ FAIL: User '{email}' not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"[Auth] ✅ User authenticated: {user.email} (id={user.id})")
    return user

# ── Routes ──────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(email=req.email, hashed_password=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"[Auth] 📝 User registered: {user.email} (id={user.id})")
    return {"message": "User registered successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT access token.
    Response format: {"access_token": "...", "token_type": "bearer"}
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        print(f"[Auth] ❌ Login failed for: {req.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create JWT token with email in "sub" claim
    access_token = create_access_token(user.email)
    
    print(f"[Auth] ✅ Login successful: {user.email}")
    
    # Return exact format required by frontend
    return TokenResponse(access_token=access_token, token_type="bearer")


