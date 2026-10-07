from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from argon2 import PasswordHasher

import jwt
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .database import Base, engine, get_db
from .models import (
    Business,
    User,
    Customer,
    Product,
    StockMovement,
    Expense,
    Sale,
    SaleItem,
)
from .schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockMovementCreate,
    StockMovementResponse,
    ExpenseCreate,
    ExpenseResponse,
    SaleCreate,
    SaleResponse,
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="NEXORA API",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://nexora-ai-business-intelligence.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PASSWORD HASHING
# =========================================================

password_hasher = PasswordHasher()

# =========================================================
# JWT SECURITY
# =========================================================

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

JWT_SECRET = os.getenv("NEXORA_JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError(
        "NEXORA_JWT_SECRET is missing from .env"
    )

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60

security = HTTPBearer()


def create_access_token(
    user_id: int,
    business_id: int,
    role: str,
):
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "business_id": business_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(
            minutes=JWT_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = int(payload["sub"])

    except (
        jwt.ExpiredSignatureError,
        jwt.InvalidTokenError,
        KeyError,
        ValueError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user not found.",
        )

    return user


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "NEXORA",
        "version": "1.0.0",
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "NEXORA API",
        "database": "connected",
    }


# =========================================================
# REGISTER
# =========================================================

@app.post(
    "/auth/register",
    response_model=RegisterResponse,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match.",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    existing_business = (
        db.query(Business)
        .filter(Business.email == data.email)
        .first()
    )

    if existing_business:
        raise HTTPException(
            status_code=409,
            detail="A business with this email already exists.",
        )

    password_hash = password_hasher.hash(
        data.password
    )

    business = Business(
        business_name=data.business_name,
        owner_name=data.owner_name,
        email=data.email,
        mobile=data.mobile,
        business_type=data.business_type,
    )

    db.add(business)
    db.flush()

    user = User(
        business_id=business.id,
        email=data.email,
        password_hash=password_hash,
        role="owner",
    )

    db.add(user)

    db.commit()

    db.refresh(business)
    db.refresh(user)

    return RegisterResponse(
        message="NEXORA workspace created successfully.",
        business_id=business.id,
        user_id=user.id,
    )


# =========================================================
# CUSTOMERS
# =========================================================

@app.post(
    "/api/customers",
    response_model=CustomerResponse,
)
def create_customer(
    data: CustomerCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = Customer(
        business_id=user.business_id,
        name=data.name,
        email=str(data.email) if data.email else None,
        mobile=data.mobile,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@app.get(
    "/api/customers",
    response_model=list[CustomerResponse],
)
def list_customers(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Customer)
        .filter(
            Customer.business_id == user.business_id,
            Customer.is_active == True,
        )
        .order_by(Customer.id.desc())
        .all()
    )


@app.put(
    "/api/customers/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id == user.business_id,
            Customer.is_active == True,
        )
        .first()
    )

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    updates = data.dict(exclude_unset=True)

    if "name" in updates:
        if updates["name"] is None or not updates["name"].strip():
            raise HTTPException(status_code=422, detail="Customer name is required")
        customer.name = updates["name"].strip()

    if "email" in updates:
        customer.email = str(updates["email"]) if updates["email"] else None

    if "mobile" in updates:
        customer.mobile = updates["mobile"].strip() if updates["mobile"] else None

    db.commit()
    db.refresh(customer)
    return customer


# =========================================================
# CUSTOMER INTELLIGENCE
# =========================================================

@app.get("/api/customers/intelligence")
def customer_intelligence(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == user.business_id,
            Customer.is_active == True,
        )
        .all()
    )

    total_customers = len(customers)

    new_last_7_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= seven_days_ago.replace(tzinfo=None)
    )

    new_last_30_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= thirty_days_ago.replace(tzinfo=None)
    )

    if total_customers == 0:
        growth_signal = "no_customer_data"
        insight = "NEXORA needs customer data to generate customer intelligence."
    elif new_last_30_days > 0:
        growth_signal = "positive"
        insight = (
            f"{new_last_30_days} new customer(s) were added "
            "during the last 30 days."
        )
    else:
        growth_signal = "stable"
        insight = (
            "No new customers were recorded during the last 30 days."
        )

    return {
        "business_id": user.business_id,
        "engine": "NEXORA Customer Intelligence",
        "version": "1.0",
        "status": "operational",
        "customers": {
            "total_active": total_customers,
            "new_last_7_days": new_last_7_days,
            "new_last_30_days": new_last_30_days,
        },
        "intelligence": {
            "growth_signal": growth_signal,
            "insight": insight,
        },
    }


# =========================================================
# PRODUCTS / INVENTORY
# =========================================================

@app.post(
    "/api/products",
    response_model=ProductResponse,
)
def create_product(
    data: ProductCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = Product(
        business_id=user.business_id,
        name=data.name,
        sku=data.sku,
        category=data.category,
        selling_price=data.selling_price,
        cost_price=data.cost_price,
        stock_quantity=data.stock_quantity,
        low_stock_threshold=data.low_stock_threshold,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@app.put(
    "/api/products/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    data: ProductUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.business_id == user.business_id,
            Product.is_active == True,
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    changes = data.dict(exclude_unset=True)

    if "name" in changes and (
        changes["name"] is None or not changes["name"].strip()
    ):
        raise HTTPException(
            status_code=422,
            detail="Product name cannot be empty.",
        )

    stock_before = float(product.stock_quantity or 0)
    stock_changed = (
        "stock_quantity" in changes
        and changes["stock_quantity"] is not None
        and float(changes["stock_quantity"]) != stock_before
    )

    try:
        for field, value in changes.items():
            if field == "name" and value is not None:
                value = value.strip()
            if field in ("sku", "category") and isinstance(value, str):
                value = value.strip() or None
            setattr(product, field, value)

        if stock_changed:
            stock_after = float(changes["stock_quantity"])
            db.add(
                StockMovement(
                    business_id=user.business_id,
                    product_id=product.id,
                    movement_type="ADJUSTMENT",
                    quantity_change=stock_after - stock_before,
                    stock_before=stock_before,
                    stock_after=stock_after,
                    reason="Updated via Edit Product",
                )
            )

        db.commit()
        db.refresh(product)
        return product
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update product.",
        )


@app.post(
    "/api/products/{product_id}/stock-movements",
    response_model=StockMovementResponse,
)
def create_stock_movement(
    product_id: int,
    data: StockMovementCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from decimal import Decimal

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.business_id == user.business_id,
            Product.is_active == True,
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    before = Decimal(str(product.stock_quantity or 0))
    quantity = Decimal(str(data.quantity))
    movement_type = data.movement_type
    reason = data.reason.strip() if data.reason else None

    if movement_type in ("IN", "OUT") and quantity <= 0:
        raise HTTPException(
            status_code=422,
            detail="Quantity must be greater than zero for IN or OUT.",
        )

    if movement_type == "IN":
        after = before + quantity
    elif movement_type == "OUT":
        if quantity > before:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock for this OUT movement.",
            )
        after = before - quantity
    else:
        after = quantity

    movement = StockMovement(
        business_id=user.business_id,
        product_id=product.id,
        movement_type=movement_type,
        quantity_change=after - before,
        stock_before=before,
        stock_after=after,
        reason=reason,
    )

    try:
        product.stock_quantity = after
        db.add(movement)
        db.commit()
        db.refresh(movement)
        return movement
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update stock.",
        )


@app.get(
    "/api/products/{product_id}/stock-movements",
    response_model=list[StockMovementResponse],
)
def list_stock_movements(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.business_id == user.business_id,
            Product.is_active == True,
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    return (
        db.query(StockMovement)
        .filter(
            StockMovement.product_id == product.id,
            StockMovement.business_id == user.business_id,
        )
        .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
        .all()
    )


@app.get(
    "/api/products",
    response_model=list[ProductResponse],
)
def list_products(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Product)
        .filter(
            Product.business_id == user.business_id,
            Product.is_active == True,
        )
        .order_by(Product.id.desc())
        .all()
    )


@app.get(
    "/api/products/low-stock",
    response_model=list[ProductResponse],
)
def low_stock_products(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Product)
        .filter(
            Product.business_id == user.business_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
        .order_by(Product.stock_quantity.asc())
        .all()
    )


# =========================================================
# EXPENSES
# =========================================================

@app.post(
    "/api/expenses",
    response_model=ExpenseResponse,
)
def create_expense(
    data: ExpenseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = Expense(
        business_id=user.business_id,
        category=data.category,
        description=data.description,
        amount=data.amount,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@app.get(
    "/api/expenses",
    response_model=list[ExpenseResponse],
)
def list_expenses(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Expense)
        .filter(
            Expense.business_id == user.business_id,
        )
        .order_by(Expense.id.desc())
        .all()
    )


# =========================================================
# SALES
# =========================================================

@app.post(
    "/api/sales",
    response_model=SaleResponse,
)
def create_sale(
    data: SaleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # -------------------------------------------------
        # CUSTOMER VALIDATION
        # -------------------------------------------------

        if data.customer_id is not None:
            customer = (
                db.query(Customer)
                .filter(
                    Customer.id == data.customer_id,
                    Customer.business_id == user.business_id,
                    Customer.is_active == True,
                )
                .first()
            )

            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found.",
                )

        # -------------------------------------------------
        # VALIDATE PRODUCTS + CALCULATE TOTAL
        # -------------------------------------------------

        validated_items = []
        total_amount = 0.0
        requested_quantities = {}

        for item in data.items:
            requested_quantities[item.product_id] = (
                requested_quantities.get(item.product_id, 0) + item.quantity
            )
            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.business_id == user.business_id,
                    Product.is_active == True,
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found.",
                )

            if float(product.stock_quantity) < requested_quantities[item.product_id]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {product.name}.",
                )

            unit_price = float(product.selling_price)
            line_total = unit_price * item.quantity

            validated_items.append(
                (
                    product,
                    item.quantity,
                    unit_price,
                    line_total,
                )
            )

            total_amount += line_total

        # -------------------------------------------------
        # CREATE SALE
        # -------------------------------------------------

        sale = Sale(
            business_id=user.business_id,
            customer_id=data.customer_id,
            total_amount=total_amount,
            status="completed",
        )

        db.add(sale)
        db.flush()

        # -------------------------------------------------
        # CREATE SALE ITEMS + REDUCE STOCK
        # -------------------------------------------------

        for product, quantity, unit_price, line_total in validated_items:

            sale_item = SaleItem(
                business_id=user.business_id,
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )

            db.add(sale_item)

            updated_rows = (
                db.query(Product)
                .filter(
                    Product.id == product.id,
                    Product.business_id == user.business_id,
                    Product.is_active == True,
                    Product.stock_quantity >= quantity,
                )
                .update(
                    {
                        Product.stock_quantity: Product.stock_quantity - quantity
                    },
                    synchronize_session=False,
                )
            )

            if updated_rows != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {product.name}.",
                )

        db.commit()
        db.refresh(sale)

        return {
            "id": sale.id,
            "customer_id": sale.customer_id,
            "total_amount": float(sale.total_amount),
            "status": sale.status,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": float(item.quantity),
                    "unit_price": float(item.unit_price),
                    "line_total": float(item.line_total),
                }
                for item in sale.items
            ],
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create sale.",
        )


@app.get(
    "/api/sales",
    response_model=list[SaleResponse],
)
def list_sales(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == user.business_id,
        )
        .order_by(Sale.id.desc())
        .all()
    )

    result = []

    for sale in sales:
        result.append(
            {
                "id": sale.id,
                "customer_id": sale.customer_id,
                "total_amount": float(sale.total_amount),
                "status": sale.status,
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "quantity": float(item.quantity),
                        "unit_price": float(item.unit_price),
                        "line_total": float(item.line_total),
                    }
                    for item in sale.items
                ],
            }
        )

    return result


# =========================================================
# CURRENT USER
# =========================================================

@app.get("/auth/me")
def current_user(
    user: User = Depends(get_current_user),
):
    return {
        "user_id": user.id,
        "business_id": user.business_id,
        "email": user.email,
        "role": user.role,
    }


# =========================================================
# LOGIN
# =========================================================

@app.post(
    "/auth/login",
    response_model=LoginResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    try:
        password_hasher.verify(
            user.password_hash,
            data.password,
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return LoginResponse(
        message="Login successful.",
        access_token=create_access_token(
            user_id=user.id,
            business_id=user.business_id,
            role=user.role,
        ),
        token_type="bearer",
        user_id=user.id,
        business_id=user.business_id,
        role=user.role,
    )
# ============================================================
# NEXORA BUSINESS INTELLIGENCE — SUMMARY
# ============================================================

@app.get("/api/intelligence/summary")
def intelligence_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business_id = user.business_id

    # --------------------------------------------------------
    # Business data — tenant isolated
    # --------------------------------------------------------
    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id,
            Customer.is_active == True,
        )
        .all()
    )

    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            Product.is_active == True,
        )
        .all()
    )

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.status == "completed",
        )
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
        )
        .all()
    )

    # --------------------------------------------------------
    # Revenue
    # --------------------------------------------------------
    total_revenue = sum(
        float(sale.total_amount or 0)
        for sale in sales
    )

    # --------------------------------------------------------
    # COGS
    # Uses current product cost for sold quantities.
    # Historical cost snapshots can be added later.
    # --------------------------------------------------------
    total_cogs = 0.0

    products_by_id = {
        product.id: product
        for product in db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    }

    for sale in sales:
        for item in sale.items:
            product = products_by_id.get(item.product_id)

            if product:
                total_cogs += (
                    float(item.quantity or 0)
                    * float(product.cost_price or 0)
                )

    # --------------------------------------------------------
    # Expenses
    # --------------------------------------------------------
    total_expenses = sum(
        float(expense.amount or 0)
        for expense in expenses
    )

    # --------------------------------------------------------
    # Profit
    # --------------------------------------------------------
    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    profit_margin = (
        (net_profit / total_revenue) * 100
        if total_revenue > 0
        else 0.0
    )

    # --------------------------------------------------------
    # Sales intelligence
    # --------------------------------------------------------
    total_sales = len(sales)

    average_order_value = (
        total_revenue / total_sales
        if total_sales > 0
        else 0.0
    )

    # --------------------------------------------------------
    # Inventory intelligence
    # --------------------------------------------------------
    inventory_value = sum(
        float(product.stock_quantity or 0)
        * float(product.cost_price or 0)
        for product in products
    )

    low_stock_products = [
        product
        for product in products
        if float(product.stock_quantity or 0)
        <= float(product.low_stock_threshold or 0)
    ]

    # --------------------------------------------------------
    # Intelligence response
    # --------------------------------------------------------
    return {
        "business_id": business_id,

        "financial": {
            "total_revenue": round(total_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_percent": round(profit_margin, 2),
        },

        "sales": {
            "total_sales": total_sales,
            "average_order_value": round(
                average_order_value,
                2,
            ),
        },

        "customers": {
            "active_customers": len(customers),
        },

        "inventory": {
            "active_products": len(products),
            "inventory_value": round(
                inventory_value,
                2,
            ),
            "low_stock_products": len(
                low_stock_products
            ),
        },

        "status": "operational",
    }


# ============================================================
# NEXORA INTELLIGENCE ENGINE
# Detect → Analyze → Explain → Recommend → Confidence
# ============================================================

@app.get("/api/intelligence/insights")
def intelligence_insights(
    language: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business_id = user.business_id

    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            Product.is_active == True,
        )
        .all()
    )

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.status == "completed",
        )
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
        )
        .all()
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id,
            Customer.is_active == True,
        )
        .all()
    )

    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    new_customers_7_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= seven_days_ago.replace(tzinfo=None)
    )

    new_customers_30_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= thirty_days_ago.replace(tzinfo=None)
    )

    if new_customers_30_days > 0:
        customer_growth_signal = "positive"
    elif len(customers) > 0:
        customer_growth_signal = "stable"
    else:
        customer_growth_signal = "no_customer_data"

    total_revenue = sum(
        float(sale.total_amount or 0)
        for sale in sales
    )

    total_expenses = sum(
        float(expense.amount or 0)
        for expense in expenses
    )

    total_cogs = 0.0

    products_by_id = {
        product.id: product
        for product in db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    }

    for sale in sales:
        for item in sale.items:
            product = products_by_id.get(item.product_id)

            if product:
                total_cogs += (
                    float(item.quantity or 0)
                    * float(product.cost_price or 0)
                )

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    profit_margin = (
        (net_profit / total_revenue) * 100
        if total_revenue > 0
        else 0.0
    )

    insights = []

    # --------------------------------------------------------
    # 1. Profitability detection
    # --------------------------------------------------------
    if net_profit < 0:
        text = intelligence_text(
            language,
            "profitability_risk",
            value=abs(net_profit),
        )

        insights.append({
            "type": "profitability_risk",
            "severity": "high",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.99,
        })

    elif profit_margin < 10:
        text = intelligence_text(
            language,
            "margin_risk",
            value=profit_margin,
        )

        insights.append({
            "type": "margin_risk",
            "severity": "medium",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.96,
        })

    # --------------------------------------------------------
    # 2. Expense detection
    # --------------------------------------------------------
    if total_revenue > 0 and total_expenses > total_revenue:
        text = intelligence_text(
            language,
            "expense_risk",
            expenses=total_expenses,
            revenue=total_revenue,
        )

        insights.append({
            "type": "expense_risk",
            "severity": "high",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.99,
        })

    # --------------------------------------------------------
    # 3. Inventory detection
    # --------------------------------------------------------
    low_stock = [
        product
        for product in products
        if float(product.stock_quantity or 0)
        <= float(product.low_stock_threshold or 0)
    ]

    if low_stock:
        names = [
            product.name
            for product in low_stock[:5]
        ]

        text = intelligence_text(
            language,
            "inventory_risk",
            count=len(low_stock),
            names=", ".join(names),
        )

        insights.append({
            "type": "inventory_risk",
            "severity": "medium",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.98,
        })

    # --------------------------------------------------------
    # 4. Customer signal
    # --------------------------------------------------------
    if len(customers) == 0:
        text = intelligence_text(
            language,
            "customer_risk",
        )

        insights.append({
            "type": "customer_risk",
            "severity": "medium",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.99,
        })

    # --------------------------------------------------------
    # 5. Positive signal
    # --------------------------------------------------------
    if total_revenue > 0 and gross_profit > 0:
        text = intelligence_text(
            language,
            "positive_signal",
            value=gross_profit,
        )

        insights.append({
            "type": "positive_signal",
            "severity": "low",
            "title": text["title"],
            "explanation": text["explanation"],
            "recommended_action": text["recommended_action"],
            "confidence": 0.95,
        })

    return {
        "business_id": business_id,
        "engine": "NEXORA Intelligence Engine",
        "version": "1.0",
        "status": "operational",
        "summary": {
            "revenue": round(total_revenue, 2),
            "expenses": round(total_expenses, 2),
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_percent": round(profit_margin, 2),
            "active_customers": len(customers),
            "active_products": len(products),
            "low_stock_products": len(low_stock),
            "active_customers": len(customers),
            "new_customers_7_days": new_customers_7_days,
            "new_customers_30_days": new_customers_30_days,
            "customer_growth_signal": customer_growth_signal,
        },
        "insights": insights,
        "insight_count": len(insights),
    }



