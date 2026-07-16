from __future__ import annotations

from typing import Any

import webapi.deps as deps


class FakeAgent:
    def __init__(self, **kwargs: Any) -> None:
        self.kwargs = kwargs


def _configured_anthropic_runtime() -> dict[str, Any]:
    return {
        "provider": "anthropic",
        "api_mode": "anthropic_messages",
        "base_url": "https://api.anthropic.com",
        "api_key": "anthropic-test-key",
    }


def test_create_agent_routes_openai_model_to_direct_openai(monkeypatch):
    calls: list[dict[str, Any]] = []

    def fake_resolve_runtime_provider(**kwargs: Any) -> dict[str, Any]:
        calls.append(kwargs)
        return {
            "provider": "custom",
            "api_mode": "codex_responses",
            "base_url": "https://api.openai.com/v1",
            "api_key": "openai-test-key",
        }

    monkeypatch.setattr(deps, "AIAgent", FakeAgent)
    monkeypatch.setattr(deps, "get_runtime_agent_kwargs", _configured_anthropic_runtime)
    monkeypatch.setattr(
        "hermes_cli.runtime_provider.resolve_runtime_provider",
        fake_resolve_runtime_provider,
    )

    agent = deps.create_agent(
        session_id="openai-smoke",
        session_db=object(),
        model="openai/gpt-5.4",
    )

    assert calls == [
        {
            "requested": "custom",
            "explicit_base_url": "https://api.openai.com/v1",
            "target_model": "gpt-5.4",
        }
    ]
    assert agent.kwargs["provider"] == "custom"
    assert agent.kwargs["api_mode"] == "codex_responses"
    assert agent.kwargs["model"] == "gpt-5.4"


def test_create_agent_routes_anthropic_model_to_native_anthropic(monkeypatch):
    calls: list[dict[str, Any]] = []

    def fake_resolve_runtime_provider(**kwargs: Any) -> dict[str, Any]:
        calls.append(kwargs)
        return _configured_anthropic_runtime()

    monkeypatch.setattr(deps, "AIAgent", FakeAgent)
    monkeypatch.setattr(deps, "get_runtime_agent_kwargs", lambda: {"provider": "custom"})
    monkeypatch.setattr(
        "hermes_cli.runtime_provider.resolve_runtime_provider",
        fake_resolve_runtime_provider,
    )

    agent = deps.create_agent(
        session_id="anthropic-smoke",
        session_db=object(),
        model="anthropic/claude-opus-4.6",
    )

    assert calls == [
        {
            "requested": "anthropic",
            "target_model": "anthropic/claude-opus-4.6",
        }
    ]
    assert agent.kwargs["provider"] == "anthropic"
    assert agent.kwargs["api_mode"] == "anthropic_messages"
    assert agent.kwargs["model"] == "claude-opus-4-6"


def test_create_agent_keeps_unknown_model_on_configured_runtime(monkeypatch):
    monkeypatch.setattr(deps, "AIAgent", FakeAgent)
    monkeypatch.setattr(deps, "get_runtime_agent_kwargs", _configured_anthropic_runtime)

    agent = deps.create_agent(
        session_id="custom-smoke",
        session_db=object(),
        model="company-private-model",
    )

    assert agent.kwargs["provider"] == "anthropic"
    assert agent.kwargs["model"] == "company-private-model"


def test_create_agent_loads_configured_fallback_chain(monkeypatch):
    monkeypatch.setattr(deps, "AIAgent", FakeAgent)
    monkeypatch.setattr(deps, "get_runtime_agent_kwargs", _configured_anthropic_runtime)
    monkeypatch.setattr(
        deps,
        "get_config",
        lambda: {
            "fallback_providers": [
                {"provider": "anthropic", "model": "claude-opus-4-8"}
            ]
        },
    )

    agent = deps.create_agent(
        session_id="fallback-smoke",
        session_db=object(),
        model="company-private-model",
    )

    assert agent.kwargs["fallback_model"] == [
        {"provider": "anthropic", "model": "claude-opus-4-8"}
    ]
