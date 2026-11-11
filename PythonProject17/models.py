# models.py
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator

from config import (
    KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES,
    KIRIKO_MAX_BRAIN_MEMORIES,
)

Character = Literal["rin", "sayo", "shunv"]


class ChatRequest(BaseModel):
    character: Character
    message: str = Field(min_length=1, max_length=2000)
    user_id: str = Field(pattern=r"^\d{1,10}$")
    user_name: Optional[str] = Field(default=None, max_length=50)
    conversations: List[Dict[str, Any]] = Field(
        default_factory=list, max_length=KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES
    )
    memories: List[str] = Field(
        default_factory=list, max_length=KIRIKO_MAX_BRAIN_MEMORIES
    )
    user_location: Optional[str] = Field(default=None, max_length=50)
    chat_mode: Optional[Literal["online", "offline"]] = None
    ai_tier: Literal["free", "ops"] = "free"
    purchase_history: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, max_length=5
    )

    @field_validator("conversations")
    @classmethod
    def validate_conversations(cls, value: List[Dict[str, Any]]):
        for message in value:
            if message.get("role") not in ("user", "assistant"):
                raise ValueError("非法的对话角色")
            if len(message.get("content", "")) > 2000:
                raise ValueError("对话内容过长")
        return value

    @field_validator("memories")
    @classmethod
    def validate_memories(cls, value: List[str]):
        if any(len(memory) > 1000 for memory in value):
            raise ValueError("大脑记忆过长")
        return value


class ChatResponse(BaseModel):
    reply: str
    character: str
    success: bool
    elapsed_time: float


class MemoryRequest(BaseModel):
    character: Character
    user_id: str = Field(pattern=r"^\d{1,10}$")
    user_name: Optional[str] = Field(default=None, max_length=50)
    recent_dialogue: List[Dict[str, Any]] = Field(
        max_length=KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES
    )
    existing_memories: List[str] = Field(
        default_factory=list, max_length=KIRIKO_MAX_BRAIN_MEMORIES
    )
    total_memories: Optional[int] = Field(
        default=0, ge=0, le=KIRIKO_MAX_BRAIN_MEMORIES
    )
    max_memories: Optional[int] = Field(
        default=KIRIKO_MAX_BRAIN_MEMORIES,
        ge=1,
        le=KIRIKO_MAX_BRAIN_MEMORIES,
    )
    user_location: str = Field(default="未指定", max_length=50)
    ai_tier: Literal["free", "ops"] = "free"

    @field_validator("recent_dialogue")
    @classmethod
    def validate_recent_dialogue(cls, value: List[Dict[str, Any]]):
        for message in value:
            if message.get("role") not in ("user", "assistant"):
                raise ValueError("非法的对话角色")
            if len(message.get("content", "")) > 2000:
                raise ValueError("对话内容过长")
        return value

    @field_validator("existing_memories")
    @classmethod
    def validate_existing_memories(cls, value: List[str]):
        if any(len(memory) > 1000 for memory in value):
            raise ValueError("大脑记忆过长")
        return value


class MemoryResponse(BaseModel):
    memories: Dict[str, Any]
    success: bool
