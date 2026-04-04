from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_host: str = "localhost"
    db_user: str = "root"
    db_password: str = ""
    db_port: int = 3306
    db_name: str = "task_manager_db"
    
    jwt_secret: str = "fallback_secret"
    
    discord_webhook_url: str = ""
    
    model_config = SettingsConfigDict(
        env_file="../.env", # Assuming running from the backend directory, .env is at root
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
