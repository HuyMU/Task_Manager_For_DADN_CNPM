from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import auth, roles, users, tasks
from app.core.exceptions import CredentialsException, AdminAcessException, EntityNotFoundException
from fastapi.responses import JSONResponse

app = FastAPI(title="Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers map to the old express logic shape
@app.exception_handler(CredentialsException)
async def auth_exception_handler(request, exc: CredentialsException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "Invalid token."}
    )

@app.exception_handler(AdminAcessException)
async def admin_auth_exception_handler(request, exc: AdminAcessException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "Access denied. Requires admin role."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(tasks.router)

# Serve static frontend
# Express does: app.use(express.static('public'));
public_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public")
if os.path.isdir(public_dir):
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")
