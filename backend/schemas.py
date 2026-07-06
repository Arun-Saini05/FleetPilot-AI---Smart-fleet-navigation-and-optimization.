
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    company_id: int
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# This represents the decoded payload shape used inside the middleware
class TokenData(BaseModel):
    user_id: str
    company_id: int
    role: str