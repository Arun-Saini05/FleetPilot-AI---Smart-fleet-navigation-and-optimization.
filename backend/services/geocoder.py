import os
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models

HERE_API_KEY = os.getenv("HERE_API_KEY", "")

def resolve_address_to_coords(address: str, db: Session) -> tuple[float, float]:
    """
    Converts a plain text address into (latitude, longitude).
    Checks the local database cache first; falls back to HERE Geocoding API if missing.
    """
    normalized_query = address.strip().lower()

    # 1. Look for cached entry in our local database
    cached_entry = db.query(models.GeocodeCache).filter(
        models.GeocodeCache.address_key == normalized_query
    ).first()

    if cached_entry:
        print(f"📡 Spatial Cache Hit for: '{normalized_query}'")
        return cached_entry.latitude, cached_entry.longitude

    # 2. Cache Miss — check if we have a HERE API key configured
    if not HERE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Geocoding service not configured. "
                f"Please add HERE_API_KEY to your .env file to resolve '{address}'."
            )
        )

    # 3. Execute external REST call to HERE Geocoding API
    print(f"🌐 Cache Miss. Contacting HERE Geocoding Infrastructure for: '{normalized_query}'")
    url = "https://geocode.search.hereapi.com/v1/geocode"
    params = {
        "q": normalized_query,
        "apiKey": HERE_API_KEY
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Upstream Geocoding service returned error {response.status_code}."
            )

        data = response.json()
        if not data.get("items"):
            raise HTTPException(
                status_code=400,
                detail=f"Could not resolve the address location: '{address}'"
            )

        # Extract location coordinates
        position = data["items"][0]["position"]
        lat, lng = position["lat"], position["lng"]

        # 4. Hydrate cache database table to avoid future API hits
        new_cache = models.GeocodeCache(
            address_key=normalized_query,
            latitude=lat,
            longitude=lng
        )
        db.add(new_cache)
        db.commit()
        print(f"✅ Cached new geocode: '{normalized_query}' → ({lat}, {lng})")

        return lat, lng

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Geocoding network gateway connectivity failed: {str(e)}"
        )
