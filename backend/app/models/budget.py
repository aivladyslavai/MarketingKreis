from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class BudgetTarget(Base):
    __tablename__ = "budget_targets"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(20), nullable=False, index=True)  # e.g. 2025-Q2
    category = Column(String(50), nullable=False, index=True)  # VERKAUFSFOERDERUNG, IMAGE, EMPLOYER_BRANDING, KUNDENPFLEGE
    amount_chf = Column(Numeric(14, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class KpiTarget(Base):
    __tablename__ = "kpi_targets"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(20), nullable=False, index=True)  # e.g. 2025-Q2
    metric = Column(String(100), nullable=False, index=True)  # e.g. Umsatz, Conversion Rate
    target_value = Column(Numeric(14, 2), nullable=False, default=0)
    unit = Column(String(20), nullable=True)  # CHF, %, Deals
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


