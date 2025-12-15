from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Password utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Dependency for role check
def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Models
class AddressModel(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Canada"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = Field(default="Staff")  # Super Admin, Event Manager, Conference Manager, Registration Manager, Staff
    photo_url: Optional[str] = None
    mobile_phone: Optional[str] = None
    address: Optional[AddressModel] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    tags: List[str] = []
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    photo_url: Optional[str] = None
    mobile_phone: Optional[str] = None
    address: Optional[AddressModel] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class ContactBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_id: str  # Required - FK to Company
    position: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_id: Optional[str] = None
    position: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class Contact(ContactBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: Optional[str] = None  # Populated from company lookup
    created_at: datetime
    updated_at: datetime
    created_by: str

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    category: Optional[str] = None  # Business category from settings
    description: Optional[str] = None
    address: Optional[AddressModel] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[AddressModel] = None

class Company(CompanyBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    contacts_count: int = 0
    created_at: datetime
    updated_at: datetime
    created_by: str

class CategoryBase(BaseModel):
    category_type: str  # e.g., "business_category", "user_department", etc.
    category_name: str
    display_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime
    updated_at: datetime

class StatsResponse(BaseModel):
    total_users: int
    total_contacts: int
    total_companies: int
    active_events: int

# Authentication Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "photo_url": user_data.photo_url,
        "mobile_phone": user_data.mobile_phone,
        "address": user_data.address.model_dump() if user_data.address else None,
        "job_title": user_data.job_title,
        "department": user_data.department,
        "tags": user_data.tags,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Return user without password
    return User(
        id=user_dict["id"],
        email=user_dict["email"],
        name=user_dict["name"],
        role=user_dict["role"],
        photo_url=user_dict.get("photo_url"),
        mobile_phone=user_dict.get("mobile_phone"),
        address=AddressModel(**user_dict["address"]) if user_dict.get("address") else None,
        job_title=user_dict.get("job_title"),
        department=user_dict.get("department"),
        tags=user_dict.get("tags", []),
        is_active=user_dict["is_active"],
        created_at=datetime.fromisoformat(user_dict["created_at"]),
        updated_at=datetime.fromisoformat(user_dict["updated_at"])
    )

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account is disabled")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return LoginResponse(
        access_token=access_token,
        user=User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            is_active=user["is_active"],
            created_at=datetime.fromisoformat(user["created_at"]),
            updated_at=datetime.fromisoformat(user["updated_at"])
        )
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        photo_url=current_user.get("photo_url"),
        mobile_phone=current_user.get("mobile_phone"),
        address=AddressModel(**current_user["address"]) if current_user.get("address") else None,
        job_title=current_user.get("job_title"),
        department=current_user.get("department"),
        tags=current_user.get("tags", []),
        is_active=current_user["is_active"],
        created_at=datetime.fromisoformat(current_user["created_at"]),
        updated_at=datetime.fromisoformat(current_user["updated_at"])
    )

# User Management Routes
@api_router.get("/users", response_model=List[User])
async def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    department: Optional[str] = None,
    current_user: dict = Depends(require_role(["Super Admin", "Event Manager"]))
):
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"job_title": {"$regex": search, "$options": "i"}}
        ]
    
    if role:
        query["role"] = role
    
    if department:
        query["department"] = department
    
    users = await db.users.find(query, {"_id": 0, "hashed_password": 0}).to_list(1000)
    return [
        User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            photo_url=user.get("photo_url"),
            mobile_phone=user.get("mobile_phone"),
            address=AddressModel(**user["address"]) if user.get("address") else None,
            job_title=user.get("job_title"),
            department=user.get("department"),
            tags=user.get("tags", []),
            is_active=user["is_active"],
            created_at=datetime.fromisoformat(user["created_at"]),
            updated_at=datetime.fromisoformat(user["updated_at"])
        )
        for user in users
    ]

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: dict = Depends(require_role(["Super Admin"]))):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "photo_url": user_data.photo_url,
        "mobile_phone": user_data.mobile_phone,
        "address": user_data.address.model_dump() if user_data.address else None,
        "job_title": user_data.job_title,
        "department": user_data.department,
        "tags": user_data.tags,
        "hashed_password": hashed_password,
        "is_active": user_data.is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    return User(
        id=user_dict["id"],
        email=user_dict["email"],
        name=user_dict["name"],
        role=user_dict["role"],
        photo_url=user_dict.get("photo_url"),
        mobile_phone=user_dict.get("mobile_phone"),
        address=AddressModel(**user_dict["address"]) if user_dict.get("address") else None,
        job_title=user_dict.get("job_title"),
        department=user_dict.get("department"),
        tags=user_dict.get("tags", []),
        is_active=user_dict["is_active"],
        created_at=datetime.fromisoformat(user_dict["created_at"]),
        updated_at=datetime.fromisoformat(user_dict["updated_at"])
    )

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(require_role(["Super Admin"]))):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if user_data.email is not None:
        update_dict["email"] = user_data.email
    if user_data.name is not None:
        update_dict["name"] = user_data.name
    if user_data.role is not None:
        update_dict["role"] = user_data.role
    if user_data.photo_url is not None:
        update_dict["photo_url"] = user_data.photo_url
    if user_data.mobile_phone is not None:
        update_dict["mobile_phone"] = user_data.mobile_phone
    if user_data.address is not None:
        update_dict["address"] = user_data.address.model_dump()
    if user_data.job_title is not None:
        update_dict["job_title"] = user_data.job_title
    if user_data.department is not None:
        update_dict["department"] = user_data.department
    if user_data.tags is not None:
        update_dict["tags"] = user_data.tags
    if user_data.is_active is not None:
        update_dict["is_active"] = user_data.is_active
    if user_data.password is not None:
        update_dict["hashed_password"] = get_password_hash(user_data.password)
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    return User(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],
        photo_url=updated_user.get("photo_url"),
        mobile_phone=updated_user.get("mobile_phone"),
        address=AddressModel(**updated_user["address"]) if updated_user.get("address") else None,
        job_title=updated_user.get("job_title"),
        department=updated_user.get("department"),
        tags=updated_user.get("tags", []),
        is_active=updated_user["is_active"],
        created_at=datetime.fromisoformat(updated_user["created_at"]),
        updated_at=datetime.fromisoformat(updated_user["updated_at"])
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["Super Admin"]))):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Contact Routes
@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(
    search: Optional[str] = None,
    company_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"position": {"$regex": search, "$options": "i"}}
        ]
    
    if company_id:
        query["company_id"] = company_id
    
    contacts = await db.contacts.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich contacts with company names
    result = []
    for contact in contacts:
        company_name = None
        if contact.get("company_id"):
            company = await db.companies.find_one({"id": contact["company_id"]}, {"_id": 0, "name": 1})
            if company:
                company_name = company["name"]
        
        result.append(Contact(
            id=contact["id"],
            name=contact["name"],
            email=contact.get("email"),
            phone=contact.get("phone"),
            company_id=contact["company_id"],
            company_name=company_name,
            position=contact.get("position"),
            tags=contact.get("tags", []),
            notes=contact.get("notes"),
            created_at=datetime.fromisoformat(contact["created_at"]),
            updated_at=datetime.fromisoformat(contact["updated_at"]),
            created_by=contact["created_by"]
        ))
    
    return result

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact_data: ContactCreate, current_user: dict = Depends(get_current_user)):
    # Verify company exists
    company = await db.companies.find_one({"id": contact_data.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found. Please create the company first.")
    
    contact_dict = {
        "id": str(uuid.uuid4()),
        "name": contact_data.name,
        "email": contact_data.email,
        "phone": contact_data.phone,
        "company_id": contact_data.company_id,
        "position": contact_data.position,
        "tags": contact_data.tags,
        "notes": contact_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    await db.contacts.insert_one(contact_dict)
    
    # Increment company contact count
    await db.companies.update_one(
        {"id": contact_data.company_id},
        {"$inc": {"contacts_count": 1}}
    )
    
    return Contact(
        id=contact_dict["id"],
        name=contact_dict["name"],
        email=contact_dict["email"],
        phone=contact_dict["phone"],
        company_id=contact_dict["company_id"],
        company_name=company["name"],
        position=contact_dict["position"],
        tags=contact_dict["tags"],
        notes=contact_dict["notes"],
        created_at=datetime.fromisoformat(contact_dict["created_at"]),
        updated_at=datetime.fromisoformat(contact_dict["updated_at"]),
        created_by=contact_dict["created_by"]
    )

@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get company name
    company_name = None
    if contact.get("company_id"):
        company = await db.companies.find_one({"id": contact["company_id"]}, {"_id": 0, "name": 1})
        if company:
            company_name = company["name"]
    
    return Contact(
        id=contact["id"],
        name=contact["name"],
        email=contact.get("email"),
        phone=contact.get("phone"),
        company_id=contact["company_id"],
        company_name=company_name,
        position=contact.get("position"),
        tags=contact.get("tags", []),
        notes=contact.get("notes"),
        created_at=datetime.fromisoformat(contact["created_at"]),
        updated_at=datetime.fromisoformat(contact["updated_at"]),
        created_by=contact["created_by"]
    )

@api_router.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact_data: ContactUpdate, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    # Handle company change
    if contact_data.company_id is not None and contact_data.company_id != contact.get("company_id"):
        # Verify new company exists
        new_company = await db.companies.find_one({"id": contact_data.company_id})
        if not new_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Decrement old company count
        if contact.get("company_id"):
            await db.companies.update_one(
                {"id": contact["company_id"]},
                {"$inc": {"contacts_count": -1}}
            )
        
        # Increment new company count
        await db.companies.update_one(
            {"id": contact_data.company_id},
            {"$inc": {"contacts_count": 1}}
        )
        
        update_dict["company_id"] = contact_data.company_id
    
    if contact_data.name is not None:
        update_dict["name"] = contact_data.name
    if contact_data.email is not None:
        update_dict["email"] = contact_data.email
    if contact_data.phone is not None:
        update_dict["phone"] = contact_data.phone
    if contact_data.position is not None:
        update_dict["position"] = contact_data.position
    if contact_data.tags is not None:
        update_dict["tags"] = contact_data.tags
    if contact_data.notes is not None:
        update_dict["notes"] = contact_data.notes
    
    await db.contacts.update_one({"id": contact_id}, {"$set": update_dict})
    
    updated_contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    
    # Get company name
    company_name = None
    if updated_contact.get("company_id"):
        company = await db.companies.find_one({"id": updated_contact["company_id"]}, {"_id": 0, "name": 1})
        if company:
            company_name = company["name"]
    
    return Contact(
        id=updated_contact["id"],
        name=updated_contact["name"],
        email=updated_contact.get("email"),
        phone=updated_contact.get("phone"),
        company_id=updated_contact["company_id"],
        company_name=company_name,
        position=updated_contact.get("position"),
        tags=updated_contact.get("tags", []),
        notes=updated_contact.get("notes"),
        created_at=datetime.fromisoformat(updated_contact["created_at"]),
        updated_at=datetime.fromisoformat(updated_contact["updated_at"]),
        created_by=updated_contact["created_by"]
    )

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Decrement company contact count
    if contact.get("company_id"):
        await db.companies.update_one(
            {"id": contact["company_id"]},
            {"$inc": {"contacts_count": -1}}
        )
    
    await db.contacts.delete_one({"id": contact_id})
    return {"message": "Contact deleted successfully"}

# Company Routes
@api_router.get("/companies", response_model=List[Company])
async def get_companies(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"industry": {"$regex": search, "$options": "i"}}
        ]
    
    companies = await db.companies.find(query, {"_id": 0}).to_list(1000)
    return [
        Company(
            id=company["id"],
            name=company["name"],
            website=company.get("website"),
            industry=company.get("industry"),
            description=company.get("description"),
            contacts_count=company.get("contacts_count", 0),
            created_at=datetime.fromisoformat(company["created_at"]),
            updated_at=datetime.fromisoformat(company["updated_at"]),
            created_by=company["created_by"]
        )
        for company in companies
    ]

@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, current_user: dict = Depends(get_current_user)):
    company_dict = {
        "id": str(uuid.uuid4()),
        "name": company_data.name,
        "website": company_data.website,
        "industry": company_data.industry,
        "description": company_data.description,
        "contacts_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    
    await db.companies.insert_one(company_dict)
    
    return Company(
        id=company_dict["id"],
        name=company_dict["name"],
        website=company_dict["website"],
        industry=company_dict["industry"],
        description=company_dict["description"],
        contacts_count=company_dict["contacts_count"],
        created_at=datetime.fromisoformat(company_dict["created_at"]),
        updated_at=datetime.fromisoformat(company_dict["updated_at"]),
        created_by=company_dict["created_by"]
    )

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: CompanyUpdate, current_user: dict = Depends(get_current_user)):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if company_data.name is not None:
        update_dict["name"] = company_data.name
    if company_data.website is not None:
        update_dict["website"] = company_data.website
    if company_data.industry is not None:
        update_dict["industry"] = company_data.industry
    if company_data.description is not None:
        update_dict["description"] = company_data.description
    
    await db.companies.update_one({"id": company_id}, {"$set": update_dict})
    
    updated_company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    return Company(
        id=updated_company["id"],
        name=updated_company["name"],
        website=updated_company.get("website"),
        industry=updated_company.get("industry"),
        description=updated_company.get("description"),
        contacts_count=updated_company.get("contacts_count", 0),
        created_at=datetime.fromisoformat(updated_company["created_at"]),
        updated_at=datetime.fromisoformat(updated_company["updated_at"]),
        created_by=updated_company["created_by"]
    )

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    # Check if company has contacts
    contact_count = await db.contacts.count_documents({"company_id": company_id})
    if contact_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete company with {contact_count} associated contacts. Please reassign or delete contacts first."
        )
    
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}

