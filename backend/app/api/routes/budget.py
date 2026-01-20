from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from math import isfinite

from app.db.session import get_db_session
from app.models.budget import BudgetTarget, KpiTarget
from app.models.user import User, UserRole
from app.api.deps import get_current_user, get_org_id, require_role


router = APIRouter(prefix="/budget", tags=["budget"])


@router.get("/targets/{period}")
def get_targets(
    period: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    try:
        org = get_org_id(current_user)
        bt = db.query(BudgetTarget).filter(BudgetTarget.period == period, BudgetTarget.organization_id == org).all()
        kt = db.query(KpiTarget).filter(KpiTarget.period == period, KpiTarget.organization_id == org).all()
        return {
            "budgetTargets": [
                {"id": b.id, "period": b.period, "category": b.category, "amount": float(b.amount_chf)} for b in bt
            ],
            "kpiTargets": [
                {"id": k.id, "period": k.period, "metric": k.metric, "target": float(k.target_value), "unit": k.unit} for k in kt
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/targets/{period}")
def upsert_targets(
    period: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.editor)),
) -> Dict[str, Any]:
    try:
        org = get_org_id(current_user)
        # Upsert budget targets
        for bt in payload.get("budgetTargets", []):
            category = str(bt.get("category") or "").upper()
            amount = float(bt.get("amount") or 0)
            existing = (
                db.query(BudgetTarget)
                .filter(BudgetTarget.period == period, BudgetTarget.category == category, BudgetTarget.organization_id == org)
                .first()
            )
            if existing:
                existing.amount_chf = amount
            else:
                db.add(BudgetTarget(period=period, category=category, amount_chf=amount, organization_id=org))
        # Upsert KPI targets
        for kt in payload.get("kpiTargets", []):
            metric = str(kt.get("metric") or "")
            target = float(kt.get("target") or 0)
            unit = kt.get("unit") or None
            existing_k = (
                db.query(KpiTarget)
                .filter(KpiTarget.period == period, KpiTarget.metric == metric, KpiTarget.organization_id == org)
                .first()
            )
            if existing_k:
                existing_k.target_value = target
                existing_k.unit = unit
            else:
                db.add(KpiTarget(period=period, metric=metric, target_value=target, unit=unit, organization_id=org))

        db.commit()

        return get_targets(period, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scenario")
def simulate_scenario(
    payload: Dict[str, Any],
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Simple what-if modeling:
    - changePercent: % change to total budget (e.g., +20 means increase by 20%)
    - elasticities: mapping of metric->elasticity (default revenue=0.8, conversion=0.3, deals=0.5)
    - categoryMultipliers: optional per-category multiplier to reweight distribution beyond uniform scaling
    """
    try:
        org = get_org_id(current_user)
        period: Optional[str] = payload.get("period")
        change_percent: float = float(payload.get("changePercent") or 0.0)
        elasticities: Dict[str, float] = payload.get("elasticities") or {}
        category_multipliers: Dict[str, float] = payload.get("categoryMultipliers") or {}
        e_rev = float(elasticities.get("revenue", 0.8))
        e_conv = float(elasticities.get("conversion", 0.3))
        e_deals = float(elasticities.get("deals", 0.5))

        # Load current targets for the period if provided; otherwise aggregate latest available
        if period:
            bt = db.query(BudgetTarget).filter(BudgetTarget.period == period, BudgetTarget.organization_id == org).all()
            kt = db.query(KpiTarget).filter(KpiTarget.period == period, KpiTarget.organization_id == org).all()
        else:
            bt = db.query(BudgetTarget).filter(BudgetTarget.organization_id == org).all()
            kt = db.query(KpiTarget).filter(KpiTarget.organization_id == org).all()

        # Base budget totals
        base_categories: List[Dict[str, Any]] = [
            {"category": b.category, "amount": float(b.amount_chf)} for b in bt
        ]
        base_budget_total = sum(x["amount"] for x in base_categories)

        # Base KPIs (best-effort detection)
        def find_kpi(name: str) -> Optional[KpiTarget]:
            for k in kt:
                if str(k.metric).lower() in (name, name.lower()):
                    return k
                if name.lower() in str(k.metric).lower():
                    return k
            return None

        kpi_revenue = find_kpi("umsatz") or find_kpi("revenue")
        kpi_conversion = find_kpi("conversion")
        kpi_deals = find_kpi("deals")

        base_revenue = float(kpi_revenue.target_value) if kpi_revenue else (base_budget_total * 1.3 if base_budget_total else 100000.0)
        base_conversion = float(kpi_conversion.target_value) if kpi_conversion else 20.0
        base_deals = float(kpi_deals.target_value) if kpi_deals else 20.0

        # Scenario scaling
        scale = 1.0 + (change_percent / 100.0)
        scenario_budget_total = base_budget_total * scale if base_budget_total else 0.0

        # Per-category reweighting: first scale uniformly, then apply optional multipliers and renormalize
        scenario_categories = []
        if base_categories:
            tmp = []
            for c in base_categories:
                cat = c["category"]
                amt = c["amount"] * scale
                mult = float(category_multipliers.get(cat, 1.0))
                tmp.append({"category": cat, "amount": amt * mult})
            total_tmp = sum(x["amount"] for x in tmp) or 1.0
            # Normalize back to scenario total
            scenario_categories = [
                {"category": x["category"], "amount": (x["amount"] / total_tmp) * (scenario_budget_total or total_tmp)}
                for x in tmp
            ]

        # Elastic responses (bounded)
        def clamp(v: float, lo: float, hi: float) -> float:
            if not isfinite(v):
                return lo
            return max(lo, min(hi, v))

        scenario_revenue = base_revenue * (1.0 + e_rev * (change_percent / 100.0))
        scenario_conversion = clamp(base_conversion * (1.0 + e_conv * (change_percent / 100.0)), 1.0, 95.0)
        scenario_deals = max(0.0, base_deals * (1.0 + e_deals * (change_percent / 100.0)))

        # Monthly breakdown using a generic distribution
        months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        weights = [0.08, 0.08, 0.09, 0.08, 0.09, 0.10, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08]
        wsum = sum(weights) or 1.0
        monthly = [{"month": m, "planned": (base_revenue * (w / wsum)), "forecast": (scenario_revenue * (w / wsum))} for m, w in zip(months, weights)]

        return {
            "input": {
                "period": period,
                "changePercent": change_percent,
                "elasticities": {"revenue": e_rev, "conversion": e_conv, "deals": e_deals},
                "categoryMultipliers": category_multipliers,
            },
            "base": {
                "budgetTotal": base_budget_total,
                "revenue": base_revenue,
                "conversion": base_conversion,
                "deals": base_deals,
                "categories": base_categories,
            },
            "scenario": {
                "budgetTotal": scenario_budget_total,
                "revenue": scenario_revenue,
                "conversion": scenario_conversion,
                "deals": scenario_deals,
                "categories": scenario_categories,
                "monthly": monthly,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



