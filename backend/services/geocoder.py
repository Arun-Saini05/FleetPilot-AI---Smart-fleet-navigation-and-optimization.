import os
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models

LOCATIONIQ_API_KEY = os.getenv("LOCATIONIQ_API_KEY")

def resolve_address_to_coords(address: str, db: Session) -> tuple[float, float]:
    """
    Converts a text address query into (latitude, longitude) coordinates.
    Leverages a local database cache first; falls back to LocationIQ Search API on a cache miss.
    """
    if not LOCATIONIQ_API_KEY:
        raise HTTPException(status_code=500, detail="LocationIQ API credential token is missing from system configuration.")

    normalized_query = address.strip().lower()
    
    # 1. Spatial Database Cache Lookup Strategy
    cached_entry = db.query(models.GeocodeCache).filter(
        models.GeocodeCache.address_key == normalized_query
    ).first()
    
    if cached_entry:
        print(f"📡 Database Cache Hit for: '{normalized_query}'")
        return cached_entry.latitude, cached_entry.longitude

    # 2. Cache Miss - Query LocationIQ forward search endpoint
    print(f"🌐 Cache Miss. Contacting LocationIQ Infrastructure for: '{normalized_query}'")
    
    # LocationIQ uses us1.locationiq.com/v1/search for text geocoding addresses
    url = "https://us1.locationiq.com/v1/search"
    params = {
        "key": LOCATIONIQ_API_KEY,
        "q": normalized_query,
        "format": "json",
        "limit": 1
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            
        if response.status_code == 404:
            raise HTTPException(status_code=400, detail=f"LocationIQ could not find any matching points for: '{address}'")
        elif response.status_code != 200:
            raise HTTPException(status_code=502, detail="Upstream LocationIQ network services error response.")
            
        data = response.json()
        if not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=400, detail=f"Invalid parsing response array for address location: '{address}'")
            
        # LocationIQ provides values as text strings inside an object array block
        lat = float(data[0]["lat"])
        lng = float(data[0]["lon"])
        
        # 3. Hydrate cache database table to completely skip future external API processing overhead
        new_cache = models.GeocodeCache(
            address_key=normalized_query,
            latitude=lat,
            longitude=lng
        )
        db.add(new_cache)
        db.commit()
        
        return lat, lng

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"LocationIQ gateway connectivity failed: {str(e)}")