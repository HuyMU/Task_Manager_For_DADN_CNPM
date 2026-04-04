from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.schemas.user import TokenPayload
from app.core.exceptions import CredentialsException, AdminAcessException
from app.models.user import RoleEnum

oauth2_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> TokenPayload:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id: int = payload.get("id")
        if user_id is None:
            raise CredentialsException()
        token_data = TokenPayload(**payload)
        return token_data
    except JWTError:
        raise CredentialsException()

def require_admin(current_user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
    if current_user.role != RoleEnum.admin:
        raise AdminAcessException()
    return current_user
