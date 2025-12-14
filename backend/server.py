from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any, Literal
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import qrcode
from io import BytesIO
import base64
from jose import JWTError, jwt
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production-super-secret-key-eventpass-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)

# ===== MODELS =====

class TenantSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tenant_id: str
    stripe_key: Optional[str] = None
    email_type: Optional[Literal["smtp", "resend"]] = "smtp"
    email_config: Optional[Dict[str, str]] = {}  # SMTP or Resend settings
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["super_admin", "organiser_admin", "finance_admin", "registration_admin", "program_manager", "exhibitor_manager", "analyst"] = "organiser_admin"
    tenant_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str
    tenant_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class EventCreate(BaseModel):
    name: str
    dates: Dict[str, str]  # {"start": "2025-06-01", "end": "2025-06-03"}
    venue: str
    description: Optional[str] = None

class EventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str
    tenant_id: str
    name: str
    dates: Dict[str, str]
    venue: str
    description: Optional[str] = None
    created_at: datetime

class ContactCreate(BaseModel):
    event_id: str
    type: Literal["attendee", "speaker", "exhibitor", "sponsor", "vip", "media"]
    name: str
    email: EmailStr
    company: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    booth_number: Optional[str] = None
    ticket_type: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = {}

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contact_id: str
    tenant_id: str
    event_id: str
    type: str
    name: str
    email: str
    company: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    booth_number: Optional[str] = None
    ticket_type: Optional[str] = None
    qr_code: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = {}
    created_at: datetime

class BadgeTemplateElement(BaseModel):
    id: str
    type: Literal["text", "qrcode", "image", "field"]
    content: str  # Text content, field name, or image URL
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    fontSize: Optional[int] = 16
    fontFamily: Optional[str] = "Helvetica"
    fontWeight: Optional[str] = "normal"
    color: Optional[str] = "#000000"
    align: Optional[str] = "left"

class BadgeTemplateCreate(BaseModel):
    event_id: str
    name: str
    width: float = 4.0  # inches
    height: float = 6.0  # inches
    elements: List[BadgeTemplateElement] = []
    is_default: bool = False

class BadgeTemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    template_id: str
    tenant_id: str
    event_id: str
    name: str
    width: float
    height: float
    elements: List[BadgeTemplateElement]
    is_default: bool
    created_at: datetime

class OrderCreate(BaseModel):
    event_id: str
    contact_id: str
    items: List[Dict[str, Any]]  # [{"name": "VIP Ticket", "price": 299.00, "quantity": 1}]
    currency: str = "usd"

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    tenant_id: str
    event_id: str
    contact_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    currency: str
    status: Literal["draft", "pending", "paid", "refunded", "cancelled"]
    stripe_session_id: Optional[str] = None
    created_at: datetime

# ===== AUTH UTILITIES =====

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise credentials_exception
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user

