import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_contacts():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get first company
    company = await db.companies.find_one({})
    if company:
        # Update all contacts without company_id
        result = await db.contacts.update_many(
            {'company_id': {'$exists': False}},
            {'$set': {'company_id': company['id']}}
        )
        print(f'✅ Updated {result.modified_count} contacts with company_id')
    else:
        print('No company found')
    
    client.close()

asyncio.run(fix_contacts())
