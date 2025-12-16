#!/usr/bin/env python3
"""Seed script for exhibit history categories"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EXHIBIT_HISTORY_OPTIONS = [
    "2017 Grow Up",
    "2017 Ocannabiz",
    "2018 Grow Up",
    "2018 Ocannabiz",
    "2019 Grow Up",
    "2019 Ocannabiz",
    "2020 Grow Up",
    "2020 Ocannabiz",
    "2021 Grow Up",
    "2022 Grow Up Niagara",
    "2022 Grow Up Victoria",
    "2023 Grow Up Victoria",
    "2023 Grow Up Edmonton",
    "2024 Grow Up Toronto",
    "2024 Grow Up Edmonton",
    "2025 Grow Up Toronto",
    "2026 Grow Up Vancouver",
    "2027 Grow Up Toronto",
]

async def seed_exhibit_history():
    print("Seeding exhibit history options...")
    
    # Remove existing exhibit_history categories
    await db.categories.delete_many({"category_type": "exhibit_history"})
    
    for i, event in enumerate(EXHIBIT_HISTORY_OPTIONS):
        category = {
            "id": str(uuid.uuid4()),
            "category_type": "exhibit_history",
            "category_name": event,
            "display_order": i,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(category)
        print(f"  Created: {event}")
    
    print(f"Successfully seeded {len(EXHIBIT_HISTORY_OPTIONS)} exhibit history options!")

if __name__ == "__main__":
    asyncio.run(seed_exhibit_history())
