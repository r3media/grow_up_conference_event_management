import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_categories():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Business categories
    business_categories = [
        "Accessories & Consumer Goods",
        "Ancillary Services",
        "Cultivation & Growing",
        "Distribution & Logistics",
        "Equipment & Supplies",
        "Government & Regulatory Bodies",
        "Hemp & Industrial Uses",
        "Investment & Capital",
        "Media & Events",
        "Medical & Pharmaceutical",
        "Packaging & Labeling",
        "Processing & Manufacturing",
        "Research & Education",
        "Retail",
        "Technology & Software",
        "Testing & Compliance",
        "Other"
    ]
    
    # Check if categories already exist
    existing_count = await db.categories.count_documents({"category_type": "business_category"})
    
    if existing_count == 0:
        categories_to_insert = []
        for index, cat_name in enumerate(business_categories):
            category_dict = {
                "id": str(uuid.uuid4()),
                "category_type": "business_category",
                "category_name": cat_name,
                "display_order": index,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            categories_to_insert.append(category_dict)
        
        await db.categories.insert_many(categories_to_insert)
        print(f"✅ Created {len(categories_to_insert)} business categories")
    else:
        print("ℹ️  Business categories already exist")
    
    client.close()
    print("\n✅ Category seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_categories())