# ============================================================
# NEXORA AI DECISION ENGINE
# Detect → Prioritize → Decide → Recommend
# ============================================================

@app.get("/api/decision-engine")
def decision_engine(
    language: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business_id = user.business_id

    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            Product.is_active == True,
        )
        .all()
    )

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.status == "completed",
        )
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
        )
        .all()
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id,
            Customer.is_active == True,
        )
        .all()
    )

    total_revenue = sum(
        float(sale.total_amount or 0)
        for sale in sales
    )

    total_expenses = sum(
        float(expense.amount or 0)
        for expense in expenses
    )

    products_by_id = {
        product.id: product
        for product in db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    }

    total_cogs = 0.0

    for sale in sales:
        for item in sale.items:
            product = products_by_id.get(item.product_id)

            if product:
                total_cogs += (
                    float(item.quantity or 0)
                    * float(product.cost_price or 0)
                )

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    profit_margin = (
        (net_profit / total_revenue) * 100
        if total_revenue > 0
        else 0.0
    )

    low_stock_products = [
        product
        for product in products
        if float(product.stock_quantity or 0)
        <= float(product.low_stock_threshold or 0)
    ]

    # ------------------------------------------------------------
    # Decision Engine multilingual explanations
    # Supports the same 13-language system used by NEXORA.
    # ------------------------------------------------------------
    lang = str(language or "en").lower().split("-")[0]

    decision_text = {
        "en": {
            "expense_reason": "Operating expenses are higher than revenue.",
            "expense_action": "Review major expense categories and reduce avoidable costs.",
            "profit_reason": "The business is currently operating at a net loss.",
            "profit_action": "Review pricing, product margins, and operating expenses.",
            "margin_reason": "Current net profit margin is below 10%.",
            "margin_action": "Review low-margin products, pricing, discounts, and expenses.",
            "stock_reason": lambda count: f"{count} active product(s) are at or below their stock threshold.",
            "stock_action": "Review low-stock products and replenish the highest-priority items.",
            "customer_reason": "No active customers are currently available.",
            "customer_action": "Focus on customer acquisition and create a repeatable lead pipeline.",
            "growth_reason": "No critical business risk was detected from the available data.",
            "growth_action": "Focus on increasing sales while protecting current profit margins.",
        },
        "hi": {
            "expense_reason": "परिचालन खर्च राजस्व से अधिक है।",
            "expense_action": "प्रमुख खर्च श्रेणियों की समीक्षा करें और अनावश्यक लागत कम करें।",
            "profit_reason": "व्यवसाय वर्तमान में शुद्ध घाटे में चल रहा है।",
            "profit_action": "मूल्य निर्धारण, उत्पाद मार्जिन और परिचालन खर्चों की समीक्षा करें।",
            "margin_reason": "वर्तमान शुद्ध लाभ मार्जिन 10% से कम है।",
            "margin_action": "कम मार्जिन वाले उत्पादों, कीमतों, छूट और खर्चों की समीक्षा करें।",
            "stock_reason": lambda count: f"{count} सक्रिय उत्पाद स्टॉक सीमा पर या उससे नीचे हैं।",
            "stock_action": "कम स्टॉक वाले उत्पादों की समीक्षा करें और सबसे जरूरी उत्पादों को दोबारा स्टॉक करें।",
            "customer_reason": "वर्तमान में कोई सक्रिय ग्राहक उपलब्ध नहीं है।",
            "customer_action": "ग्राहक प्राप्त करने और एक नियमित लीड पाइपलाइन बनाने पर ध्यान दें।",
            "growth_reason": "उपलब्ध डेटा में कोई गंभीर व्यावसायिक जोखिम नहीं मिला।",
            "growth_action": "वर्तमान लाभ मार्जिन को सुरक्षित रखते हुए बिक्री बढ़ाने पर ध्यान दें।",
        },
        "mr": {
            "expense_reason": "परिचालन खर्च महसुलापेक्षा जास्त आहेत.",
            "expense_action": "मुख्य खर्चांच्या श्रेणींचा आढावा घ्या आणि अनावश्यक खर्च कमी करा.",
            "profit_reason": "व्यवसाय सध्या निव्वळ तोट्यात चालत आहे.",
            "profit_action": "किंमत, उत्पादन मार्जिन आणि परिचालन खर्चांचा आढावा घ्या.",
            "margin_reason": "सध्याचा निव्वळ नफा मार्जिन 10% पेक्षा कमी आहे.",
            "margin_action": "कमी मार्जिनची उत्पादने, किंमती, सवलती आणि खर्चांचा आढावा घ्या.",
            "stock_reason": lambda count: f"{count} सक्रिय उत्पादने स्टॉक मर्यादेवर किंवा त्याखाली आहेत.",
            "stock_action": "कमी स्टॉक असलेल्या उत्पादनांचा आढावा घ्या आणि प्राधान्याची उत्पादने पुन्हा स्टॉक करा.",
            "customer_reason": "सध्या कोणतेही सक्रिय ग्राहक उपलब्ध नाहीत.",
            "customer_action": "ग्राहक मिळवण्यावर आणि नियमित लीड पाइपलाइन तयार करण्यावर लक्ष केंद्रित करा.",
            "growth_reason": "उपलब्ध डेटामध्ये कोणताही गंभीर व्यावसायिक धोका आढळला नाही.",
            "growth_action": "सध्याचे नफा मार्जिन सुरक्षित ठेवून विक्री वाढवण्यावर लक्ष केंद्रित करा.",
        },
        "bn": {
            "expense_reason": "পরিচালন ব্যয় রাজস্বের চেয়ে বেশি।",
            "expense_action": "প্রধান ব্যয়ের বিভাগ পর্যালোচনা করুন এবং অপ্রয়োজনীয় খরচ কমান।",
            "profit_reason": "ব্যবসাটি বর্তমানে নিট লোকসানে চলছে।",
            "profit_action": "মূল্য নির্ধারণ, পণ্যের মার্জিন এবং পরিচালন ব্যয় পর্যালোচনা করুন।",
            "margin_reason": "বর্তমান নিট লাভের মার্জিন ১০%-এর নিচে।",
            "margin_action": "কম মার্জিনের পণ্য, মূল্য, ছাড় এবং ব্যয় পর্যালোচনা করুন।",
            "stock_reason": lambda count: f"{count}টি সক্রিয় পণ্যের স্টক সীমার সমান বা তার নিচে।",
            "stock_action": "কম স্টকের পণ্য পর্যালোচনা করুন এবং অগ্রাধিকার পণ্য পুনরায় স্টক করুন।",
            "customer_reason": "বর্তমানে কোনো সক্রিয় গ্রাহক নেই।",
            "customer_action": "গ্রাহক অর্জন এবং নিয়মিত লিড পাইপলাইন তৈরিতে মনোযোগ দিন।",
            "growth_reason": "উপলব্ধ ডেটায় কোনো গুরুতর ব্যবসায়িক ঝুঁকি শনাক্ত হয়নি।",
            "growth_action": "বর্তমান লাভের মার্জিন রক্ষা করে বিক্রয় বাড়ানোর দিকে মনোযোগ দিন।",
        },
        "gu": {
            "expense_reason": "ઓપરેટિંગ ખર્ચ આવક કરતાં વધારે છે.",
            "expense_action": "મુખ્ય ખર્ચની શ્રેણીઓની સમીક્ષા કરો અને ટાળી શકાય તેવા ખર્ચ ઘટાડો.",
            "profit_reason": "વ્યવસાય હાલમાં ચોખ્ખી ખોટમાં ચાલી રહ્યો છે.",
            "profit_action": "કિંમત, ઉત્પાદન માર્જિન અને ઓપરેટિંગ ખર્ચની સમીક્ષા કરો.",
            "margin_reason": "હાલનો ચોખ્ખો નફો માર્જિન 10% કરતાં ઓછો છે.",
            "margin_action": "ઓછા માર્જિનવાળા ઉત્પાદનો, કિંમતો, ડિસ્કાઉન્ટ અને ખર્ચની સમીક્ષા કરો.",
            "stock_reason": lambda count: f"{count} સક્રિય ઉત્પાદન(ો) સ્ટોક મર્યાદા પર અથવા તેનાથી નીચે છે.",
            "stock_action": "ઓછા સ્ટોકવાળા ઉત્પાદનોની સમીક્ષા કરો અને સૌથી જરૂરી ઉત્પાદનો ફરીથી સ્ટોક કરો.",
            "customer_reason": "હાલમાં કોઈ સક્રિય ગ્રાહકો ઉપલબ્ધ નથી.",
            "customer_action": "ગ્રાહક મેળવવા અને નિયમિત લીડ પાઇપલાઇન બનાવવા પર ધ્યાન આપો.",
            "growth_reason": "ઉપલબ્ધ ડેટામાં કોઈ ગંભીર વ્યવસાયિક જોખમ મળ્યું નથી.",
            "growth_action": "હાલના નફા માર્જિનને સુરક્ષિત રાખીને વેચાણ વધારવા પર ધ્યાન આપો.",
        },
        "ta": {
            "expense_reason": "இயக்கச் செலவுகள் வருவாயை விட அதிகமாக உள்ளன.",
            "expense_action": "முக்கிய செலவு வகைகளை மதிப்பாய்வு செய்து தவிர்க்கக்கூடிய செலவுகளை குறைக்கவும்.",
            "profit_reason": "வணிகம் தற்போது நிகர இழப்பில் இயங்குகிறது.",
            "profit_action": "விலை நிர்ணயம், தயாரிப்பு லாப வரம்பு மற்றும் இயக்கச் செலவுகளை மதிப்பாய்வு செய்யவும்.",
            "margin_reason": "தற்போதைய நிகர லாப வரம்பு 10%-க்கும் குறைவாக உள்ளது.",
            "margin_action": "குறைந்த லாப வரம்புள்ள தயாரிப்புகள், விலைகள், தள்ளுபடிகள் மற்றும் செலவுகளை மதிப்பாய்வு செய்யவும்.",
            "stock_reason": lambda count: f"{count} செயலில் உள்ள தயாரிப்புகள் பங்கு வரம்பில் அல்லது அதற்கு கீழே உள்ளன.",
            "stock_action": "குறைந்த கையிருப்பு தயாரிப்புகளை மதிப்பாய்வு செய்து முக்கிய தயாரிப்புகளை மீண்டும் கையிருப்பில் வைக்கவும்.",
            "customer_reason": "தற்போது செயலில் உள்ள வாடிக்கையாளர்கள் இல்லை.",
            "customer_action": "வாடிக்கையாளர் சேர்க்கை மற்றும் தொடர்ச்சியான லீட் பைப்லைனை உருவாக்குவதில் கவனம் செலுத்தவும்.",
            "growth_reason": "கிடைக்கக்கூடிய தரவில் முக்கியமான வணிக ஆபத்து எதுவும் கண்டறியப்படவில்லை.",
            "growth_action": "தற்போதைய லாப வரம்பை பாதுகாத்து விற்பனையை அதிகரிப்பதில் கவனம் செலுத்தவும்.",
        },
        "te": {
            "expense_reason": "నిర్వహణ ఖర్చులు ఆదాయం కంటే ఎక్కువగా ఉన్నాయి.",
            "expense_action": "ప్రధాన ఖర్చుల వర్గాలను సమీక్షించి నివారించగల ఖర్చులను తగ్గించండి.",
            "profit_reason": "వ్యాపారం ప్రస్తుతం నికర నష్టంలో నడుస్తోంది.",
            "profit_action": "ధరలు, ఉత్పత్తి మార్జిన్‌లు మరియు నిర్వహణ ఖర్చులను సమీక్షించండి.",
            "margin_reason": "ప్రస్తుత నికర లాభ మార్జిన్ 10% కంటే తక్కువగా ఉంది.",
            "margin_action": "తక్కువ మార్జిన్ ఉత్పత్తులు, ధరలు, డిస్కౌంట్లు మరియు ఖర్చులను సమీక్షించండి.",
            "stock_reason": lambda count: f"{count} క్రియాశీల ఉత్పత్తులు స్టాక్ పరిమితి వద్ద లేదా దాని కంటే తక్కువగా ఉన్నాయి.",
            "stock_action": "తక్కువ స్టాక్ ఉత్పత్తులను సమీక్షించి ముఖ్యమైన ఉత్పత్తులను తిరిగి నిల్వ చేయండి.",
            "customer_reason": "ప్రస్తుతం క్రియాశీల కస్టమర్లు లేరు.",
            "customer_action": "కస్టమర్ సంపాదన మరియు నిరంతర లీడ్ పైప్‌లైన్‌పై దృష్టి పెట్టండి.",
            "growth_reason": "అందుబాటులో ఉన్న డేటాలో కీలకమైన వ్యాపార ప్రమాదం గుర్తించబడలేదు.",
            "growth_action": "ప్రస్తుత లాభ మార్జిన్‌ను కాపాడుతూ అమ్మకాలను పెంచడంపై దృష్టి పెట్టండి.",
        },
        "kn": {
            "expense_reason": "ಕಾರ್ಯಾಚರಣಾ ವೆಚ್ಚಗಳು ಆದಾಯಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿವೆ.",
            "expense_action": "ಪ್ರಮುಖ ವೆಚ್ಚ ವಿಭಾಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ತಪ್ಪಿಸಬಹುದಾದ ವೆಚ್ಚಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ.",
            "profit_reason": "ವ್ಯವಹಾರವು ಪ್ರಸ್ತುತ ನಿವ್ವಳ ನಷ್ಟದಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.",
            "profit_action": "ಬೆಲೆ, ಉತ್ಪನ್ನ ಮಾರ್ಜಿನ್ ಮತ್ತು ಕಾರ್ಯಾಚರಣಾ ವೆಚ್ಚಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "margin_reason": "ಪ್ರಸ್ತುತ ನಿವ್ವಳ ಲಾಭ ಮಾರ್ಜಿನ್ 10% ಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ.",
            "margin_action": "ಕಡಿಮೆ ಮಾರ್ಜಿನ್ ಉತ್ಪನ್ನಗಳು, ಬೆಲೆಗಳು, ರಿಯಾಯಿತಿಗಳು ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "stock_reason": lambda count: f"{count} ಸಕ್ರಿಯ ಉತ್ಪನ್ನಗಳು ಸ್ಟಾಕ್ ಮಿತಿಯಲ್ಲಿ ಅಥವಾ ಅದಕ್ಕಿಂತ ಕಡಿಮೆಯಲ್ಲಿವೆ.",
            "stock_action": "ಕಡಿಮೆ ಸ್ಟಾಕ್ ಉತ್ಪನ್ನಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಆದ್ಯತೆಯ ಉತ್ಪನ್ನಗಳನ್ನು ಮರುಸ್ಟಾಕ್ ಮಾಡಿ.",
            "customer_reason": "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಗ್ರಾಹಕರು ಲಭ್ಯವಿಲ್ಲ.",
            "customer_action": "ಗ್ರಾಹಕರನ್ನು ಪಡೆಯಲು ಮತ್ತು ನಿರಂತರ ಲೀಡ್ ಪೈಪ್‌ಲೈನ್ ನಿರ್ಮಿಸಲು ಗಮನಹರಿಸಿ.",
            "growth_reason": "ಲಭ್ಯವಿರುವ ಡೇಟಾದಲ್ಲಿ ಯಾವುದೇ ಪ್ರಮುಖ ವ್ಯವಹಾರ ಅಪಾಯ ಪತ್ತೆಯಾಗಿಲ್ಲ.",
            "growth_action": "ಪ್ರಸ್ತುತ ಲಾಭ ಮಾರ್ಜಿನ್ ಕಾಪಾಡಿಕೊಂಡು ಮಾರಾಟವನ್ನು ಹೆಚ್ಚಿಸುವತ್ತ ಗಮನಹರಿಸಿ.",
        },
        "ml": {
            "expense_reason": "പ്രവർത്തന ചെലവുകൾ വരുമാനത്തേക്കാൾ കൂടുതലാണ്.",
            "expense_action": "പ്രധാന ചെലവ് വിഭാഗങ്ങൾ പരിശോധിച്ച് ഒഴിവാക്കാവുന്ന ചെലവുകൾ കുറയ്ക്കുക.",
            "profit_reason": "ബിസിനസ് ഇപ്പോൾ അറ്റ നഷ്ടത്തിലാണ് പ്രവർത്തിക്കുന്നത്.",
            "profit_action": "വിലനിർണ്ണയം, ഉൽപ്പന്ന മാർജിൻ, പ്രവർത്തന ചെലവുകൾ എന്നിവ പരിശോധിക്കുക.",
            "margin_reason": "നിലവിലെ അറ്റ ലാഭ മാർജിൻ 10%-ൽ താഴെയാണ്.",
            "margin_action": "കുറഞ്ഞ മാർജിൻ ഉൽപ്പന്നങ്ങൾ, വിലകൾ, ഇളവുകൾ, ചെലവുകൾ എന്നിവ പരിശോധിക്കുക.",
            "stock_reason": lambda count: f"{count} സജീവ ഉൽപ്പന്നങ്ങൾ സ്റ്റോക്ക് പരിധിയിലോ അതിൽ താഴെയോ ആണ്.",
            "stock_action": "കുറഞ്ഞ സ്റ്റോക്കുള്ള ഉൽപ്പന്നങ്ങൾ പരിശോധിച്ച് മുൻഗണനാ ഉൽപ്പന്നങ്ങൾ വീണ്ടും സ്റ്റോക്ക് ചെയ്യുക.",
            "customer_reason": "നിലവിൽ സജീവമായ ഉപഭോക്താക്കൾ ലഭ്യമല്ല.",
            "customer_action": "ഉപഭോക്താക്കളെ നേടുന്നതിലും സ്ഥിരമായ ലീഡ് പൈപ്പ്‌ലൈൻ സൃഷ്ടിക്കുന്നതിലും ശ്രദ്ധിക്കുക.",
            "growth_reason": "ലഭ്യമായ ഡാറ്റയിൽ ഗുരുതരമായ ബിസിനസ് അപകടസാധ്യത കണ്ടെത്തിയിട്ടില്ല.",
            "growth_action": "നിലവിലെ ലാഭ മാർജിൻ സംരക്ഷിച്ച് വിൽപ്പന വർധിപ്പിക്കുന്നതിൽ ശ്രദ്ധിക്കുക.",
        },
        "pa": {
            "expense_reason": "ਕਾਰੋਬਾਰੀ ਖਰਚੇ ਆਮਦਨ ਨਾਲੋਂ ਵੱਧ ਹਨ।",
            "expense_action": "ਮੁੱਖ ਖਰਚਾ ਸ਼੍ਰੇਣੀਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ ਅਤੇ ਬਚਾਏ ਜਾ ਸਕਣ ਵਾਲੇ ਖਰਚੇ ਘਟਾਓ।",
            "profit_reason": "ਕਾਰੋਬਾਰ ਇਸ ਵੇਲੇ ਸ਼ੁੱਧ ਘਾਟੇ ਵਿੱਚ ਚੱਲ ਰਿਹਾ ਹੈ।",
            "profit_action": "ਕੀਮਤ, ਉਤਪਾਦ ਮਾਰਜਿਨ ਅਤੇ ਕਾਰੋਬਾਰੀ ਖਰਚਿਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।",
            "margin_reason": "ਮੌਜੂਦਾ ਸ਼ੁੱਧ ਲਾਭ ਮਾਰਜਿਨ 10% ਤੋਂ ਘੱਟ ਹੈ।",
            "margin_action": "ਘੱਟ ਮਾਰਜਿਨ ਵਾਲੇ ਉਤਪਾਦਾਂ, ਕੀਮਤਾਂ, ਛੂਟਾਂ ਅਤੇ ਖਰਚਿਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।",
            "stock_reason": lambda count: f"{count} ਸਰਗਰਮ ਉਤਪਾਦ ਸਟਾਕ ਸੀਮਾ 'ਤੇ ਜਾਂ ਇਸ ਤੋਂ ਹੇਠਾਂ ਹਨ।",
            "stock_action": "ਘੱਟ ਸਟਾਕ ਵਾਲੇ ਉਤਪਾਦਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ ਅਤੇ ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਉਤਪਾਦ ਮੁੜ ਸਟਾਕ ਕਰੋ।",
            "customer_reason": "ਇਸ ਵੇਲੇ ਕੋਈ ਸਰਗਰਮ ਗਾਹਕ ਉਪਲਬਧ ਨਹੀਂ ਹਨ।",
            "customer_action": "ਗਾਹਕ ਪ੍ਰਾਪਤੀ ਅਤੇ ਨਿਯਮਤ ਲੀਡ ਪਾਈਪਲਾਈਨ ਬਣਾਉਣ 'ਤੇ ਧਿਆਨ ਦਿਓ।",
            "growth_reason": "ਉਪਲਬਧ ਡੇਟਾ ਵਿੱਚ ਕੋਈ ਗੰਭੀਰ ਕਾਰੋਬਾਰੀ ਜੋਖਮ ਨਹੀਂ ਮਿਲਿਆ।",
            "growth_action": "ਮੌਜੂਦਾ ਲਾਭ ਮਾਰਜਿਨ ਨੂੰ ਸੁਰੱਖਿਅਤ ਰੱਖਦੇ ਹੋਏ ਵਿਕਰੀ ਵਧਾਉਣ 'ਤੇ ਧਿਆਨ ਦਿਓ।",
        },
        "ur": {
            "expense_reason": "آپریٹنگ اخراجات آمدنی سے زیادہ ہیں۔",
            "expense_action": "اہم اخراجاتی شعبوں کا جائزہ لیں اور غیر ضروری اخراجات کم کریں۔",
            "profit_reason": "کاروبار اس وقت خالص نقصان میں چل رہا ہے۔",
            "profit_action": "قیمتوں، مصنوعات کے مارجن اور آپریٹنگ اخراجات کا جائزہ لیں۔",
            "margin_reason": "موجودہ خالص منافع کا مارجن 10 فیصد سے کم ہے۔",
            "margin_action": "کم مارجن والی مصنوعات، قیمتوں، رعایتوں اور اخراجات کا جائزہ لیں۔",
            "stock_reason": lambda count: f"{count} فعال مصنوعات اسٹاک کی حد پر یا اس سے کم ہیں۔",
            "stock_action": "کم اسٹاک والی مصنوعات کا جائزہ لیں اور ترجیحی مصنوعات دوبارہ اسٹاک کریں۔",
            "customer_reason": "اس وقت کوئی فعال صارف دستیاب نہیں ہے۔",
            "customer_action": "صارفین حاصل کرنے اور مستقل لیڈ پائپ لائن بنانے پر توجہ دیں۔",
            "growth_reason": "دستیاب ڈیٹا میں کوئی اہم کاروباری خطرہ نہیں ملا۔",
            "growth_action": "موجودہ منافع کے مارجن کو برقرار رکھتے ہوئے فروخت بڑھانے پر توجہ دیں۔",
        },
        "or": {
            "expense_reason": "ପରିଚାଳନା ଖର୍ଚ୍ଚ ରାଜସ୍ୱଠାରୁ ଅଧିକ ଅଟେ।",
            "expense_action": "ମୁଖ୍ୟ ଖର୍ଚ୍ଚ ବିଭାଗଗୁଡ଼ିକର ସମୀକ୍ଷା କରନ୍ତୁ ଏବଂ ଏଡ଼ାଇପାରିବା ଖର୍ଚ୍ଚ କମାନ୍ତୁ।",
            "profit_reason": "ବ୍ୟବସାୟ ବର୍ତ୍ତମାନ ନିଟ୍ କ୍ଷତିରେ ଚାଲୁଛି।",
            "profit_action": "ମୂଲ୍ୟ ନିର୍ଦ୍ଧାରଣ, ଉତ୍ପାଦ ମାର୍ଜିନ ଏବଂ ପରିଚାଳନା ଖର୍ଚ୍ଚର ସମୀକ୍ଷା କରନ୍ତୁ।",
            "margin_reason": "ବର୍ତ୍ତମାନର ନିଟ୍ ଲାଭ ମାର୍ଜିନ 10% ଠାରୁ କମ୍ ଅଟେ।",
            "margin_action": "କମ୍ ମାର୍ଜିନ ଉତ୍ପାଦ, ମୂଲ୍ୟ, ରିହାତି ଏବଂ ଖର୍ଚ୍ଚର ସମୀକ୍ଷା କରନ୍ତୁ।",
            "stock_reason": lambda count: f"{count} ସକ୍ରିୟ ଉତ୍ପାଦ ଷ୍ଟକ୍ ସୀମାରେ କିମ୍ବା ତାହାଠାରୁ କମ୍ ଅଛି।",
            "stock_action": "କମ୍ ଷ୍ଟକ୍ ଥିବା ଉତ୍ପାଦଗୁଡ଼ିକର ସମୀକ୍ଷା କରନ୍ତୁ ଏବଂ ଅଗ୍ରାଧିକାର ଉତ୍ପାଦଗୁଡ଼ିକୁ ପୁନଃ ଷ୍ଟକ୍ କରନ୍ତୁ।",
            "customer_reason": "ବର୍ତ୍ତମାନ କୌଣସି ସକ୍ରିୟ ଗ୍ରାହକ ଉପଲବ୍ଧ ନାହାନ୍ତି।",
            "customer_action": "ଗ୍ରାହକ ଅର୍ଜନ ଏବଂ ନିୟମିତ ଲିଡ୍ ପାଇପଲାଇନ୍ ତିଆରି ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ।",
            "growth_reason": "ଉପଲବ୍ଧ ତଥ୍ୟରେ କୌଣସି ଗୁରୁତର ବ୍ୟବସାୟିକ ବିପଦ ଚିହ୍ନଟ ହୋଇନାହିଁ।",
            "growth_action": "ବର୍ତ୍ତମାନର ଲାଭ ମାର୍ଜିନ ସୁରକ୍ଷିତ ରଖି ବିକ୍ରୟ ବୃଦ୍ଧି ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ।",
        },
        "as": {
            "expense_reason": "পৰিচালনাৰ খৰচ ৰাজহতকৈ অধিক।",
            "expense_action": "মুখ্য খৰচৰ শ্ৰেণীসমূহ পৰ্যালোচনা কৰি এৰাব পৰা খৰচ কমাওক।",
            "profit_reason": "ব্যৱসায়টো বৰ্তমান মুঠ লোকচানত চলি আছে।",
            "profit_action": "মূল্য নিৰ্ধাৰণ, পণ্যৰ মাৰ্জিন আৰু পৰিচালনাৰ খৰচ পৰ্যালোচনা কৰক।",
            "margin_reason": "বৰ্তমানৰ মুঠ লাভৰ মাৰ্জিন ১০%-তকৈ কম।",
            "margin_action": "কম মাৰ্জিনৰ পণ্য, মূল্য, ৰেহাই আৰু খৰচ পৰ্যালোচনা কৰক।",
            "stock_reason": lambda count: f"{count} সক্ৰিয় পণ্য ষ্টকৰ সীমাত বা তাৰ তলত আছে।",
            "stock_action": "কম ষ্টকৰ পণ্যসমূহ পৰ্যালোচনা কৰি অগ্ৰাধিকাৰৰ পণ্য পুনৰ ষ্টক কৰক।",
            "customer_reason": "বৰ্তমান কোনো সক্ৰিয় গ্ৰাহক উপলব্ধ নাই।",
            "customer_action": "গ্ৰাহক আহৰণ আৰু নিয়মীয়া লীড পাইপলাইন সৃষ্টি কৰাত গুৰুত্ব দিয়ক।",
            "growth_reason": "উপলব্ধ তথ্যত কোনো গুৰুতৰ ব্যৱসায়িক বিপদ ধৰা পৰা নাই।",
            "growth_action": "বৰ্তমানৰ লাভৰ মাৰ্জিন সুৰক্ষিত ৰাখি বিক্ৰী বৃদ্ধি কৰাত গুৰুত্ব দিয়ক।",
        },
    }

    texts = decision_text.get(lang, decision_text["en"])

    decisions = []

    if total_revenue > 0 and total_expenses > total_revenue:
        decisions.append({
            "decision": "REDUCE_EXPENSES",
            "priority": "HIGH",
            "reason": texts["expense_reason"],
            "recommended_action": texts["expense_action"],
            "confidence": 0.99,
        })

    elif net_profit < 0:
        decisions.append({
            "decision": "IMPROVE_PROFITABILITY",
            "priority": "HIGH",
            "reason": texts["profit_reason"],
            "recommended_action": texts["profit_action"],
            "confidence": 0.99,
        })

    elif profit_margin < 10 and total_revenue > 0:
        decisions.append({
            "decision": "IMPROVE_MARGIN",
            "priority": "MEDIUM",
            "reason": texts["margin_reason"],
            "recommended_action": texts["margin_action"],
            "confidence": 0.96,
        })

    if low_stock_products:
        decisions.append({
            "decision": "RESTOCK_INVENTORY",
            "priority": "MEDIUM",
            "reason": texts["stock_reason"](len(low_stock_products)),
            "recommended_action": texts["stock_action"],
            "confidence": 0.98,
        })

    if len(customers) == 0:
        decisions.append({
            "decision": "ACQUIRE_CUSTOMERS",
            "priority": "MEDIUM",
            "reason": texts["customer_reason"],
            "recommended_action": texts["customer_action"],
            "confidence": 0.99,
        })

    if not decisions:
        decisions.append({
            "decision": "GROW_REVENUE",
            "priority": "LOW",
            "reason": texts["growth_reason"],
            "recommended_action": texts["growth_action"],
            "confidence": 0.90,
        })

    priority_order = {
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
    }

    decisions.sort(
        key=lambda item: priority_order.get(
            item["priority"],
            99,
        )
    )

    primary_decision = decisions[0]

    return {
        "business_id": business_id,
        "engine": "NEXORA AI Decision Engine",
        "version": "1.0",
        "status": "operational",
        "primary_decision": primary_decision,
        "decisions": decisions,
        "business_snapshot": {
            "revenue": round(total_revenue, 2),
            "expenses": round(total_expenses, 2),
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_percent": round(profit_margin, 2),
            "active_customers": len(customers),
            "active_products": len(products),
            "low_stock_products": len(low_stock_products),
        },
        "decision_count": len(decisions),
    }


