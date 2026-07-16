import os
import uuid
from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from hermes_cli.config import load_config

def _extract_model_string(model_value) -> str:
    """Extract the model string from config, handling both str and dict formats.

    Config can be either:
      model: "claude-opus-4-6"                    # flat string
      model: { default: "claude-opus-4-6", provider: "anthropic" }  # nested dict
    """
    if isinstance(model_value, str):
        return model_value
    if isinstance(model_value, dict):
        return model_value.get("default", model_value.get("model", ""))
    return ""


def _extract_provider_string(config: dict) -> str:
    """Extract provider from config, checking both top-level and nested model dict."""
    model_value = config.get("model")
    if isinstance(model_value, dict):
        provider = model_value.get("provider", "")
        if provider:
            return provider
    return config.get("provider", os.getenv("HERMES_PROVIDER", "anthropic"))


try:
    from gateway.run import _resolve_model, _resolve_runtime_agent_kwargs
except ImportError:
    def _resolve_model() -> str:
        config = load_config()
        raw = config.get("model", os.getenv("HERMES_MODEL", "claude-sonnet-4-5"))
        return _extract_model_string(raw) or "claude-sonnet-4-5"

    def _resolve_runtime_agent_kwargs() -> dict:
        config = load_config()
        return {"provider": _extract_provider_string(config)}
from hermes_state import SessionDB
from run_agent import AIAgent
from tools.memory_tool import MemoryStore


WEB_SOURCE = "web"


@lru_cache(maxsize=1)
def get_session_db() -> SessionDB:
    return SessionDB()


@lru_cache(maxsize=1)
def get_memory_store() -> MemoryStore:
    store = MemoryStore()
    store.load_from_disk()
    return store


def reload_memory_store() -> MemoryStore:
    store = get_memory_store()
    store.load_from_disk()
    return store


def get_config() -> dict[str, Any]:
    return load_config()


def get_runtime_model() -> str:
    """Return the configured model as a plain string, re-reading config each time.

    Some code paths return a dict {'default': '...', 'provider': '...'} instead
    of a bare string. We normalize here so callers always get a usable model ID.
    """
    raw = _resolve_model()
    return _extract_model_string(raw) or "claude-sonnet-4-5"


def get_runtime_agent_kwargs() -> dict[str, Any]:
    """Return runtime kwargs (provider, base_url, etc.), always fresh."""
    return _resolve_runtime_agent_kwargs()


def _agent_kwargs_from_runtime(runtime: dict[str, Any]) -> dict[str, Any]:
    """Keep only runtime fields accepted by ``AIAgent``."""
    return {
        "api_key": runtime.get("api_key"),
        "base_url": runtime.get("base_url"),
        "provider": runtime.get("provider"),
        "api_mode": runtime.get("api_mode"),
        "command": runtime.get("command"),
        "args": list(runtime.get("args") or []),
        "credential_pool": runtime.get("credential_pool"),
    }


def _resolve_request_model_runtime(
    model: str | None,
    runtime_kwargs: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    """Route provider-qualified web model selections to matching credentials.

    The portal persists model choices as ``provider/model`` (for example,
    ``anthropic/claude-opus-4-6`` or ``openai/gpt-5.4``).  Historically the
    web API changed only the model string and kept the configured provider,
    which could send an OpenAI model to Anthropic.  Resolve the two native
    providers exposed by the portal per request while leaving unqualified and
    custom model names on the configured runtime.
    """
    effective_model = (model or get_runtime_model()).strip()
    if not model or not effective_model:
        return effective_model, runtime_kwargs

    from hermes_cli.model_normalize import detect_vendor, normalize_model_for_provider
    from hermes_cli.runtime_provider import resolve_runtime_provider

    vendor = detect_vendor(effective_model)
    if vendor == "anthropic":
        runtime = resolve_runtime_provider(
            requested="anthropic",
            target_model=effective_model,
        )
        provider = str(runtime.get("provider") or "anthropic")
        return normalize_model_for_provider(effective_model, provider), _agent_kwargs_from_runtime(runtime)

    if vendor == "openai":
        # Direct OpenAI API-key access is represented as a host-gated custom
        # runtime in Hermes.  The resolver will only attach OPENAI_API_KEY when
        # this URL belongs to OpenAI, preventing credential leakage.
        base_url = os.getenv("OPENAI_BASE_URL", "").strip() or "https://api.openai.com/v1"
        bare_model = effective_model.split("/", 1)[-1]
        runtime = resolve_runtime_provider(
            requested="custom",
            explicit_base_url=base_url,
            target_model=bare_model,
        )
        return bare_model, _agent_kwargs_from_runtime(runtime)

    return effective_model, runtime_kwargs


def create_agent(
    *,
    session_id: str,
    session_db: SessionDB,
    model: str | None = None,
    ephemeral_system_prompt: str | None = None,
    enabled_toolsets: list[str] | None = None,
    disabled_toolsets: list[str] | None = None,
    skip_context_files: bool = False,
    skip_memory: bool = False,
    stream_callback=None,
    tool_progress_callback=None,
    thinking_callback=None,
    reasoning_callback=None,
    step_callback=None,
) -> AIAgent:
    runtime_kwargs = get_runtime_agent_kwargs()
    effective_model, runtime_kwargs = _resolve_request_model_runtime(model, runtime_kwargs)
    from hermes_cli.fallback_config import get_fallback_chain

    fallback_chain = get_fallback_chain(get_config())
    max_iterations = int(os.getenv("HERMES_MAX_ITERATIONS", "90"))

    return AIAgent(
        model=effective_model,
        **runtime_kwargs,
        fallback_model=fallback_chain or None,
        max_iterations=max_iterations,
        quiet_mode=True,
        verbose_logging=False,
        ephemeral_system_prompt=ephemeral_system_prompt,
        session_id=session_id,
        platform="webapi",
        session_db=session_db,
        enabled_toolsets=enabled_toolsets,
        disabled_toolsets=disabled_toolsets,
        skip_context_files=skip_context_files,
        skip_memory=skip_memory,
        tool_progress_callback=tool_progress_callback,
        thinking_callback=thinking_callback,
        reasoning_callback=reasoning_callback,
        step_callback=step_callback,
    )


def get_session_or_404(session_id: str, session_db: SessionDB | None = None) -> dict[str, Any]:
    db = session_db or get_session_db()
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return session


def ensure_session_title(session_db: SessionDB, title: str | None) -> str | None:
    cleaned = session_db.sanitize_title(title)
    if cleaned:
        return cleaned
    return session_db.get_next_title_in_lineage("New Chat")


def new_session_id() -> str:
    return f"sess_{uuid.uuid4().hex}"
