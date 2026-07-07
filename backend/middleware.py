import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import schemas

# Tell FastAPI to search for a "Bearer <token>" in the incoming Request Authorization Headers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

from security import SECRET_KEY, ALGORITHM

def get_current_tenant(token: str = Depends(oauth2_scheme)) -> schemas.TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode using the exact same configuration keys
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id: str = str(payload.get("sub"))
        company_id: int = payload.get("company_id")
        role: str = payload.get("role")
        
        if user_id is None or company_id is None:
            raise credentials_exception
            
        return schemas.TokenData(user_id=user_id, company_id=company_id, role=role)
        
    except JWTError:
        raise credentials_exception