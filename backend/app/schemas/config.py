from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class FrontendConfigResponse(BaseModel):
    config: Dict[str, Any] = Field(default_factory=dict)
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None


class FrontendConfigUpdateRequest(BaseModel):
    config: Dict[str, Any] = Field(default_factory=dict)

