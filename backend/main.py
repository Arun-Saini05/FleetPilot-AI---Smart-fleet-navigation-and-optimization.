from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import security
import schemas
from middleware import get_current_tenant

app = FastAPI(title="FleetPilot API")

# ── CORS ──────────────────────────────────────────────────────────
# Allow the Vite dev server (port 5173) and any localhost variant
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ──────────────────────────────────────────────────────────

# POST /api/login — Generates a signed JWT for the client
@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Accepts username (email) + password via OAuth2PasswordRequestForm.
    Returns a signed JWT access_token.

    NOTE: Currently simulates a successful login for any credentials
    while the real user DB / password verification is wired up.
    """
    access_token = security.create_access_token(
        data={
            "sub": form_data.username,
            "company_id": 1,
            "role": "fleet_admin",
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


# GET /api/test-gatekeeper — Validates the token and returns tenant info
@app.get("/api/test-gatekeeper")
def test_gatekeeper(
    current_tenant: schemas.TokenData = Depends(get_current_tenant),
):
    return {
        "status": "Token Verified Successfully!",
        "extracted_company_id": current_tenant.company_id,
        "extracted_role": current_tenant.role,
        "extracted_user": current_tenant.user_id,
    }