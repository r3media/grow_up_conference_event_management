import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if admin user already exists
    existing_admin = await db.users.find_one({"email": "admin@demo.com"})
    
    if not existing_admin:
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@demo.com",
            "name": "Admin User",
            "role": "Super Admin",
            "hashed_password": pwd_context.hash("admin123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created: admin@demo.com / admin123")
    else:
        print("ℹ️  Admin user already exists")
    
    # Create some demo contacts
    contact_count = await db.contacts.count_documents({})
    if contact_count == 0:
        admin_id = (await db.users.find_one({"email": "admin@demo.com"}))["id"]
        
        demo_contacts = [
            {
                "id": str(uuid.uuid4()),
                "name": "Sarah Johnson",
                "email": "sarah.johnson@techcorp.com",
                "phone": "+1 (555) 123-4567",
                "company": "TechCorp Industries",
                "position": "CEO",
                "tags": ["speaker", "vip"],
                "notes": "Keynote speaker for opening session",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin_id
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Michael Chen",
                "email": "m.chen@innovate.io",
                "phone": "+1 (555) 234-5678",
                "company": "Innovate Solutions",
                "position": "CTO",
                "tags": ["speaker", "sponsor"],
                "notes": "Panel discussion on AI trends",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin_id
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Emily Rodriguez",
                "email": "emily.r@startup.ventures",
                "phone": "+1 (555) 345-6789",
                "company": "Startup Ventures",
                "position": "Founder",
                "tags": ["attendee"],
                "notes": "Interested in networking opportunities",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin_id
            }
        ]
        
        await db.contacts.insert_many(demo_contacts)
        print(f"✅ Created {len(demo_contacts)} demo contacts")
    else:
        print("ℹ️  Contacts already exist")
    
    # Create some demo companies
    company_count = await db.companies.count_documents({})
    if company_count == 0:
        admin_id = (await db.users.find_one({"email": "admin@demo.com"}))["id"]
        
        demo_companies = [
            {
                "id": str(uuid.uuid4()),
                "name": "TechCorp Industries",
                "website": "https://techcorp.example.com",
                "industry": "Technology",
                "description": "Leading provider of enterprise software solutions",
                "contacts_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin_id
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Innovate Solutions",
                "website": "https://innovate.example.com",
                "industry": "AI & Machine Learning",
                "description": "Cutting-edge AI solutions for businesses",
                "contacts_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin_id
            }
        ]
        
        await db.companies.insert_many(demo_companies)
        print(f"✅ Created {len(demo_companies)} demo companies")
    else:
        print("ℹ️  Companies already exist")
    
    client.close()
    print("\n✅ Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())
