#!/usr/bin/env python3
"""Seed script for departments"""
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

DEPARTMENTS = [
    "Sales",
    "Marketing",
    "Operations",
    "Finance",
    "Human Resources",
    "Customer Service",
    "IT",
    "Executive",
    "Event Management",
    "Registration",
]

async def seed_departments():
    print("Seeding departments...")
    
    # Remove existing department categories
    await db.categories.delete_many({"category_type": "department"})
    
    for i, dept in enumerate(DEPARTMENTS):
        category = {
            "id": str(uuid.uuid4()),
            "category_type": "department",
            "category_name": dept,
            "display_order": i,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(category)
        print(f"  Created: {dept}")
    
    print(f"Successfully seeded {len(DEPARTMENTS)} departments!")

if __name__ == "__main__":
    asyncio.run(seed_departments())
