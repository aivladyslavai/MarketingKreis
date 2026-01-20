from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db_session
from app.demo import DEMO_SEED_SOURCE
from app.models.company import Company
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.calendar import CalendarEntry
from app.models.user import User
from app.api.deps import get_current_user, get_org_id, is_demo_user

router = APIRouter(prefix="/performance", tags=["performance"])


def _to_float(value: Any) -> float:
  try:
    return float(value or 0)
  except Exception:
    return 0.0


def _stage(deal: Deal) -> str:
  return (getattr(deal, "stage", "") or "").lower()


@router.get("")
def get_performance(
    year: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
  """
  Aggregated performance metrics used by the frontend dashboard.

  - Reads live data from deals, activities and calendar_entries
  - Aggregates revenue, forecast, pipeline by stage and activity/event volumes
  """
  now = datetime.utcnow()
  year = year or now.year
  org = get_org_id(current_user)

  if is_demo_user(current_user):
    # Demo mode should only reflect demo-tagged CRM data + demo-owned user domain objects.
    deals = (
      db.query(Deal)
      .join(Company, Company.id == Deal.company_id)
      .filter(Company.lead_source == DEMO_SEED_SOURCE, Deal.organization_id == org)
      .all()
    )
    activities = (
      db.query(Activity)
      .filter(Activity.owner_id == current_user.id, Activity.organization_id == org)
      .all()
    )
    events = (
      db.query(CalendarEntry)
      .filter(CalendarEntry.owner_id == current_user.id, CalendarEntry.organization_id == org)
      .all()
    )
  else:
    deals = db.query(Deal).filter(Deal.organization_id == org).all()
    activities = db.query(Activity).filter(Activity.organization_id == org).all()
    events = db.query(CalendarEntry).filter(CalendarEntry.organization_id == org).all()

  # --- KPI totals (same logic as in frontend) ---
  total_revenue = sum(_to_float(d.value) for d in deals if _stage(d) == "won")
  total_forecast = sum(_to_float(d.value) * (_to_float(d.probability) / 100.0) for d in deals)

  open_deals = sum(1 for d in deals if _stage(d) not in ("won", "lost"))
  total_deals = len(deals)
  won_deals = sum(1 for d in deals if _stage(d) == "won")
  conversion_rate = (won_deals / total_deals * 100.0) if total_deals > 0 else 0.0

  # --- Monthly revenue & forecast for current year ---
  month_labels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

  def in_month(d: Deal, m: int) -> bool:
    dt = getattr(d, "expected_close_date", None)
    if not isinstance(dt, datetime):
      return False
    return dt.year == year and dt.month == (m + 1)

  revenue_series: List[Dict[str, Any]] = []
  for idx, label in enumerate(month_labels):
    won_amount = sum(
      _to_float(d.value)
      for d in deals
      if in_month(d, idx) and _stage(d) == "won"
    )
    weighted_forecast = sum(
      _to_float(d.value) * (_to_float(d.probability) / 100.0)
      for d in deals
      if in_month(d, idx)
    )
    revenue_series.append(
      {"month": label, "revenue": won_amount, "forecast": weighted_forecast}
    )

  # --- Pipeline by stage ---
  def stage_count(name: str) -> int:
    key = name.lower()
    return sum(1 for d in deals if _stage(d) == key)

  pipeline_by_stage = [
    {"name": "Lead", "value": stage_count("lead")},
    {"name": "Qualified", "value": stage_count("qualified")},
    {"name": "Proposal", "value": stage_count("proposal")},
    {"name": "Negotiation", "value": stage_count("negotiation")},
    {"name": "Won", "value": stage_count("won")},
  ]

  # --- Leads vs Deals per month (YTD) ---
  leads_deals_series: List[Dict[str, Any]] = []
  for idx, label in enumerate(month_labels):
    def _in_month_local(d: Deal) -> bool:
      return in_month(d, idx)

    deals_in_month = [d for d in deals if _in_month_local(d)]
    leads_in_month = [d for d in deals_in_month if _stage(d) == "lead"]
    won_in_month = [d for d in deals_in_month if _stage(d) == "won"]
    leads_deals_series.append(
      {
        "month": label,
        "deals": len(deals_in_month),
        "leads": len(leads_in_month),
        "won": len(won_in_month),
      }
    )

  # --- Weekly activities & events (last 12 weeks) ---
  weeks_back = 12
  today = now.date()
  # Начальная дата – начало недели (понедельник) 12 недель назад
  start_base = today - timedelta(weeks=weeks_back - 1)

  def iso_week(d: date) -> int:
    return d.isocalendar()[1]

  def week_key(d: date) -> tuple[int, int]:
    iso = d.isocalendar()
    return (iso.year, iso.week)

  # Pre-compute weeks for activities
  activity_weeks: List[tuple[int, int]] = []
  for a in activities:
    if a.start_date:
      d = a.start_date
    elif a.created_at:
      d = a.created_at.date()
    else:
      continue
    activity_weeks.append(week_key(d))

  week_series: List[Dict[str, Any]] = []
  for i in range(weeks_back):
    week_start = start_base + timedelta(weeks=i)
    y_w = week_key(week_start)
    label = f"KW{str(iso_week(week_start)).zfill(2)}"

    events_count = 0
    for e in events:
      dt = getattr(e, "start_time", None)
      if isinstance(dt, datetime):
        if week_key(dt.date()) == y_w:
          events_count += 1

    activities_count = sum(1 for wk in activity_weeks if wk == y_w)

    week_series.append({"week": label, "events": events_count, "activities": activities_count})

  return {
    "year": year,
    "totalRevenue": total_revenue,
    "totalForecast": total_forecast,
    "openDeals": open_deals,
    "conversionRate": conversion_rate,
    "revenueSeries": revenue_series,
    "pipelineByStage": pipeline_by_stage,
    "leadsDealsSeries": leads_deals_series,
    "weeksSeries": week_series,
  }