@api_router.get("/companies/{company_id}/contacts", response_model=List[Contact])
async def get_company_contacts(company_id: str, current_user: dict = Depends(get_current_user)):
    # Verify company exists
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    contacts = await db.contacts.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    
    return [
        Contact(
            id=contact["id"],
            name=contact["name"],
            email=contact.get("email"),
            phone=contact.get("phone"),
            company_id=contact["company_id"],
            company_name=company["name"],
            position=contact.get("position"),
            tags=contact.get("tags", []),
            notes=contact.get("notes"),
            created_at=datetime.fromisoformat(contact["created_at"]),
            updated_at=datetime.fromisoformat(contact["updated_at"]),
            created_by=contact["created_by"]
        )
        for contact in contacts
    ]

# Stats Route
@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: dict = Depends(get_current_user)):
    total_users = await db.users.count_documents({})
    total_contacts = await db.contacts.count_documents({})
    total_companies = await db.companies.count_documents({})
    
    return StatsResponse(
        total_users=total_users,
        total_contacts=total_contacts,
        total_companies=total_companies,
        active_events=0  # Placeholder for future implementation
    )

# Utility Routes
@api_router.get("/departments")
async def get_departments(current_user: dict = Depends(get_current_user)):
    departments = await db.users.distinct("department")
    return [dept for dept in departments if dept]

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()