# ============================================================
# COPILOT MULTILINGUAL TEXT
# ============================================================


def intelligence_text(language: str, insight_type: str, **kwargs) -> dict:
    language = language if language in {
        "en", "hi", "mr", "bn", "gu", "ta", "te",
        "kn", "ml", "pa", "ur", "or", "as"
    } else "en"

    values = {
        "en": {
            "profitability_risk": (
                "Business is currently operating at a loss",
                "Net profit is ₹{value:.2f} below zero based on the available business data.",
                "Review operating expenses, pricing, and gross margins to identify the largest sources of loss."
            ),
            "margin_risk": (
                "Profit margin needs attention",
                "Current net profit margin is {value:.2f}%.",
                "Review product margins and major expense categories."
            ),
            "expense_risk": (
                "Expenses are higher than revenue",
                "Recorded expenses of ₹{expenses:.2f} are higher than revenue of ₹{revenue:.2f}.",
                "Break down expenses by category and review the largest recurring costs."
            ),
            "inventory_risk": (
                "Products require stock attention",
                "{count} active product(s) are at or below their configured stock threshold.",
                "Review replenishment requirements for: {names}"
            ),
            "customer_risk": (
                "No active customers found",
                "NEXORA does not currently have active customer records for this business.",
                "Add customer records and connect sales to customers to unlock customer intelligence."
            ),
            "positive_signal": (
                "Products are generating positive gross profit",
                "Gross profit is ₹{value:.2f} before operating expenses.",
                "Identify products with the strongest margins and evaluate opportunities to increase their sales."
            ),
        },

        "hi": {
            "profitability_risk": (
                "व्यवसाय वर्तमान में घाटे में चल रहा है",
                "उपलब्ध व्यावसायिक डेटा के अनुसार शुद्ध लाभ ₹{value:.2f} ऋणात्मक है।",
                "परिचालन खर्च, मूल्य निर्धारण और सकल मार्जिन की समीक्षा करके घाटे के मुख्य कारण पहचानें।"
            ),
            "margin_risk": (
                "लाभ मार्जिन पर ध्यान देने की आवश्यकता है",
                "वर्तमान शुद्ध लाभ मार्जिन {value:.2f}% है।",
                "उत्पाद मार्जिन और प्रमुख खर्च श्रेणियों की समीक्षा करें।"
            ),
            "expense_risk": (
                "खर्च राजस्व से अधिक हैं",
                "दर्ज खर्च ₹{expenses:.2f} हैं, जो ₹{revenue:.2f} के राजस्व से अधिक हैं।",
                "खर्चों को श्रेणी के अनुसार देखें और सबसे बड़े नियमित खर्चों की समीक्षा करें।"
            ),
            "inventory_risk": (
                "कुछ उत्पादों के स्टॉक पर ध्यान देने की आवश्यकता है",
                "{count} सक्रिय उत्पाद अपने निर्धारित स्टॉक स्तर पर या उससे नीचे हैं।",
                "इन उत्पादों की पुनःपूर्ति आवश्यकताओं की समीक्षा करें: {names}"
            ),
            "customer_risk": (
                "कोई सक्रिय ग्राहक नहीं मिला",
                "NEXORA के पास इस व्यवसाय के लिए वर्तमान में कोई सक्रिय ग्राहक रिकॉर्ड नहीं है।",
                "ग्राहक रिकॉर्ड जोड़ें और ग्राहक इंटेलिजेंस शुरू करने के लिए बिक्री को ग्राहकों से जोड़ें।"
            ),
            "positive_signal": (
                "उत्पाद सकारात्मक सकल लाभ दे रहे हैं",
                "परिचालन खर्चों से पहले सकल लाभ ₹{value:.2f} है।",
                "सबसे मजबूत मार्जिन वाले उत्पादों की पहचान करें और उनकी बिक्री बढ़ाने के अवसर देखें।"
            ),
        },

        "mr": {
            "profitability_risk": (
                "व्यवसाय सध्या तोट्यात चालू आहे",
                "उपलब्ध व्यावसायिक डेटानुसार निव्वळ नफा ₹{value:.2f} ने नकारात्मक आहे.",
                "ऑपरेटिंग खर्च, किंमत आणि ग्रॉस मार्जिन तपासून तोट्याची मुख्य कारणे ओळखा."
            ),
            "margin_risk": (
                "नफा मार्जिनकडे लक्ष देण्याची गरज आहे",
                "सध्याचे निव्वळ नफा मार्जिन {value:.2f}% आहे.",
                "उत्पादन मार्जिन आणि प्रमुख खर्च श्रेणींचा आढावा घ्या."
            ),
            "expense_risk": (
                "खर्च महसुलापेक्षा जास्त आहेत",
                "नोंदवलेले खर्च ₹{expenses:.2f} असून ते ₹{revenue:.2f} महसुलापेक्षा जास्त आहेत.",
                "खर्च श्रेणीनुसार तपासा आणि सर्वात मोठ्या नियमित खर्चांचा आढावा घ्या."
            ),
            "inventory_risk": (
                "काही उत्पादनांच्या स्टॉककडे लक्ष देणे आवश्यक आहे",
                "{count} सक्रिय उत्पादने त्यांच्या निर्धारित स्टॉक पातळीवर किंवा त्याखाली आहेत.",
                "पुनर्भरणाची गरज असलेल्या उत्पादनांचा आढावा घ्या: {names}"
            ),
            "customer_risk": (
                "कोणतेही सक्रिय ग्राहक आढळले नाहीत",
                "NEXORA कडे या व्यवसायासाठी सध्या सक्रिय ग्राहक नोंदी नाहीत.",
                "ग्राहक नोंदी जोडा आणि ग्राहक इंटेलिजन्ससाठी विक्री ग्राहकांशी जोडा."
            ),
            "positive_signal": (
                "उत्पादने सकारात्मक सकल नफा देत आहेत",
                "ऑपरेटिंग खर्चांपूर्वी सकल नफा ₹{value:.2f} आहे.",
                "सर्वोत्तम मार्जिन असलेली उत्पादने ओळखा आणि त्यांची विक्री वाढवण्याच्या संधी तपासा."
            ),
        },

        "bn": {
            "profitability_risk": (
                "ব্যবসা বর্তমানে লোকসানে চলছে",
                "উপলব্ধ ব্যবসায়িক তথ্য অনুযায়ী নিট লাভ ₹{value:.2f} নেতিবাচক।",
                "অপারেটিং খরচ, মূল্য নির্ধারণ এবং গ্রস মার্জিন পর্যালোচনা করুন।"
            ),
            "margin_risk": (
                "লাভের মার্জিনে নজর দেওয়া প্রয়োজন",
                "বর্তমান নিট লাভের মার্জিন {value:.2f}%。",
                "পণ্য মার্জিন এবং প্রধান খরচের বিভাগ পর্যালোচনা করুন।"
            ),
            "expense_risk": (
                "খরচ রাজস্বের চেয়ে বেশি",
                "নথিভুক্ত খরচ ₹{expenses:.2f}, যা ₹{revenue:.2f} রাজস্বের চেয়ে বেশি।",
                "খরচের বিভাগ বিশ্লেষণ করুন এবং বড় নিয়মিত খরচ পর্যালোচনা করুন।"
            ),
            "inventory_risk": (
                "কিছু পণ্যের স্টকে নজর দেওয়া প্রয়োজন",
                "{count}টি সক্রিয় পণ্য নির্ধারিত স্টক সীমায় বা তার নিচে রয়েছে।",
                "পুনরায় স্টক করার প্রয়োজনীয়তা পর্যালোচনা করুন: {names}"
            ),
            "customer_risk": (
                "কোনও সক্রিয় গ্রাহক পাওয়া যায়নি",
                "এই ব্যবসার জন্য বর্তমানে কোনও সক্রিয় গ্রাহক রেকর্ড নেই।",
                "গ্রাহক রেকর্ড যোগ করুন এবং গ্রাহক ইন্টেলিজেন্সের জন্য বিক্রয়কে গ্রাহকদের সঙ্গে যুক্ত করুন।"
            ),
            "positive_signal": (
                "পণ্যগুলো ইতিবাচক গ্রস লাভ তৈরি করছে",
                "অপারেটিং খরচের আগে গ্রস লাভ ₹{value:.2f}।",
                "সর্বোচ্চ মার্জিনের পণ্য শনাক্ত করুন এবং তাদের বিক্রয় বাড়ানোর সুযোগ দেখুন।"
            ),
        },

        "gu": {
            "profitability_risk": (
                "વ્યવસાય હાલમાં નુકસાનમાં ચાલી રહ્યો છે",
                "ઉપલબ્ધ વ્યવસાયિક ડેટા મુજબ ચોખ્ખો નફો ₹{value:.2f} નકારાત્મક છે.",
                "ઓપરેટિંગ ખર્ચ, કિંમત અને ગ્રોસ માર્જિનની સમીક્ષા કરો."
            ),
            "margin_risk": (
                "નફાના માર્જિન પર ધ્યાન આપવાની જરૂર છે",
                "વર્તમાન ચોખ્ખું નફાનું માર્જિન {value:.2f}% છે.",
                "પ્રોડક્ટ માર્જિન અને મુખ્ય ખર્ચ કેટેગરીની સમીક્ષા કરો."
            ),
            "expense_risk": (
                "ખર્ચ આવક કરતાં વધારે છે",
                "નોંધાયેલ ખર્ચ ₹{expenses:.2f} છે, જે ₹{revenue:.2f} આવક કરતાં વધારે છે.",
                "ખર્ચને કેટેગરી પ્રમાણે તપાસો અને સૌથી મોટા નિયમિત ખર્ચની સમીક્ષા કરો."
            ),
            "inventory_risk": (
                "કેટલાક ઉત્પાદનોના સ્ટોક પર ધ્યાન આપવાની જરૂર છે",
                "{count} સક્રિય ઉત્પાદનો તેમના નિર્ધારિત સ્ટોક સ્તરે અથવા તેનાથી નીચે છે.",
                "પુનઃસ્ટોકની જરૂરિયાતોની સમીક્ષા કરો: {names}"
            ),
            "customer_risk": (
                "કોઈ સક્રિય ગ્રાહક મળ્યો નથી",
                "આ વ્યવસાય માટે હાલમાં કોઈ સક્રિય ગ્રાહક રેકોર્ડ નથી.",
                "ગ્રાહક રેકોર્ડ ઉમેરો અને ગ્રાહક ઇન્ટેલિજન્સ માટે વેચાણને ગ્રાહકો સાથે જોડો."
            ),
            "positive_signal": (
                "ઉત્પાદનો સકારાત્મક ગ્રોસ નફો આપી રહ્યા છે",
                "ઓપરેટિંગ ખર્ચ પહેલાં ગ્રોસ નફો ₹{value:.2f} છે.",
                "સૌથી મજબૂત માર્જિનવાળા ઉત્પાદનો ઓળખો અને તેમની વેચાણ વધારવાની તકો જુઓ."
            ),
        },

        "ta": {
            "profitability_risk": (
                "வணிகம் தற்போது நஷ்டத்தில் இயங்குகிறது",
                "கிடைக்கக்கூடிய வணிகத் தரவின்படி நிகர லாபம் ₹{value:.2f} எதிர்மறையாக உள்ளது.",
                "இயக்கச் செலவுகள், விலை நிர்ணயம் மற்றும் மொத்த லாப வரம்புகளை மதிப்பாய்வு செய்யவும்."
            ),
            "margin_risk": (
                "லாப வரம்பில் கவனம் தேவை",
                "தற்போதைய நிகர லாப வரம்பு {value:.2f}% ஆகும்.",
                "தயாரிப்பு லாப வரம்புகள் மற்றும் முக்கிய செலவு வகைகளை மதிப்பாய்வு செய்யவும்."
            ),
            "expense_risk": (
                "செலவுகள் வருவாயை விட அதிகமாக உள்ளன",
                "பதிவுசெய்யப்பட்ட செலவுகள் ₹{expenses:.2f}, இது ₹{revenue:.2f} வருவாயை விட அதிகம்.",
                "செலவுகளை வகைப்படுத்தி பெரிய தொடர்ச்சியான செலவுகளை மதிப்பாய்வு செய்யவும்."
            ),
            "inventory_risk": (
                "சில தயாரிப்புகளின் இருப்பில் கவனம் தேவை",
                "{count} செயலில் உள்ள தயாரிப்புகள் நிர்ணயிக்கப்பட்ட இருப்பு அளவில் அல்லது அதற்குக் கீழே உள்ளன.",
                "மீண்டும் இருப்பு நிரப்ப வேண்டிய தயாரிப்புகளை மதிப்பாய்வு செய்யவும்: {names}"
            ),
            "customer_risk": (
                "செயலில் உள்ள வாடிக்கையாளர்கள் இல்லை",
                "இந்த வணிகத்திற்கான செயலில் உள்ள வாடிக்கையாளர் பதிவுகள் தற்போது இல்லை.",
                "வாடிக்கையாளர் பதிவுகளைச் சேர்த்து விற்பனையை வாடிக்கையாளர்களுடன் இணைக்கவும்."
            ),
            "positive_signal": (
                "தயாரிப்புகள் நேர்மறையான மொத்த லாபத்தை உருவாக்குகின்றன",
                "இயக்கச் செலவுகளுக்கு முன் மொத்த லாபம் ₹{value:.2f} ஆகும்.",
                "அதிக லாப வரம்பு கொண்ட தயாரிப்புகளை கண்டறிந்து அவற்றின் விற்பனையை அதிகரிக்கவும்."
            ),
        },

        "te": {
            "profitability_risk": (
                "వ్యాపారం ప్రస్తుతం నష్టంలో నడుస్తోంది",
                "అందుబాటులో ఉన్న వ్యాపార డేటా ప్రకారం నికర లాభం ₹{value:.2f} ప్రతికూలంగా ఉంది.",
                "నిర్వహణ ఖర్చులు, ధర నిర్ణయం మరియు స్థూల లాభ మార్జిన్లను సమీక్షించండి."
            ),
            "margin_risk": (
                "లాభ మార్జిన్‌పై శ్రద్ధ అవసరం",
                "ప్రస్తుత నికర లాభ మార్జిన్ {value:.2f}%.",
                "ఉత్పత్తి మార్జిన్లు మరియు ప్రధాన ఖర్చు వర్గాలను సమీక్షించండి."
            ),
            "expense_risk": (
                "ఖర్చులు ఆదాయం కంటే ఎక్కువగా ఉన్నాయి",
                "నమోదైన ఖర్చులు ₹{expenses:.2f}, ఇవి ₹{revenue:.2f} ఆదాయం కంటే ఎక్కువ.",
                "ఖర్చులను వర్గాల వారీగా సమీక్షించి పెద్ద పునరావృత ఖర్చులను పరిశీలించండి."
            ),
            "inventory_risk": (
                "కొన్ని ఉత్పత్తుల స్టాక్‌పై శ్రద్ధ అవసరం",
                "{count} క్రియాశీల ఉత్పత్తులు నిర్ణయించిన స్టాక్ స్థాయిలో లేదా దాని కంటే తక్కువగా ఉన్నాయి.",
                "మళ్లీ స్టాక్ చేయాల్సిన ఉత్పత్తులను సమీక్షించండి: {names}"
            ),
            "customer_risk": (
                "క్రియాశీల కస్టమర్లు కనుగొనబడలేదు",
                "ఈ వ్యాపారానికి ప్రస్తుతం క్రియాశీల కస్టమర్ రికార్డులు లేవు.",
                "కస్టమర్ రికార్డులను జోడించి అమ్మకాలను కస్టమర్లతో అనుసంధానించండి."
            ),
            "positive_signal": (
                "ఉత్పత్తులు సానుకూల స్థూల లాభాన్ని అందిస్తున్నాయి",
                "నిర్వహణ ఖర్చులకు ముందు స్థూల లాభం ₹{value:.2f}.",
                "అధిక మార్జిన్ ఉన్న ఉత్పత్తులను గుర్తించి వాటి అమ్మకాలను పెంచండి."
            ),
        },

        "kn": {
            "profitability_risk": (
                "ವ್ಯವಹಾರವು ಪ್ರಸ್ತುತ ನಷ್ಟದಲ್ಲಿ ನಡೆಯುತ್ತಿದೆ",
                "ಲಭ್ಯವಿರುವ ವ್ಯವಹಾರ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ನಿವ್ವಳ ಲಾಭ ₹{value:.2f} ನಕಾರಾತ್ಮಕವಾಗಿದೆ.",
                "ಕಾರ್ಯಾಚರಣಾ ವೆಚ್ಚ, ಬೆಲೆ ನಿಗದಿ ಮತ್ತು ಒಟ್ಟು ಲಾಭಾಂಶವನ್ನು ಪರಿಶೀಲಿಸಿ."
            ),
            "margin_risk": (
                "ಲಾಭಾಂಶದ ಬಗ್ಗೆ ಗಮನ ಅಗತ್ಯ",
                "ಪ್ರಸ್ತುತ ನಿವ್ವಳ ಲಾಭಾಂಶ {value:.2f}% ಆಗಿದೆ.",
                "ಉತ್ಪನ್ನ ಲಾಭಾಂಶ ಮತ್ತು ಪ್ರಮುಖ ವೆಚ್ಚ ವರ್ಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
            ),
            "expense_risk": (
                "ವೆಚ್ಚಗಳು ಆದಾಯಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿವೆ",
                "ದಾಖಲಾಗಿರುವ ವೆಚ್ಚ ₹{expenses:.2f}, ಇದು ₹{revenue:.2f} ಆದಾಯಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ.",
                "ವೆಚ್ಚಗಳನ್ನು ವರ್ಗವಾರು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ದೊಡ್ಡ ಮರುಕಳಿಸುವ ವೆಚ್ಚಗಳನ್ನು ಗಮನಿಸಿ."
            ),
            "inventory_risk": (
                "ಕೆಲವು ಉತ್ಪನ್ನಗಳ ಸ್ಟಾಕ್ ಬಗ್ಗೆ ಗಮನ ಅಗತ್ಯ",
                "{count} ಸಕ್ರಿಯ ಉತ್ಪನ್ನಗಳು ನಿಗದಿತ ಸ್ಟಾಕ್ ಮಟ್ಟದಲ್ಲಿ ಅಥವಾ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಇವೆ.",
                "ಮರುಪೂರೈಕೆ ಅಗತ್ಯವಿರುವ ಉತ್ಪನ್ನಗಳನ್ನು ಪರಿಶೀಲಿಸಿ: {names}"
            ),
            "customer_risk": (
                "ಸಕ್ರಿಯ ಗ್ರಾಹಕರು ಕಂಡುಬಂದಿಲ್ಲ",
                "ಈ ವ್ಯವಹಾರಕ್ಕೆ ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಗ್ರಾಹಕ ದಾಖಲೆಗಳಿಲ್ಲ.",
                "ಗ್ರಾಹಕ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಿ ಮತ್ತು ಮಾರಾಟವನ್ನು ಗ್ರಾಹಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ."
            ),
            "positive_signal": (
                "ಉತ್ಪನ್ನಗಳು ಧನಾತ್ಮಕ ಒಟ್ಟು ಲಾಭವನ್ನು ನೀಡುತ್ತಿವೆ",
                "ಕಾರ್ಯಾಚರಣಾ ವೆಚ್ಚಗಳ ಮೊದಲು ಒಟ್ಟು ಲಾಭ ₹{value:.2f} ಆಗಿದೆ.",
                "ಅತ್ಯುತ್ತಮ ಲಾಭಾಂಶ ಹೊಂದಿರುವ ಉತ್ಪನ್ನಗಳ ಮಾರಾಟವನ್ನು ಹೆಚ್ಚಿಸುವ ಅವಕಾಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
            ),
        },

        "ml": {
            "profitability_risk": (
                "ബിസിനസ് നിലവിൽ നഷ്ടത്തിലാണ് പ്രവർത്തിക്കുന്നത്",
                "ലഭ്യമായ ബിസിനസ് ഡാറ്റ പ്രകാരം അറ്റാദായം ₹{value:.2f} നെഗറ്റീവാണ്.",
                "പ്രവർത്തന ചെലവുകൾ, വിലനിർണ്ണയം, മൊത്ത ലാഭ മാർജിൻ എന്നിവ പരിശോധിക്കുക."
            ),
            "margin_risk": (
                "ലാഭ മാർജിനിൽ ശ്രദ്ധ ആവശ്യമാണ്",
                "നിലവിലെ അറ്റാദായ മാർജിൻ {value:.2f}% ആണ്.",
                "ഉൽപ്പന്ന മാർജിനുകളും പ്രധാന ചെലവ് വിഭാഗങ്ങളും പരിശോധിക്കുക."
            ),
            "expense_risk": (
                "ചെലവുകൾ വരുമാനത്തേക്കാൾ കൂടുതലാണ്",
                "രേഖപ്പെടുത്തിയ ചെലവുകൾ ₹{expenses:.2f}, ഇത് ₹{revenue:.2f} വരുമാനത്തേക്കാൾ കൂടുതലാണ്.",
                "ചെലവുകൾ വിഭാഗം തിരിച്ച് പരിശോധിക്കുകയും വലിയ ആവർത്തിച്ചുള്ള ചെലവുകൾ അവലോകനം ചെയ്യുകയും ചെയ്യുക."
            ),
            "inventory_risk": (
                "ചില ഉൽപ്പന്നങ്ങളുടെ സ്റ്റോക്കിൽ ശ്രദ്ധ ആവശ്യമാണ്",
                "{count} സജീവ ഉൽപ്പന്നങ്ങൾ നിശ്ചയിച്ച സ്റ്റോക്ക് പരിധിയിലോ അതിന് താഴെയോ ആണ്.",
                "വീണ്ടും സ്റ്റോക്ക് ചെയ്യേണ്ട ഉൽപ്പന്നങ്ങൾ പരിശോധിക്കുക: {names}"
            ),
            "customer_risk": (
                "സജീവ ഉപഭോക്താക്കളെ കണ്ടെത്തിയില്ല",
                "ഈ ബിസിനസിനായി നിലവിൽ സജീവ ഉപഭോക്തൃ രേഖകളൊന്നുമില്ല.",
                "ഉപഭോക്തൃ രേഖകൾ ചേർത്ത് വിൽപ്പനയെ ഉപഭോക്താക്കളുമായി ബന്ധിപ്പിക്കുക."
            ),
            "positive_signal": (
                "ഉൽപ്പന്നങ്ങൾ പോസിറ്റീവ് മൊത്ത ലാഭം സൃഷ്ടിക്കുന്നു",
                "പ്രവർത്തന ചെലവുകൾക്ക് മുമ്പുള്ള മൊത്ത ലാഭം ₹{value:.2f} ആണ്.",
                "മികച്ച മാർജിൻ ഉള്ള ഉൽപ്പന്നങ്ങളുടെ വിൽപ്പന വർധിപ്പിക്കുന്ന അവസരങ്ങൾ പരിശോധിക്കുക."
            ),
        },

        "pa": {
            "profitability_risk": (
                "ਕਾਰੋਬਾਰ ਇਸ ਸਮੇਂ ਘਾਟੇ ਵਿੱਚ ਚੱਲ ਰਿਹਾ ਹੈ",
                "ਉਪਲਬਧ ਕਾਰੋਬਾਰੀ ਡੇਟਾ ਅਨੁਸਾਰ ਸ਼ੁੱਧ ਲਾਭ ₹{value:.2f} ਨਕਾਰਾਤਮਕ ਹੈ।",
                "ਓਪਰੇਟਿੰਗ ਖਰਚੇ, ਕੀਮਤ ਅਤੇ ਕੁੱਲ ਮਾਰਜਿਨ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।"
            ),
            "margin_risk": (
                "ਲਾਭ ਮਾਰਜਿਨ ਵੱਲ ਧਿਆਨ ਦੀ ਲੋੜ ਹੈ",
                "ਮੌਜੂਦਾ ਸ਼ੁੱਧ ਲਾਭ ਮਾਰਜਿਨ {value:.2f}% ਹੈ।",
                "ਉਤਪਾਦ ਮਾਰਜਿਨ ਅਤੇ ਮੁੱਖ ਖਰਚਾ ਸ਼੍ਰੇਣੀਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।"
            ),
            "expense_risk": (
                "ਖਰਚੇ ਆਮਦਨ ਨਾਲੋਂ ਵੱਧ ਹਨ",
                "ਦਰਜ ਖਰਚੇ ₹{expenses:.2f} ਹਨ, ਜੋ ₹{revenue:.2f} ਆਮਦਨ ਨਾਲੋਂ ਵੱਧ ਹਨ।",
                "ਖਰਚਿਆਂ ਨੂੰ ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਦੇਖੋ ਅਤੇ ਵੱਡੇ ਨਿਯਮਤ ਖਰਚਿਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।"
            ),
            "inventory_risk": (
                "ਕੁਝ ਉਤਪਾਦਾਂ ਦੇ ਸਟਾਕ ਵੱਲ ਧਿਆਨ ਦੀ ਲੋੜ ਹੈ",
                "{count} ਸਰਗਰਮ ਉਤਪਾਦ ਨਿਰਧਾਰਤ ਸਟਾਕ ਪੱਧਰ 'ਤੇ ਜਾਂ ਇਸ ਤੋਂ ਹੇਠਾਂ ਹਨ।",
                "ਦੁਬਾਰਾ ਸਟਾਕ ਭਰਨ ਦੀ ਲੋੜ ਵਾਲੇ ਉਤਪਾਦਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ: {names}"
            ),
            "customer_risk": (
                "ਕੋਈ ਸਰਗਰਮ ਗਾਹਕ ਨਹੀਂ ਮਿਲਿਆ",
                "ਇਸ ਕਾਰੋਬਾਰ ਲਈ ਇਸ ਵੇਲੇ ਕੋਈ ਸਰਗਰਮ ਗਾਹਕ ਰਿਕਾਰਡ ਨਹੀਂ ਹੈ।",
                "ਗਾਹਕ ਰਿਕਾਰਡ ਸ਼ਾਮਲ ਕਰੋ ਅਤੇ ਵਿਕਰੀ ਨੂੰ ਗਾਹਕਾਂ ਨਾਲ ਜੋੜੋ।"
            ),
            "positive_signal": (
                "ਉਤਪਾਦ ਸਕਾਰਾਤਮਕ ਕੁੱਲ ਲਾਭ ਪੈਦਾ ਕਰ ਰਹੇ ਹਨ",
                "ਓਪਰੇਟਿੰਗ ਖਰਚਿਆਂ ਤੋਂ ਪਹਿਲਾਂ ਕੁੱਲ ਲਾਭ ₹{value:.2f} ਹੈ।",
                "ਵਧੀਆ ਮਾਰਜਿਨ ਵਾਲੇ ਉਤਪਾਦਾਂ ਦੀ ਪਛਾਣ ਕਰਕੇ ਉਨ੍ਹਾਂ ਦੀ ਵਿਕਰੀ ਵਧਾਓ।"
            ),
        },

        "ur": {
            "profitability_risk": (
                "کاروبار اس وقت خسارے میں چل رہا ہے",
                "دستیاب کاروباری معلومات کے مطابق خالص منافع ₹{value:.2f} منفی ہے۔",
                "آپریٹنگ اخراجات، قیمتوں اور مجموعی مارجن کا جائزہ لیں۔"
            ),
            "margin_risk": (
                "منافع کے مارجن پر توجہ کی ضرورت ہے",
                "موجودہ خالص منافع کا مارجن {value:.2f}% ہے۔",
                "مصنوعات کے مارجن اور اہم اخراجات کی اقسام کا جائزہ لیں۔"
            ),
            "expense_risk": (
                "اخراجات آمدنی سے زیادہ ہیں",
                "درج شدہ اخراجات ₹{expenses:.2f} ہیں، جو ₹{revenue:.2f} آمدنی سے زیادہ ہیں۔",
                "اخراجات کو زمرہ وار دیکھیں اور بڑے مستقل اخراجات کا جائزہ لیں۔"
            ),
            "inventory_risk": (
                "کچھ مصنوعات کے اسٹاک پر توجہ کی ضرورت ہے",
                "{count} فعال مصنوعات مقررہ اسٹاک کی حد پر یا اس سے کم ہیں۔",
                "دوبارہ اسٹاک کرنے کی ضرورت والی مصنوعات کا جائزہ لیں: {names}"
            ),
            "customer_risk": (
                "کوئی فعال گاہک نہیں ملا",
                "اس کاروبار کے لیے فی الحال کوئی فعال گاہک ریکارڈ موجود نہیں ہے۔",
                "گاہکوں کے ریکارڈ شامل کریں اور فروخت کو گاہکوں سے منسلک کریں۔"
            ),
            "positive_signal": (
                "مصنوعات مثبت مجموعی منافع پیدا کر رہی ہیں",
                "آپریٹنگ اخراجات سے پہلے مجموعی منافع ₹{value:.2f} ہے۔",
                "بہترین مارجن والی مصنوعات کی فروخت بڑھانے کے مواقع دیکھیں۔"
            ),
        },

        "or": {
            "profitability_risk": (
                "ବ୍ୟବସାୟ ବର୍ତ୍ତମାନ କ୍ଷତିରେ ଚାଲିଛି",
                "ଉପଲବ୍ଧ ବ୍ୟବସାୟିକ ତଥ୍ୟ ଅନୁଯାୟୀ ନିଟ୍ ଲାଭ ₹{value:.2f} ନକାରାତ୍ମକ ଅଟେ।",
                "ପରିଚାଳନା ଖର୍ଚ୍ଚ, ମୂଲ୍ୟ ଏବଂ ମୋଟ ମାର୍ଜିନ ସମୀକ୍ଷା କରନ୍ତୁ।"
            ),
            "margin_risk": (
                "ଲାଭ ମାର୍ଜିନ ପ୍ରତି ଧ୍ୟାନ ଆବଶ୍ୟକ",
                "ବର୍ତ୍ତମାନ ନିଟ୍ ଲାଭ ମାର୍ଜିନ {value:.2f}% ଅଟେ।",
                "ଉତ୍ପାଦ ମାର୍ଜିନ ଏବଂ ମୁଖ୍ୟ ଖର୍ଚ୍ଚ ବର୍ଗଗୁଡ଼ିକୁ ସମୀକ୍ଷା କରନ୍ତୁ।"
            ),
            "expense_risk": (
                "ଖର୍ଚ୍ଚ ରାଜସ୍ୱଠାରୁ ଅଧିକ",
                "ରେକର୍ଡ ହୋଇଥିବା ଖର୍ଚ୍ଚ ₹{expenses:.2f}, ଯାହା ₹{revenue:.2f} ରାଜସ୍ୱଠାରୁ ଅଧିକ।",
                "ଖର୍ଚ୍ଚକୁ ବର୍ଗ ଅନୁଯାୟୀ ସମୀକ୍ଷା କରନ୍ତୁ।"
            ),
            "inventory_risk": (
                "କିଛି ଉତ୍ପାଦର ଷ୍ଟକ୍ ପ୍ରତି ଧ୍ୟାନ ଆବଶ୍ୟକ",
                "{count} ସକ୍ରିୟ ଉତ୍ପାଦ ନିର୍ଦ୍ଧାରିତ ଷ୍ଟକ୍ ସୀମାରେ କିମ୍ବା ତାହାଠାରୁ କମ୍ ଅଛି।",
                "ପୁନଃଷ୍ଟକ୍ ଆବଶ୍ୟକତା ଥିବା ଉତ୍ପାଦଗୁଡ଼ିକ ସମୀକ୍ଷା କରନ୍ତୁ: {names}"
            ),
            "customer_risk": (
                "କୌଣସି ସକ୍ରିୟ ଗ୍ରାହକ ମିଳିଲେ ନାହିଁ",
                "ଏହି ବ୍ୟବସାୟ ପାଇଁ ବର୍ତ୍ତମାନ କୌଣସି ସକ୍ରିୟ ଗ୍ରାହକ ରେକର୍ଡ ନାହିଁ।",
                "ଗ୍ରାହକ ରେକର୍ଡ ଯୋଡନ୍ତୁ ଏବଂ ବିକ୍ରୟକୁ ଗ୍ରାହକଙ୍କ ସହିତ ଯୋଡନ୍ତୁ।"
            ),
            "positive_signal": (
                "ଉତ୍ପାଦଗୁଡ଼ିକ ସକାରାତ୍ମକ ମୋଟ ଲାଭ ସୃଷ୍ଟି କରୁଛନ୍ତି",
                "ପରିଚାଳନା ଖର୍ଚ୍ଚ ପୂର୍ବରୁ ମୋଟ ଲାଭ ₹{value:.2f} ଅଟେ।",
                "ସର୍ବୋତ୍ତମ ମାର୍ଜିନ ଥିବା ଉତ୍ପାଦର ବିକ୍ରୟ ବୃଦ୍ଧିର ସୁଯୋଗ ଦେଖନ୍ତୁ।"
            ),
        },

        "as": {
            "profitability_risk": (
                "ব্যৱসায়টো বৰ্তমান লোকচানত চলি আছে",
                "উপলব্ধ ব্যৱসায়িক তথ্য অনুসৰি নিট লাভ ₹{value:.2f} ঋণাত্মক।",
                "পৰিচালনামূলক খৰচ, মূল্য নিৰ্ধাৰণ আৰু মুঠ মাৰ্জিন পৰ্যালোচনা কৰক।"
            ),
            "margin_risk": (
                "লাভৰ মাৰ্জিনত মনোযোগ দিয়াৰ প্ৰয়োজন",
                "বৰ্তমান নিট লাভৰ মাৰ্জিন {value:.2f}%।",
                "উৎপাদনৰ মাৰ্জিন আৰু মুখ্য খৰচৰ শ্ৰেণীসমূহ পৰ্যালোচনা কৰক।"
            ),
            "expense_risk": (
                "খৰচ ৰাজহতকৈ বেছি",
                "নথিভুক্ত খৰচ ₹{expenses:.2f}, যি ₹{revenue:.2f} ৰাজহতকৈ বেছি।",
                "খৰচসমূহ শ্ৰেণী অনুসৰি পৰ্যালোচনা কৰক।"
            ),
            "inventory_risk": (
                "কিছুমান উৎপাদনৰ ষ্টকৰ প্ৰতি মনোযোগ প্ৰয়োজন",
                "{count} সক্ৰিয় উৎপাদন নিৰ্ধাৰিত ষ্টক সীমাত বা তাৰ তলত আছে।",
                "পুনৰ ষ্টক কৰাৰ প্ৰয়োজন হোৱা উৎপাদনসমূহ পৰ্যালোচনা কৰক: {names}"
            ),
            "customer_risk": (
                "কোনো সক্ৰিয় গ্ৰাহক পোৱা নগ'ল",
                "এই ব্যৱসায়ৰ বাবে বৰ্তমান কোনো সক্ৰিয় গ্ৰাহকৰ ৰেকৰ্ড নাই।",
                "গ্ৰাহকৰ ৰেকৰ্ড যোগ কৰক আৰু বিক্ৰীক গ্ৰাহকৰ সৈতে সংযোগ কৰক।"
            ),
            "positive_signal": (
                "উৎপাদনসমূহে ইতিবাচক মুঠ লাভ সৃষ্টি কৰিছে",
                "পৰিচালনামূলক খৰচৰ আগতে মুঠ লাভ ₹{value:.2f}।",
                "সৰ্বোত্তম মাৰ্জিন থকা উৎপাদনৰ বিক্ৰী বৃদ্ধি কৰাৰ সুযোগ পৰ্যালোচনা কৰক।"
            ),
        },
    }

    base = values.get(language, values["en"]).get(insight_type, values["en"][insight_type])
    return {
        "title": base[0],
        "explanation": base[1].format(**kwargs),
        "recommended_action": base[2].format(**kwargs),
    }


