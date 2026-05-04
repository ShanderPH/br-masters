import json

from django.test import Client


def test_health_endpoint_returns_200():
    client = Client()
    response = client.get("/health/")
    assert response.status_code == 200


def test_health_endpoint_payload():
    client = Client()
    response = client.get("/health/")
    data = json.loads(response.content)
    assert data["status"] == "healthy"
    assert data["service"] == "br-masters-api"