# ===== UTILITIES =====

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# ===== AUTH ROUTES =====

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create tenant if super_admin and no tenant_id
    tenant_id = user_data.tenant_id
    if user_data.role == "super_admin" and not tenant_id:
        tenant_id = str(uuid.uuid4())
        tenant_doc = {
            "tenant_id": tenant_id,
            "name": f"{user_data.name}'s Organization",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tenants.insert_one(tenant_doc)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id required for non-super_admin users")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hashed_password,
        "role": user_data.role,
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        tenant_id=tenant_id
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={"sub": user["user_id"], "tenant_id": user["tenant_id"], "role": user["role"]}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ===== TENANT SETTINGS =====

@api_router.get("/settings", response_model=TenantSettings)
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not settings:
        return TenantSettings(tenant_id=current_user["tenant_id"])
    return TenantSettings(**settings)

@api_router.put("/settings")
async def update_settings(settings: TenantSettings, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "organiser_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    settings.tenant_id = current_user["tenant_id"]
    settings.updated_at = datetime.now(timezone.utc)
    
    await db.settings.update_one(
        {"tenant_id": current_user["tenant_id"]},
        {"$set": settings.model_dump()},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

# ===== EVENTS =====

@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    event_id = str(uuid.uuid4())
    event_doc = {
        "event_id": event_id,
        "tenant_id": current_user["tenant_id"],
        "user_id": current_user["user_id"],
        "name": event.name,
        "dates": event.dates,
        "venue": event.venue,
        "description": event.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.events.insert_one(event_doc)
    event_doc["created_at"] = datetime.fromisoformat(event_doc["created_at"])
    return EventResponse(**event_doc)

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    for event in events:
        event["created_at"] = datetime.fromisoformat(event["created_at"])
    return [EventResponse(**e) for e in events]

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"event_id": event_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["created_at"] = datetime.fromisoformat(event["created_at"])
    return EventResponse(**event)

@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.events.find_one({"event_id": event_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_doc = {
        "name": event.name,
        "dates": event.dates,
        "venue": event.venue,
        "description": event.description
    }
    
    await db.events.update_one(
        {"event_id": event_id, "tenant_id": current_user["tenant_id"]},
        {"$set": update_doc}
    )
    
    updated = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return EventResponse(**updated)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.events.delete_one({"event_id": event_id, "tenant_id": current_user["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# ===== CONTACTS =====

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact: ContactCreate, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to tenant
    event = await db.events.find_one({"event_id": contact.event_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    contact_id = str(uuid.uuid4())
    qr_data = f"{contact_id}:{contact.name}:{contact.email}"
    qr_code = generate_qr_code(qr_data)
    
    contact_doc = {
        "contact_id": contact_id,
        "tenant_id": current_user["tenant_id"],
        "event_id": contact.event_id,
        "type": contact.type,
        "name": contact.name,
        "email": contact.email,
        "company": contact.company,
        "title": contact.title,
        "phone": contact.phone,
        "booth_number": contact.booth_number,
        "ticket_type": contact.ticket_type,
        "qr_code": qr_code,
        "custom_data": contact.custom_data or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contacts.insert_one(contact_doc)
    contact_doc["created_at"] = datetime.fromisoformat(contact_doc["created_at"])
    return ContactResponse(**contact_doc)

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    event_id: Optional[str] = None,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"tenant_id": current_user["tenant_id"]}
    if event_id:
        query["event_id"] = event_id
    if type:
        query["type"] = type
    
    contacts = await db.contacts.find(query, {"_id": 0}).to_list(1000)
    for contact in contacts:
        contact["created_at"] = datetime.fromisoformat(contact["created_at"])
    return [ContactResponse(**c) for c in contacts]

@api_router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"contact_id": contact_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact["created_at"] = datetime.fromisoformat(contact["created_at"])
    return ContactResponse(**contact)

# ===== BADGE TEMPLATES =====

@api_router.post("/badge-templates", response_model=BadgeTemplateResponse)
async def create_badge_template(template: BadgeTemplateCreate, current_user: dict = Depends(get_current_user)):
    template_id = str(uuid.uuid4())
    template_doc = {
        "template_id": template_id,
        "tenant_id": current_user["tenant_id"],
        "event_id": template.event_id,
        "name": template.name,
        "width": template.width,
        "height": template.height,
        "elements": [e.model_dump() for e in template.elements],
        "is_default": template.is_default,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.badge_templates.insert_one(template_doc)
    template_doc["created_at"] = datetime.fromisoformat(template_doc["created_at"])
    return BadgeTemplateResponse(**template_doc)

@api_router.get("/badge-templates", response_model=List[BadgeTemplateResponse])
async def get_badge_templates(event_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if event_id:
        query["event_id"] = event_id
    
    templates = await db.badge_templates.find(query, {"_id": 0}).to_list(1000)
    for template in templates:
        template["created_at"] = datetime.fromisoformat(template["created_at"])
    return [BadgeTemplateResponse(**t) for t in templates]

@api_router.get("/badge-templates/{template_id}", response_model=BadgeTemplateResponse)
async def get_badge_template(template_id: str, current_user: dict = Depends(get_current_user)):
    template = await db.badge_templates.find_one({"template_id": template_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template["created_at"] = datetime.fromisoformat(template["created_at"])
    return BadgeTemplateResponse(**template)

@api_router.put("/badge-templates/{template_id}", response_model=BadgeTemplateResponse)
async def update_badge_template(template_id: str, template: BadgeTemplateCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.badge_templates.find_one({"template_id": template_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_doc = {
        "name": template.name,
        "width": template.width,
        "height": template.height,
        "elements": [e.model_dump() for e in template.elements],
        "is_default": template.is_default
    }
    
    await db.badge_templates.update_one(
        {"template_id": template_id, "tenant_id": current_user["tenant_id"]},
        {"$set": update_doc}
    )
    
    updated = await db.badge_templates.find_one({"template_id": template_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return BadgeTemplateResponse(**updated)

# ===== BADGE PDF GENERATION =====

@api_router.get("/badges/print/{contact_id}")
async def generate_badge_pdf(contact_id: str, template_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Generate a 4x12 inch PDF for Zebra printer with badge duplicated and flipped"""
    contact = await db.contacts.find_one({"contact_id": contact_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get template
    if template_id:
        template = await db.badge_templates.find_one({"template_id": template_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    else:
        template = await db.badge_templates.find_one({"event_id": contact["event_id"], "is_default": True, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    
    if not template:
        raise HTTPException(status_code=404, detail="No template found")
    
    # Create PDF in memory
    buffer = BytesIO()
    
    # 4x12 inch page
    page_width = 4 * inch
    page_height = 12 * inch
    c = pdf_canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    # Badge dimensions
    badge_width = 4 * inch
    badge_height = 6 * inch
    
    # Draw first badge (bottom half)
    y_offset_1 = 0
    draw_badge_on_canvas(c, template, contact, 0, y_offset_1, badge_width, badge_height)
    
    # Draw second badge (top half, flipped 180 degrees)
    y_offset_2 = 6 * inch
    c.saveState()
    c.translate(badge_width, y_offset_2 + badge_height)
    c.rotate(180)
    draw_badge_on_canvas(c, template, contact, 0, 0, badge_width, badge_height)
    c.restoreState()
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=badge_{contact_id}.pdf"})

def draw_badge_on_canvas(c, template, contact, x_offset, y_offset, width, height):
    """Helper to draw badge elements on canvas"""
    for element in template["elements"]:
        elem_x = x_offset + (element["x"] / template["width"]) * width
        elem_y = y_offset + height - (element["y"] / template["height"]) * height
        
        if element["type"] == "text":
            c.setFont(element.get("fontFamily", "Helvetica"), element.get("fontSize", 16))
            c.setFillColor(element.get("color", "#000000"))
            c.drawString(elem_x, elem_y, element["content"])
        
        elif element["type"] == "field":
            field_value = contact.get(element["content"], "")
            c.setFont(element.get("fontFamily", "Helvetica"), element.get("fontSize", 16))
            c.drawString(elem_x, elem_y, str(field_value))
        
        elif element["type"] == "qrcode":
            if contact.get("qr_code"):
                try:
                    qr_data = contact["qr_code"].split(",")[1]
                    qr_bytes = base64.b64decode(qr_data)
                    qr_img = Image.open(BytesIO(qr_bytes))
                    img_reader = ImageReader(qr_img)
                    qr_size = element.get("width", 1) * inch
                    c.drawImage(img_reader, elem_x, elem_y - qr_size, width=qr_size, height=qr_size)
                except Exception as e:
                    logger.error(f"Error drawing QR code: {e}")

# ===== ORDERS & PAYMENTS =====

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    total_amount = sum(item["price"] * item.get("quantity", 1) for item in order.items)
    
    order_doc = {
        "order_id": order_id,
        "tenant_id": current_user["tenant_id"],
        "event_id": order.event_id,
        "contact_id": order.contact_id,
        "items": order.items,
        "total_amount": total_amount,
        "currency": order.currency,
        "status": "draft",
        "stripe_session_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    order_doc["created_at"] = datetime.fromisoformat(order_doc["created_at"])
    return OrderResponse(**order_doc)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(event_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if event_id:
        query["event_id"] = event_id
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for order in orders:
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    return [OrderResponse(**o) for o in orders]

@api_router.post("/orders/{order_id}/checkout")
async def checkout_order(order_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get tenant Stripe key
    settings = await db.settings.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0})
    stripe_key = settings.get("stripe_key") if settings else os.getenv("STRIPE_API_KEY")
    
    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe not configured for this tenant")
    
    # Get origin from request
    origin = request.headers.get("origin", "")
    if not origin:
        origin = str(request.base_url).rstrip("/")
    
    host_url = origin
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    success_url = f"{origin}/orders/{order_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/orders/{order_id}/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=order["total_amount"],
        currency=order["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "tenant_id": current_user["tenant_id"],
            "event_id": order["event_id"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction
    transaction_doc = {
        "transaction_id": str(uuid.uuid4()),
        "tenant_id": current_user["tenant_id"],
        "order_id": order_id,
        "session_id": session.session_id,
        "amount": order["total_amount"],
        "currency": order["currency"],
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"stripe_session_id": session.session_id, "status": "pending"}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/orders/{order_id}/status")
async def get_order_status(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.get("stripe_session_id"):
        return {"status": order["status"], "payment_status": "not_started"}
    
    # Get tenant Stripe key
    settings = await db.settings.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0})
    stripe_key = settings.get("stripe_key") if settings else os.getenv("STRIPE_API_KEY")
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    checkout_status = await stripe_checkout.get_checkout_status(order["stripe_session_id"])
    
    # Update order and transaction if paid
    if checkout_status.payment_status == "paid" and order["status"] != "paid":
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"status": "paid"}}
        )
        await db.payment_transactions.update_one(
            {"order_id": order_id, "session_id": order["stripe_session_id"]},
            {"$set": {"payment_status": "paid", "status": "completed"}}
        )
    
    return {
        "status": "paid" if checkout_status.payment_status == "paid" else order["status"],
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total / 100,
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    # This is a placeholder - webhook handling would be implemented here
    return {"status": "received"}

# Include router
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()