def copilot_text(language: str) -> dict:
    texts = {
        "en": {
            "current_revenue": "Current revenue is",
            "gross_profit": "Gross profit is",
            "net_profit": "Net profit is",
            "active_customers": "NEXORA currently has",
            "new_customers": "new customer(s) were added in the last",
            "days": "days",
            "customer_growth": "Customer growth signal is",
            "active_products": "active product(s)",
            "stock_units": "total stock unit(s)",
            "inventory_value": "Inventory value is",
            "low_stock": "product(s) are low in stock",
            "out_of_stock": "product(s) are out of stock",
            "inventory_health": "Inventory health signal is",
            "expenses": "Recorded expenses are",
            "review_expenses": "Review the largest recurring expense categories before making cost decisions.",
            "completed_sales": "completed sale(s)",
            "average_order": "Average order value is",
            "gross_margin": "gross margin of",
            "revenue_7_days": "Revenue in the last 7 days is",
            "revenue_signal": "The current revenue signal is",
            "profitability_answer": "Current revenue is ₹{revenue:.2f}. Gross profit is ₹{gross_profit:.2f}, while net profit is ₹{net_profit:.2f}.",
        },
        "hi": {
            "current_revenue": "वर्तमान राजस्व है",
            "gross_profit": "सकल लाभ है",
            "net_profit": "शुद्ध लाभ है",
            "active_customers": "NEXORA में वर्तमान में",
            "new_customers": "नए ग्राहक पिछले",
            "days": "दिनों में जोड़े गए।",
            "customer_growth": "ग्राहक वृद्धि संकेत है",
            "active_products": "सक्रिय उत्पाद",
            "stock_units": "कुल स्टॉक यूनिट",
            "inventory_value": "इन्वेंटरी मूल्य है",
            "low_stock": "उत्पादों का स्टॉक कम है",
            "out_of_stock": "उत्पादों का स्टॉक समाप्त है",
            "inventory_health": "इन्वेंटरी स्वास्थ्य संकेत है",
            "expenses": "दर्ज खर्च हैं",
            "review_expenses": "लागत संबंधी निर्णय लेने से पहले सबसे बड़े बार-बार होने वाले खर्चों की समीक्षा करें।",
            "completed_sales": "पूर्ण बिक्री",
            "average_order": "औसत ऑर्डर मूल्य है",
            "gross_margin": "सकल मार्जिन",
            "revenue_7_days": "पिछले 7 दिनों का राजस्व है",
            "revenue_signal": "वर्तमान राजस्व संकेत है",
            "profitability_answer": "वर्तमान राजस्व ₹{revenue:.2f} है। सकल लाभ ₹{gross_profit:.2f} है, जबकि शुद्ध लाभ ₹{net_profit:.2f} है।",
        },
        "mr": {
            "current_revenue": "सध्याचा महसूल आहे",
            "gross_profit": "एकूण नफा आहे",
            "net_profit": "निव्वळ नफा आहे",
            "active_customers": "NEXORA मध्ये सध्या",
            "new_customers": "नवीन ग्राहक मागील",
            "days": "दिवसांत जोडले गेले.",
            "customer_growth": "ग्राहक वाढीचा संकेत आहे",
            "active_products": "सक्रिय उत्पादने",
            "stock_units": "एकूण स्टॉक युनिट्स",
            "inventory_value": "इन्व्हेंटरी मूल्य आहे",
            "low_stock": "उत्पादनांचा स्टॉक कमी आहे",
            "out_of_stock": "उत्पादनांचा स्टॉक संपला आहे",
            "inventory_health": "इन्व्हेंटरी स्थितीचा संकेत आहे",
            "expenses": "नोंदवलेले खर्च आहेत",
            "review_expenses": "खर्चाचे निर्णय घेण्यापूर्वी सर्वात मोठ्या वारंवार होणाऱ्या खर्चांचे पुनरावलोकन करा.",
            "completed_sales": "पूर्ण झालेल्या विक्री",
            "average_order": "सरासरी ऑर्डर मूल्य आहे",
            "gross_margin": "एकूण मार्जिन",
            "revenue_7_days": "मागील 7 दिवसांचा महसूल आहे",
            "revenue_signal": "सध्याचा महसूल संकेत आहे",
            "profitability_answer": "सध्याचा महसूल ₹{revenue:.2f} आहे. एकूण नफा ₹{gross_profit:.2f} आहे, तर निव्वळ नफा ₹{net_profit:.2f} आहे.",
        },
        "bn": {
            "current_revenue": "বর্তমান রাজস্ব",
            "gross_profit": "মোট লাভ",
            "net_profit": "নিট লাভ",
            "active_customers": "NEXORA-তে বর্তমানে",
            "new_customers": "নতুন গ্রাহক গত",
            "days": "দিনে যোগ হয়েছে।",
            "customer_growth": "গ্রাহক বৃদ্ধির সংকেত হলো",
            "revenue_signal": "বর্তমান রাজস্ব সংকেত",
            "profitability_answer": "বর্তমান রাজস্ব ₹{revenue:.2f}। মোট লাভ ₹{gross_profit:.2f}, আর নিট লাভ ₹{net_profit:.2f}।",
        },

        "ta": {
            "current_revenue": "தற்போதைய வருவாய்",
            "gross_profit": "மொத்த லாபம்",
            "net_profit": "நிகர லாபம்",
            "active_customers": "NEXORA-வில் தற்போது",
            "new_customers": "புதிய வாடிக்கையாளர்கள் கடந்த",
            "days": "நாட்களில் சேர்க்கப்பட்டுள்ளனர்.",
            "customer_growth": "வாடிக்கையாளர் வளர்ச்சி சமிக்ஞை",
            "revenue_signal": "தற்போதைய வருவாய் சமிக்ஞை",
            "profitability_answer": "தற்போதைய வருவாய் ₹{revenue:.2f}. மொத்த லாபம் ₹{gross_profit:.2f}, நிகர லாபம் ₹{net_profit:.2f}.",
        },

        "te": {
            "current_revenue": "ప్రస్తుత ఆదాయం",
            "gross_profit": "స్థూల లాభం",
            "net_profit": "నికర లాభం",
            "active_customers": "NEXORAలో ప్రస్తుతం",
            "new_customers": "కొత్త కస్టమర్లు గత",
            "days": "రోజుల్లో చేరారు.",
            "customer_growth": "కస్టమర్ వృద్ధి సంకేతం",
            "revenue_signal": "ప్రస్తుత ఆదాయ సంకేతం",
            "profitability_answer": "ప్రస్తుత ఆదాయం ₹{revenue:.2f}. స్థూల లాభం ₹{gross_profit:.2f}, నికర లాభం ₹{net_profit:.2f}.",
        },

        "kn": {
            "current_revenue": "ಪ್ರಸ್ತುತ ಆದಾಯ",
            "gross_profit": "ಒಟ್ಟು ಲಾಭ",
            "net_profit": "ನಿವ್ವಳ ಲಾಭ",
            "active_customers": "NEXORAದಲ್ಲಿ ಪ್ರಸ್ತುತ",
            "new_customers": "ಹೊಸ ಗ್ರಾಹಕರು ಕಳೆದ",
            "days": "ದಿನಗಳಲ್ಲಿ ಸೇರಿದ್ದಾರೆ.",
            "customer_growth": "ಗ್ರಾಹಕರ ಬೆಳವಣಿಗೆಯ ಸಂಕೇತ",
            "revenue_signal": "ಪ್ರಸ್ತುತ ಆದಾಯದ ಸಂಕೇತ",
            "profitability_answer": "ಪ್ರಸ್ತುತ ಆದಾಯ ₹{revenue:.2f}. ಒಟ್ಟು ಲಾಭ ₹{gross_profit:.2f}, ನಿವ್ವಳ ಲಾಭ ₹{net_profit:.2f}.",
        },

        "ml": {
            "current_revenue": "നിലവിലെ വരുമാനം",
            "gross_profit": "മൊത്ത ലാഭം",
            "net_profit": "അറ്റ ലാഭം",
            "active_customers": "NEXORA-യിൽ നിലവിൽ",
            "new_customers": "പുതിയ ഉപഭോക്താക്കൾ കഴിഞ്ഞ",
            "days": "ദിവസങ്ങളിൽ ചേർന്നു.",
            "customer_growth": "ഉപഭോക്തൃ വളർച്ചാ സൂചന",
            "revenue_signal": "നിലവിലെ വരുമാന സൂചന",
            "profitability_answer": "നിലവിലെ വരുമാനം ₹{revenue:.2f}. മൊത്ത ലാഭം ₹{gross_profit:.2f}, അറ്റ ലാഭം ₹{net_profit:.2f}.",
        },

        "pa": {
            "current_revenue": "ਮੌਜੂਦਾ ਆਮਦਨ",
            "gross_profit": "ਕੁੱਲ ਮੁਨਾਫ਼ਾ",
            "net_profit": "ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ",
            "active_customers": "NEXORA ਵਿੱਚ ਇਸ ਵੇਲੇ",
            "new_customers": "ਨਵੇਂ ਗਾਹਕ ਪਿਛਲੇ",
            "days": "ਦਿਨਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਏ ਹਨ।",
            "customer_growth": "ਗਾਹਕ ਵਾਧੇ ਦਾ ਸੰਕੇਤ",
            "revenue_signal": "ਮੌਜੂਦਾ ਆਮਦਨ ਸੰਕੇਤ",
            "profitability_answer": "ਮੌਜੂਦਾ ਆਮਦਨ ₹{revenue:.2f} ਹੈ। ਕੁੱਲ ਮੁਨਾਫ਼ਾ ₹{gross_profit:.2f} ਹੈ ਅਤੇ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ ₹{net_profit:.2f} ਹੈ।",
        },

        "ur": {
            "current_revenue": "موجودہ آمدنی",
            "gross_profit": "مجموعی منافع",
            "net_profit": "خالص منافع",
            "active_customers": "NEXORA میں فی الحال",
            "new_customers": "نئے صارفین گزشتہ",
            "days": "دنوں میں شامل ہوئے ہیں۔",
            "customer_growth": "صارفین کی ترقی کا اشارہ",
            "revenue_signal": "موجودہ آمدنی کا اشارہ",
            "profitability_answer": "موجودہ آمدنی ₹{revenue:.2f} ہے۔ مجموعی منافع ₹{gross_profit:.2f} ہے، جبکہ خالص منافع ₹{net_profit:.2f} ہے۔",
        },

        "or": {
            "current_revenue": "ବର୍ତ୍ତମାନ ରାଜସ୍ୱ",
            "gross_profit": "ମୋଟ ଲାଭ",
            "net_profit": "ନିଟ୍ ଲାଭ",
            "active_customers": "NEXORAରେ ବର୍ତ୍ତମାନ",
            "new_customers": "ନୂଆ ଗ୍ରାହକ ଗତ",
            "days": "ଦିନ ମଧ୍ୟରେ ଯୋଡ଼ାଯାଇଛନ୍ତି।",
            "customer_growth": "ଗ୍ରାହକ ବୃଦ୍ଧି ସଙ୍କେତ",
            "revenue_signal": "ବର୍ତ୍ତମାନ ରାଜସ୍ୱ ସଙ୍କେତ",
            "profitability_answer": "ବର୍ତ୍ତମାନ ରାଜସ୍ୱ ₹{revenue:.2f}। ମୋଟ ଲାଭ ₹{gross_profit:.2f} ଏବଂ ନିଟ୍ ଲାଭ ₹{net_profit:.2f}।",
        },

        "as": {
            "current_revenue": "বৰ্তমান ৰাজহ",
            "gross_profit": "মুঠ লাভ",
            "net_profit": "নিকা লাভ",
            "active_customers": "NEXORA-ত বৰ্তমান",
            "new_customers": "নতুন গ্ৰাহক যোৱা",
            "days": "দিনত যোগ হৈছে।",
            "customer_growth": "গ্ৰাহক বৃদ্ধিৰ সংকেত",
            "revenue_signal": "বৰ্তমান ৰাজহৰ সংকেত",
            "profitability_answer": "বৰ্তমান ৰাজহ ₹{revenue:.2f}। মুঠ লাভ ₹{gross_profit:.2f} আৰু নিকা লাভ ₹{net_profit:.2f}।",
        },

        "gu": {
            "current_revenue": "વર્તમાન આવક છે",
            "gross_profit": "કુલ નફો છે",
            "net_profit": "ચોખ્ખો નફો છે",
            "active_customers": "NEXORA પાસે હાલમાં",
            "new_customers": "નવા ગ્રાહકો છેલ્લા",
            "days": "દિવસોમાં ઉમેરાયા છે.",
            "customer_growth": "ગ્રાહક વૃદ્ધિ સંકેત છે",
            "active_products": "સક્રિય પ્રોડક્ટ્સ",
            "stock_units": "કુલ સ્ટોક યુનિટ્સ",
            "inventory_value": "ઇન્વેન્ટરી મૂલ્ય છે",
            "low_stock": "પ્રોડક્ટ્સનો સ્ટોક ઓછો છે",
            "out_of_stock": "પ્રોડક્ટ્સનો સ્ટોક સમાપ્ત છે",
            "inventory_health": "ઇન્વેન્ટરી હેલ્થ સંકેત છે",
            "expenses": "નોંધાયેલા ખર્ચ છે",
            "review_expenses": "ખર્ચ અંગે નિર્ણય લેતા પહેલાં સૌથી મોટા વારંવાર થતા ખર્ચની સમીક્ષા કરો.",
            "completed_sales": "પૂર્ણ થયેલ વેચાણ",
            "average_order": "સરેરાશ ઓર્ડર મૂલ્ય છે",
            "gross_margin": "કુલ માર્જિન",
            "revenue_7_days": "છેલ્લા 7 દિવસની આવક છે",
            "revenue_signal": "વર્તમાન આવક સંકેત છે",
            "profitability_answer": "વર્તમાન આવક ₹{revenue:.2f} છે. કુલ નફો ₹{gross_profit:.2f} છે, જ્યારે ચોખ્ખો નફો ₹{net_profit:.2f} છે.",
        },
    }

    return texts.get(language, texts["en"])


