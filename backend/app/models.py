from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Numeric,
    Boolean,
)
from sqlalchemy.orm import relationship

from .database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)

    business_name = Column(
        String(150),
        nullable=False,
    )

    owner_name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    mobile = Column(
        String(20),
        nullable=False,
    )

    business_type = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    users = relationship(
        "User",
        back_populates="business",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(50),
        default="owner",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    business = relationship(
        "Business",
        back_populates="users",
    )

# =========================================================
# BUSINESS DATA LAYER
# =========================================================


class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(255),
        nullable=True,
    )

    mobile = Column(
        String(20),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    sku = Column(
        String(100),
        nullable=True,
        index=True,
    )

    category = Column(
        String(100),
        nullable=True,
    )

    selling_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    cost_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    stock_quantity = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    low_stock_threshold = Column(
        Numeric(12, 2),
        nullable=False,
        default=5,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )


class Sale(Base):
    __tablename__ = "sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True,
        index=True,
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    sale_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="completed",
    )

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
    )


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    sale_id = Column(
        Integer,
        ForeignKey("sales.id"),
        nullable=False,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    quantity = Column(
        Numeric(12, 2),
        nullable=False,
        default=1,
    )

    unit_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    line_total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    sale = relationship(
        "Sale",
        back_populates="items",
    )


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    movement_type = Column(String(20), nullable=False)

    quantity_change = Column(Numeric(12, 2), nullable=False)

    stock_before = Column(Numeric(12, 2), nullable=False)

    stock_after = Column(Numeric(12, 2), nullable=False)

    reason = Column(String(255), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    category = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        String(255),
        nullable=True,
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    expense_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
