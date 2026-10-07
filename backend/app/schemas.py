from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    owner_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    mobile: str = Field(min_length=10, max_length=20)
    business_type: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    message: str
    business_id: int
    user_id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    user_id: int
    business_id: int
    role: str


# =========================================================
# BUSINESS DATA SCHEMAS
# =========================================================

class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, min_length=7, max_length=20)


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str | None
    mobile: str | None
    is_active: bool

    class Config:
        from_attributes = True


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, min_length=7, max_length=20)


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    sku: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    selling_price: float = Field(default=0, ge=0)
    cost_price: float = Field(default=0, ge=0)
    stock_quantity: float = Field(default=0, ge=0)
    low_stock_threshold: float = Field(default=5, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    sku: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    selling_price: float | None = Field(default=None, ge=0)
    cost_price: float | None = Field(default=None, ge=0)
    stock_quantity: float | None = Field(default=None, ge=0)
    low_stock_threshold: float | None = Field(default=None, ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str | None
    category: str | None
    selling_price: float
    cost_price: float
    stock_quantity: float
    low_stock_threshold: float
    is_active: bool

    class Config:
        from_attributes = True



class StockMovementCreate(BaseModel):
    movement_type: str = Field(pattern="^(IN|OUT|ADJUSTMENT)$")
    quantity: float = Field(ge=0)
    reason: str | None = Field(default=None, max_length=255)


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity_change: float
    stock_before: float
    stock_after: float
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    amount: float = Field(gt=0)


class ExpenseResponse(BaseModel):
    id: int
    category: str
    description: str | None
    amount: float

    class Config:
        from_attributes = True


# =========================================================
# SALES SCHEMAS
# =========================================================

class SaleItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: float = Field(gt=0)


class SaleCreate(BaseModel):
    customer_id: int | None = Field(default=None, gt=0)
    items: list[SaleItemCreate] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float
    line_total: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    customer_id: int | None
    total_amount: float
    status: str
    items: list[SaleItemResponse] = []

    class Config:
        from_attributes = True
