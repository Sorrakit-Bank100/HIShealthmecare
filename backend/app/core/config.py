from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HIS FHIR API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # PostgreSQL connection strings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/his_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/his_db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