# ============================================================
# NEXORA REVENUE INTELLIGENCE
# ============================================================

@app.get("/api/revenue/summary")
def revenue_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business_id = user.business_id

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.status == "completed",
        )
        .all()
    )

    total_revenue = sum(
        float(sale.total_amount or 0)
        for sale in sales
    )

    # --------------------------------------------------------
    # GROSS PROFIT / MARGIN
    # --------------------------------------------------------

    total_cogs = 0.0

    products_by_id = {
        product.id: product
        for product in db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    }

    for sale in sales:
        for item in sale.items:
            product = products_by_id.get(item.product_id)

            if product is None:
                continue

            quantity = float(item.quantity or 0)
            unit_cost = float(product.cost_price or 0)

            total_cogs += quantity * unit_cost

    gross_profit = total_revenue - total_cogs

    gross_margin_percent = (
        (gross_profit / total_revenue) * 100
        if total_revenue > 0
        else 0.0
    )

    # --------------------------------------------------------
    # REVENUE HEALTH
    revenue_growth_percent = 0.0
    # --------------------------------------------------------

    if total_revenue <= 0:
        revenue_health_signal = "no_revenue_data"
    elif revenue_growth_percent < 0:
        revenue_health_signal = "declining"
    elif gross_margin_percent < 10:
        revenue_health_signal = "margin_risk"
    elif revenue_growth_percent > 0:
        revenue_health_signal = "healthy_growth"
    else:
        revenue_health_signal = "stable"

    now = datetime.utcnow()

    revenue_7_days = 0.0
    revenue_30_days = 0.0
    previous_7_days_revenue = 0.0

    for sale in sales:
        sale_date = sale.sale_date

        if sale_date is None:
            continue

        try:
            sale_date = sale_date.replace(tzinfo=None)
        except (AttributeError, TypeError):
            pass

        try:
            age_days = (now - sale_date).days
        except TypeError:
            continue

        amount = float(sale.total_amount or 0)

        if age_days <= 7:
            revenue_7_days += amount

        if age_days <= 30:
            revenue_30_days += amount

        if 7 < age_days <= 14:
            previous_7_days_revenue += amount

    average_order_value = (
        total_revenue / len(sales)
        if sales
        else 0.0
    )

    if previous_7_days_revenue > 0:
        revenue_growth_percent = (
            (revenue_7_days - previous_7_days_revenue)
            / previous_7_days_revenue
        ) * 100
    elif revenue_7_days > 0:
        revenue_growth_percent = 100.0
    else:
        revenue_growth_percent = 0.0

    if revenue_7_days > previous_7_days_revenue:
        revenue_growth_signal = "positive"
    elif revenue_7_days < previous_7_days_revenue:
        revenue_growth_signal = "declining"
    else:
        revenue_growth_signal = "stable"

    # --------------------------------------------------------
    # 7-DAY REVENUE TREND
    # --------------------------------------------------------

    daily_revenue = {}

    for day_offset in range(6, -1, -1):
        day = (now - timedelta(days=day_offset)).date()
        daily_revenue[day.isoformat()] = 0.0

    for sale in sales:
        sale_date = sale.sale_date

        if sale_date is None:
            continue

        try:
            sale_date = sale_date.replace(tzinfo=None)
        except (AttributeError, TypeError):
            pass

        sale_day = sale_date.date()

        if sale_day.isoformat() in daily_revenue:
            daily_revenue[sale_day.isoformat()] += float(
                sale.total_amount or 0
            )

    revenue_trend = [
        {
            "date": date,
            "revenue": round(amount, 2),
        }
        for date, amount in daily_revenue.items()
    ]

    # --------------------------------------------------------
    # REVENUE FORECAST
    # --------------------------------------------------------

    if revenue_30_days > 0:
        average_daily_revenue = revenue_30_days / 30
        forecast_7_days = average_daily_revenue * 7
        forecast_signal = "available"
        forecast_basis = "30_day_average"
    else:
        average_daily_revenue = 0.0
        forecast_7_days = 0.0
        forecast_signal = "insufficient_data"
        forecast_basis = "insufficient_historical_revenue"

    return {
        "business_id": business_id,
        "status": "operational",
        "revenue": {
            "total": round(total_revenue, 2),
            "last_7_days": round(revenue_7_days, 2),
            "last_30_days": round(revenue_30_days, 2),
            "previous_7_days": round(previous_7_days_revenue, 2),
            "growth_percent": round(revenue_growth_percent, 2),
            "growth_signal": revenue_growth_signal,
            "cogs": round(total_cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin_percent": round(gross_margin_percent, 2),
            "health_signal": revenue_health_signal,
        },
        "sales": {
            "completed_sales": len(sales),
            "average_order_value": round(average_order_value, 2),
        },
        "trend": {
            "period": "7_days",
            "daily_revenue": revenue_trend,
        },
        "forecast": {
            "period": "next_7_days",
            "forecast_revenue": round(forecast_7_days, 2),
            "average_daily_revenue": round(average_daily_revenue, 2),
            "signal": forecast_signal,
            "basis": forecast_basis,
        },
    }



# ============================================================
# NEXORA AI COPILOT — SAFE FOUNDATION
# ============================================================

@app.get("/api/copilot/ask")
def copilot_ask(
    question: str,
    language: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Copilot input validation
    # --------------------------------------------------------
    question = question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if len(question) > 500:
        raise HTTPException(
            status_code=400,
            detail="Question must be 500 characters or less.",
        )

    supported_languages = {
        "en", "hi", "mr", "bn", "gu", "ta", "te",
        "kn", "ml", "pa", "ur", "or", "as",
    }

    if language not in supported_languages:
        language = "en"

    copilot_labels = copilot_text(language)

    business_id = user.business_id

    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            Product.is_active == True,
        )
        .all()
    )

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.status == "completed",
        )
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
        )
        .all()
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id,
            Customer.is_active == True,
        )
        .all()
    )

    total_revenue = sum(
        float(sale.total_amount or 0)
        for sale in sales
    )

    total_expenses = sum(
        float(expense.amount or 0)
        for expense in expenses
    )

    total_cogs = 0.0

    products_by_id = {
        product.id: product
        for product in db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    }

    for sale in sales:
        for item in sale.items:
            product = products_by_id.get(item.product_id)

            if product:
                total_cogs += (
                    float(item.quantity or 0)
                    * float(product.cost_price or 0)
                )

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    new_customers_7_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= seven_days_ago.replace(tzinfo=None)
    )

    new_customers_30_days = sum(
        1
        for customer in customers
        if customer.created_at
        and customer.created_at >= thirty_days_ago.replace(tzinfo=None)
    )

    if new_customers_30_days > 0:
        customer_growth_signal = "positive"
    elif len(customers) > 0:
        customer_growth_signal = "stable"
    else:
        customer_growth_signal = "no_customer_data"

    low_stock = [
        product
        for product in products
        if float(product.stock_quantity or 0)
        <= float(product.low_stock_threshold or 0)
    ]

    # --------------------------------------------------------
    # Inventory intelligence
    # --------------------------------------------------------
    total_stock_units = sum(
        float(product.stock_quantity or 0)
        for product in products
    )

    inventory_value = sum(
        float(product.stock_quantity or 0)
        * float(product.cost_price or 0)
        for product in products
    )

    out_of_stock_products = [
        product
        for product in products
        if float(product.stock_quantity or 0) <= 0
    ]

    low_stock_nonzero_products = [
        product
        for product in low_stock
        if float(product.stock_quantity or 0) > 0
    ]

    if len(out_of_stock_products) > 0:
        inventory_health_signal = "critical"
    elif len(low_stock_nonzero_products) > 0:
        inventory_health_signal = "attention"
    elif len(products) > 0:
        inventory_health_signal = "healthy"
    else:
        inventory_health_signal = "no_inventory_data"

    # --------------------------------------------------------
    # Revenue intelligence
    # --------------------------------------------------------
    from datetime import datetime

    now = datetime.utcnow()

    revenue_7_days = 0.0
    revenue_30_days = 0.0
    previous_7_days_revenue = 0.0

    for sale in sales:
        sale_date = sale.sale_date

        if sale_date is None:
            continue

        try:
            sale_date = sale_date.replace(tzinfo=None)
        except (AttributeError, TypeError):
            pass

        try:
            age_days = (now - sale_date).days
        except TypeError:
            continue

        amount = float(sale.total_amount or 0)

        if age_days <= 7:
            revenue_7_days += amount

        if age_days <= 30:
            revenue_30_days += amount

        if 7 < age_days <= 14:
            previous_7_days_revenue += amount

    average_order_value = (
        total_revenue / len(sales)
        if sales
        else 0.0
    )

    gross_margin_percent = (
        (gross_profit / total_revenue) * 100
        if total_revenue > 0
        else 0.0
    )

    if previous_7_days_revenue > 0:
        revenue_growth_percent = (
            (revenue_7_days - previous_7_days_revenue)
            / previous_7_days_revenue
        ) * 100
    elif revenue_7_days > 0:
        revenue_growth_percent = 100.0
    else:
        revenue_growth_percent = 0.0

    if revenue_7_days > previous_7_days_revenue:
        revenue_growth_signal = "positive"
    elif revenue_7_days < previous_7_days_revenue:
        revenue_growth_signal = "declining"
    else:
        revenue_growth_signal = "stable"

    q = question.lower()

    # --------------------------------------------------------
    # Safe intent detection
    # --------------------------------------------------------

    if any(
        word in q
        for word in [
            "profit",
            "loss",
            "margin",
            "munafa",
            "नफा",
            "लाभ",
            "profit",
            "નફો",
            "નફો કેટલો",
            "નફો કેટલો છે",
            "નફો કેવી રીતે",
            "માર્જિન",
            "লাভ",
            "লাভ কত",
            "লাভ কত হয়েছে",
            "মুনাফা",
            "মার্জিন",
            "லாபம்",
            "லாபம் எவ்வளவு",
            "மொத்த லாபம்",
            "நிகர லாபம்",
            "மார்ஜின்",
            "లాభం",
            "లాభం ఎంత",
            "స్థూల లాభం",
            "నికర లాభం",
            "మార్జిన్",
            "ಲಾಭ",
            "ಲಾಭ ಎಷ್ಟು",
            "ಒಟ್ಟು ಲಾಭ",
            "ನಿವ್ವಳ ಲಾಭ",
            "ಮಾರ್ಜಿನ್",
            "ലാഭം",
            "ലാഭം എത്ര",
            "മൊത്ത ലാഭം",
            "അറ്റ ലാഭം",
            "മാർജിൻ",
            "ਮੁਨਾਫ਼ਾ",
            "ਮੁਨਾਫ਼ਾ ਕਿੰਨਾ",
            "ਕੁੱਲ ਮੁਨਾਫ਼ਾ",
            "ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ",
            "ਮਾਰਜਿਨ",
            "منافع",
            "منافع کتنا",
            "مجموعی منافع",
            "خالص منافع",
            "مارجن",
            "ଲାଭ",
            "ଲାଭ କେତେ",
            "ମୋଟ ଲାଭ",
            "ନିଟ୍ ଲାଭ",
            "ମାର୍ଜିନ",
            "লাভ",
            "লাভ কিমান",
            "মুঠ লাভ",
            "নিকা লাভ",
            "মাৰ্জিন",
        ]
    ):
        answer = copilot_labels.get(
            "profitability_answer",
            copilot_text("en")["profitability_answer"],
        ).format(
            revenue=total_revenue,
            gross_profit=gross_profit,
            net_profit=net_profit,
        )

        topic = "profitability"

    elif any(
        word in q
        for word in [
            # English
            "customer",
            "customers",
            "client",
            "clients",
            "customer growth",
            "customer analytics",
            "customer data",
            "customer count",

            # Hindi
            "ग्राहक",
            "ग्राहकों",
            "ग्राहक वृद्धि",
            "ग्राहक डेटा",
            "कितने ग्राहक",
            "नए ग्राहक",

            # Marathi
            "ग्राहक",
            "ग्राहक वाढ",
            "ग्राहकांची संख्या",
            "नवीन ग्राहक",

            # Gujarati
            "ગ્રાહક",
            "ગ્રાહકો",
            "ગ્રાહક વૃદ્ધિ",
            "કેટલા ગ્રાહકો",
            "નવા ગ્રાહકો",

            # Bengali
            "গ্রাহক",
            "গ্রাহকদের",
            "গ্রাহক বৃদ্ধি",
            "কতজন গ্রাহক",
            "নতুন গ্রাহক",

            # Tamil
            "வாடிக்கையாளர்",
            "வாடிக்கையாளர்கள்",
            "வாடிக்கையாளர் வளர்ச்சி",
            "எத்தனை வாடிக்கையாளர்கள்",
            "புதிய வாடிக்கையாளர்கள்",

            # Telugu
            "కస్టమర్",
            "కస్టమర్లు",
            "కస్టమర్ వృద్ధి",
            "ఎంత మంది కస్టమర్లు",
            "కొత్త కస్టమర్లు",

            # Kannada
            "ಗ್ರಾಹಕ",
            "ಗ್ರಾಹಕರು",
            "ಗ್ರಾಹಕರ ಬೆಳವಣಿಗೆ",
            "ಎಷ್ಟು ಗ್ರಾಹಕರು",
            "ಹೊಸ ಗ್ರಾಹಕರು",

            # Malayalam
            "ഉപഭോക്താവ്",
            "ഉപഭോക്താക്കൾ",
            "ഉപഭോക്തൃ വളർച്ച",
            "എത്ര ഉപഭോക്താക്കൾ",
            "പുതിയ ഉപഭോക്താക്കൾ",

            # Punjabi
            "ਗਾਹਕ",
            "ਗਾਹਕਾਂ",
            "ਗਾਹਕ ਵਾਧਾ",
            "ਕਿੰਨੇ ਗਾਹਕ",
            "ਨਵੇਂ ਗਾਹਕ",

            # Urdu
            "صارف",
            "صارفین",
            "صارفین کی ترقی",
            "کتنے صارفین",
            "نئے صارفین",

            # Odia
            "ଗ୍ରାହକ",
            "ଗ୍ରାହକମାନେ",
            "ଗ୍ରାହକ ବୃଦ୍ଧି",
            "କେତେ ଗ୍ରାହକ",
            "ନୂଆ ଗ୍ରାହକ",

            # Assamese
            "গ্ৰাহক",
            "গ্ৰাহকসকল",
            "গ্ৰাহক বৃদ্ধি",
            "কিমান গ্ৰাহক",
            "নতুন গ্ৰাহক",
        ]
    ):
        customer_answers = {
            "en": (
                f"NEXORA currently has {len(customers)} active customer(s). "
                f"{new_customers_7_days} new customer(s) were added in the last 7 days "
                f"and {new_customers_30_days} in the last 30 days. "
                f"Customer growth signal is {customer_growth_signal}."
            ),
            "hi": (
                f"NEXORA में वर्तमान में {len(customers)} सक्रिय ग्राहक हैं। "
                f"पिछले 7 दिनों में {new_customers_7_days} नए ग्राहक जुड़े "
                f"और पिछले 30 दिनों में {new_customers_30_days} नए ग्राहक जुड़े। "
                f"ग्राहक वृद्धि संकेत {customer_growth_signal} है।"
            ),
            "mr": (
                f"NEXORA मध्ये सध्या {len(customers)} सक्रिय ग्राहक आहेत. "
                f"मागील 7 दिवसांत {new_customers_7_days} नवीन ग्राहक जोडले गेले "
                f"आणि मागील 30 दिवसांत {new_customers_30_days} नवीन ग्राहक जोडले गेले. "
                f"ग्राहक वाढीचा संकेत {customer_growth_signal} आहे."
            ),
            "bn": (
                f"NEXORA-তে বর্তমানে {len(customers)} জন সক্রিয় গ্রাহক আছেন। "
                f"গত 7 দিনে {new_customers_7_days} জন নতুন গ্রাহক যোগ হয়েছেন "
                f"এবং গত 30 দিনে {new_customers_30_days} জন নতুন গ্রাহক যোগ হয়েছেন। "
                f"গ্রাহক বৃদ্ধির সংকেত হলো {customer_growth_signal}।"
            ),
            "gu": (
                f"NEXORA પાસે હાલમાં {len(customers)} સક્રિય ગ્રાહકો છે. "
                f"છેલ્લા 7 દિવસમાં {new_customers_7_days} નવા ગ્રાહકો ઉમેરાયા "
                f"અને છેલ્લા 30 દિવસમાં {new_customers_30_days} નવા ગ્રાહકો ઉમેરાયા. "
                f"ગ્રાહક વૃદ્ધિ સંકેત {customer_growth_signal} છે."
            ),
            "ta": (
                f"NEXORA-வில் தற்போது {len(customers)} செயலில் உள்ள வாடிக்கையாளர்கள் உள்ளனர். "
                f"கடந்த 7 நாட்களில் {new_customers_7_days} புதிய வாடிக்கையாளர்கள் சேர்ந்துள்ளனர் "
                f"மற்றும் கடந்த 30 நாட்களில் {new_customers_30_days} புதிய வாடிக்கையாளர்கள் சேர்ந்துள்ளனர். "
                f"வாடிக்கையாளர் வளர்ச்சி சமிக்ஞை {customer_growth_signal}."
            ),
            "te": (
                f"NEXORAలో ప్రస్తుతం {len(customers)} యాక్టివ్ కస్టమర్లు ఉన్నారు. "
                f"గత 7 రోజుల్లో {new_customers_7_days} కొత్త కస్టమర్లు చేరారు "
                f"మరియు గత 30 రోజుల్లో {new_customers_30_days} కొత్త కస్టమర్లు చేరారు. "
                f"కస్టమర్ వృద్ధి సంకేతం {customer_growth_signal}."
            ),
            "kn": (
                f"NEXORAದಲ್ಲಿ ಪ್ರಸ್ತುತ {len(customers)} ಸಕ್ರಿಯ ಗ್ರಾಹಕರಿದ್ದಾರೆ. "
                f"ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ {new_customers_7_days} ಹೊಸ ಗ್ರಾಹಕರು ಸೇರಿದ್ದಾರೆ "
                f"ಮತ್ತು ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ {new_customers_30_days} ಹೊಸ ಗ್ರಾಹಕರು ಸೇರಿದ್ದಾರೆ. "
                f"ಗ್ರಾಹಕರ ಬೆಳವಣಿಗೆಯ ಸಂಕೇತ {customer_growth_signal}."
            ),
            "ml": (
                f"NEXORA-യിൽ നിലവിൽ {len(customers)} സജീവ ഉപഭോക്താക്കളുണ്ട്. "
                f"കഴിഞ്ഞ 7 ദിവസങ്ങളിൽ {new_customers_7_days} പുതിയ ഉപഭോക്താക്കൾ ചേർന്നു "
                f"കഴിഞ്ഞ 30 ദിവസങ്ങളിൽ {new_customers_30_days} പുതിയ ഉപഭോക്താക്കൾ ചേർന്നു. "
                f"ഉപഭോക്തൃ വളർച്ചാ സൂചന {customer_growth_signal} ആണ്."
            ),
            "pa": (
                f"NEXORA ਵਿੱਚ ਇਸ ਵੇਲੇ {len(customers)} ਸਰਗਰਮ ਗਾਹਕ ਹਨ। "
                f"ਪਿਛਲੇ 7 ਦਿਨਾਂ ਵਿੱਚ {new_customers_7_days} ਨਵੇਂ ਗਾਹਕ ਸ਼ਾਮਲ ਹੋਏ "
                f"ਅਤੇ ਪਿਛਲੇ 30 ਦਿਨਾਂ ਵਿੱਚ {new_customers_30_days} ਨਵੇਂ ਗਾਹਕ ਸ਼ਾਮਲ ਹੋਏ। "
                f"ਗਾਹਕ ਵਾਧੇ ਦਾ ਸੰਕੇਤ {customer_growth_signal} ਹੈ।"
            ),
            "ur": (
                f"NEXORA میں فی الحال {len(customers)} فعال صارفین ہیں۔ "
                f"گزشتہ 7 دنوں میں {new_customers_7_days} نئے صارفین شامل ہوئے "
                f"اور گزشتہ 30 دنوں میں {new_customers_30_days} نئے صارفین شامل ہوئے۔ "
                f"صارفین کی ترقی کا اشارہ {customer_growth_signal} ہے۔"
            ),
            "or": (
                f"NEXORAରେ ବର୍ତ୍ତମାନ {len(customers)} ସକ୍ରିୟ ଗ୍ରାହକ ଅଛନ୍ତି। "
                f"ଗତ 7 ଦିନରେ {new_customers_7_days} ନୂଆ ଗ୍ରାହକ ଯୋଡ଼ାଯାଇଛନ୍ତି "
                f"ଏବଂ ଗତ 30 ଦିନରେ {new_customers_30_days} ନୂଆ ଗ୍ରାହକ ଯୋଡ଼ାଯାଇଛନ୍ତି। "
                f"ଗ୍ରାହକ ବୃଦ୍ଧି ସଙ୍କେତ ହେଉଛି {customer_growth_signal}।"
            ),
            "as": (
                f"NEXORA-ত বৰ্তমান {len(customers)} জন সক্ৰিয় গ্ৰাহক আছে। "
                f"যোৱা 7 দিনত {new_customers_7_days} জন নতুন গ্ৰাহক যোগ হৈছে "
                f"আৰু যোৱা 30 দিনত {new_customers_30_days} জন নতুন গ্ৰাহক যোগ হৈছে। "
                f"গ্ৰাহক বৃদ্ধিৰ সংকেত হৈছে {customer_growth_signal}।"
            ),
        }

        growth_signal_labels = {
            "en": {
                "positive": "positive",
                "stable": "stable",
                "no_customer_data": "no customer data",
            },
            "hi": {
                "positive": "सकारात्मक",
                "stable": "स्थिर",
                "no_customer_data": "ग्राहक डेटा उपलब्ध नहीं है",
            },
            "mr": {
                "positive": "सकारात्मक",
                "stable": "स्थिर",
                "no_customer_data": "ग्राहक डेटा उपलब्ध नाही",
            },
            "bn": {
                "positive": "ইতিবাচক",
                "stable": "স্থিতিশীল",
                "no_customer_data": "গ্রাহকের ডেটা নেই",
            },
            "gu": {
                "positive": "સકારાત્મક",
                "stable": "સ્થિર",
                "no_customer_data": "ગ્રાહક ડેટા ઉપલબ્ધ નથી",
            },
            "ta": {
                "positive": "நேர்மறை",
                "stable": "நிலையான",
                "no_customer_data": "வாடிக்கையாளர் தரவு இல்லை",
            },
            "te": {
                "positive": "సానుకూలం",
                "stable": "స్థిరంగా ఉంది",
                "no_customer_data": "కస్టమర్ డేటా లేదు",
            },
            "kn": {
                "positive": "ಸಕಾರಾತ್ಮಕ",
                "stable": "ಸ್ಥಿರ",
                "no_customer_data": "ಗ್ರಾಹಕರ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
            },
            "ml": {
                "positive": "പോസിറ്റീവ്",
                "stable": "സ്ഥിരം",
                "no_customer_data": "ഉപഭോക്തൃ ഡാറ്റ ലഭ്യമല്ല",
            },
            "pa": {
                "positive": "ਸਕਾਰਾਤਮਕ",
                "stable": "ਸਥਿਰ",
                "no_customer_data": "ਗਾਹਕ ਡੇਟਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ",
            },
            "ur": {
                "positive": "مثبت",
                "stable": "مستحکم",
                "no_customer_data": "صارفین کا ڈیٹا دستیاب نہیں ہے",
            },
            "or": {
                "positive": "ସକାରାତ୍ମକ",
                "stable": "ସ୍ଥିର",
                "no_customer_data": "ଗ୍ରାହକ ତଥ୍ୟ ଉପଲବ୍ଧ ନାହିଁ",
            },
            "as": {
                "positive": "ইতিবাচক",
                "stable": "স্থিৰ",
                "no_customer_data": "গ্ৰাহকৰ তথ্য উপলব্ধ নাই",
            },
        }

        localized_growth_signal = growth_signal_labels.get(
            language,
            growth_signal_labels["en"],
        ).get(
            customer_growth_signal,
            customer_growth_signal,
        )

        answer = customer_answers.get(
            language,
            customer_answers["en"],
        ).replace(
            customer_growth_signal,
            localized_growth_signal,
        )

        topic = "customers"

    elif any(
        word in q
        for word in [
            "inventory",
            "stock",
            "product",
            "साठा",
            "स्टॉक",
        ]
    ):
        answer = (
            f"NEXORA currently has {len(products)} active product(s) "
            f"with {total_stock_units:.2f} total stock unit(s). "
            f"Inventory value is ₹{inventory_value:.2f}. "
            f"{len(low_stock_nonzero_products)} product(s) are low in stock "
            f"and {len(out_of_stock_products)} product(s) are out of stock. "
            f"Inventory health signal is {inventory_health_signal}."
        )

        topic = "inventory"

    elif any(
        word in q
        for word in [
            "expense",
            "cost",
            "खर्च",
            "व्यय",
        ]
    ):
        answer = (
            f"Recorded expenses are ₹{total_expenses:.2f}. "
            "Review the largest recurring expense categories "
            "before making cost decisions."
        )

        topic = "expenses"

    elif any(
        word in q
        for word in [
            "revenue",
            "sales",
            "sale",
            "बिक्री",
            "कमाई",
        ]
    ):
        answer = (
            f"Recorded revenue is ₹{total_revenue:.2f} from "
            f"{len(sales)} completed sale(s). "
            f"Average order value is ₹{average_order_value:.2f}. "
            f"Gross profit is ₹{gross_profit:.2f}, with a "
            f"gross margin of {gross_margin_percent:.1f}%. "
            f"Revenue in the last 7 days is ₹{revenue_7_days:.2f}. "
            f"The current revenue signal is {revenue_growth_signal}."
        )

        topic = "revenue"
    elif any(
        word in q
        for word in [
            "risk",
            "risks",
            "business risk",
            "danger",
            "threat",
            "जोखिम",
            "खतरा",
            "जोखिमों",
        ]
    ):
        risk_items = []

        if net_profit < 0:
            risk_items.append({
                "type": "profitability_risk",
                "severity": "high",
                "title": "Profitability risk",
                "explanation": (
                    f"Net profit is ₹{abs(net_profit):.2f} below zero."
                ),
                "recommended_action": (
                    "Review operating expenses, pricing, and gross margins."
                ),
                "confidence": 0.99,
            })

        if total_revenue > 0 and total_expenses > total_revenue:
            risk_items.append({
                "type": "expense_risk",
                "severity": "high",
                "title": "Expense risk",
                "explanation": (
                    f"Expenses of ₹{total_expenses:.2f} are higher "
                    f"than revenue of ₹{total_revenue:.2f}."
                ),
                "recommended_action": (
                    "Review the largest recurring expense categories."
                ),
                "confidence": 0.99,
            })

        if len(out_of_stock_products) > 0:
            risk_items.append({
                "type": "inventory_risk",
                "severity": "high",
                "title": "Out-of-stock risk",
                "explanation": (
                    f"{len(out_of_stock_products)} active product(s) "
                    "are currently out of stock."
                ),
                "recommended_action": (
                    "Review replenishment requirements for out-of-stock products."
                ),
                "confidence": 0.98,
            })
        elif len(low_stock_nonzero_products) > 0:
            risk_items.append({
                "type": "inventory_risk",
                "severity": "medium",
                "title": "Low-stock risk",
                "explanation": (
                    f"{len(low_stock_nonzero_products)} active product(s) "
                    "are below their configured stock threshold."
                ),
                "recommended_action": (
                    "Review replenishment requirements for low-stock products."
                ),
                "confidence": 0.98,
            })

        if len(customers) == 0:
            risk_items.append({
                "type": "customer_risk",
                "severity": "medium",
                "title": "Customer base risk",
                "explanation": "No active customers are currently recorded.",
                "recommended_action": (
                    "Add customer records and connect sales to customers."
                ),
                "confidence": 0.99,
            })

        high_risks = sum(
            1 for item in risk_items
            if item["severity"] == "high"
        )

        medium_risks = sum(
            1 for item in risk_items
            if item["severity"] == "medium"
        )

        if high_risks > 0:
            overall_risk_signal = "high"
        elif medium_risks > 0:
            overall_risk_signal = "attention"
        else:
            overall_risk_signal = "low"

        if risk_items:
            risk_summary = "; ".join(
                item["title"]
                for item in risk_items
            )
        else:
            risk_summary = "No material business risks detected."

        answer = (
            f"NEXORA detected {len(risk_items)} business risk(s). "
            f"Overall risk signal is {overall_risk_signal}. "
            f"High-severity risks: {high_risks}. "
            f"Medium-severity risks: {medium_risks}. "
            f"{risk_summary}"
        )

        topic = "business_risk"

    else:
        answer = (
            f"NEXORA currently sees revenue of ₹{total_revenue:.2f}, "
            f"net profit of ₹{net_profit:.2f}, "
            f"{len(products)} active product(s), and "
            f"{len(low_stock)} low-stock product(s)."
        )

        topic = "business_overview"

    if topic == "revenue":
        evidence = {
            "revenue": round(total_revenue, 2),
            "completed_sales": len(sales),
            "average_order_value": round(average_order_value, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin_percent": round(gross_margin_percent, 2),
            "revenue_7_days": round(revenue_7_days, 2),
            "revenue_30_days": round(revenue_30_days, 2),
            "previous_7_days_revenue": round(previous_7_days_revenue, 2),
            "revenue_growth_percent": round(revenue_growth_percent, 2),
            "revenue_growth_signal": revenue_growth_signal,
        }

    elif topic == "inventory":
        evidence = {
            "active_products": len(products),
            "total_stock_units": round(total_stock_units, 2),
            "inventory_value": round(inventory_value, 2),
            "low_stock_products": len(low_stock_nonzero_products),
            "out_of_stock_products": len(out_of_stock_products),
            "inventory_health_signal": inventory_health_signal,
        }

    elif topic == "business_risk":
        evidence = {
            "overall_risk_signal": overall_risk_signal,
            "detected_risks": len(risk_items),
            "high_risks": high_risks,
            "medium_risks": medium_risks,
            "profitability_risk": any(
                item["type"] == "profitability_risk"
                for item in risk_items
            ),
            "expense_risk": any(
                item["type"] == "expense_risk"
                for item in risk_items
            ),
            "inventory_risk": any(
                item["type"] == "inventory_risk"
                for item in risk_items
            ),
            "customer_risk": any(
                item["type"] == "customer_risk"
                for item in risk_items
            ),
            "risk_titles": [
                item["title"]
                for item in risk_items
            ],
            "recommended_actions": [
                item["recommended_action"]
                for item in risk_items
            ],
            "risk_confidence": round(
                min(
                    (
                        item["confidence"]
                        for item in risk_items
                    ),
                    default=0.0,
                ),
                2,
            ),
        }

    elif topic == "customers":
        evidence = {
            "active_customers": len(customers),
            "new_customers_7_days": new_customers_7_days,
            "new_customers_30_days": new_customers_30_days,
            "customer_growth_signal": customer_growth_signal,
        }

    else:
        evidence = {
            "revenue": round(total_revenue, 2),
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "expenses": round(total_expenses, 2),
            "active_products": len(products),
            "low_stock_products": len(low_stock),
            "active_customers": len(customers),
        }

    return {
        "business_id": business_id,
        "copilot": "NEXORA AI Copilot",
        "version": "0.1",
        "status": "operational",
        "language": language,
        "question": question,
        "topic": topic,
        "answer": answer,
        "evidence": evidence,
        "confidence": 0.97,
        "data_source": "NEXORA Intelligence Engine",
    }

