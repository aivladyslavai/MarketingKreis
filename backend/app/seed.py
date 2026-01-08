import bcrypt
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.activity import Activity, ActivityType
from app.models.performance import Performance
from app.models.calendar import CalendarEntry  # ensure model is registered


def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def seed() -> None:
    # Ensure tables exist (especially for fresh SQLite DBs)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"⚠️ Could not create tables before seeding: {e}")

    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@marketingkreis.ch").first()
        if not admin:
            admin = User(
                email="admin@marketingkreis.ch",
                role=UserRole.admin,
                hashed_password=_hash_password("password123"),
                is_verified=True,
            )
            db.add(admin)
            print("✓ Created admin user: admin@marketingkreis.ch / password123")
        else:
            # Ensure existing admin user has correct role and is marked as verified
            admin.role = UserRole.admin
            admin.is_verified = True
            db.add(admin)

        if db.query(Activity).count() == 0:
            activities = [
                Activity(title="Brand Campaign Q1", type=ActivityType.branding, budget=20000, status="Planned"),
                Activity(title="Sales Push March", type=ActivityType.sales, budget=15000, status="Active"),
                Activity(title="Employer Branding Fair", type=ActivityType.employer_branding, budget=8000, status="Planned"),
                Activity(title="Kundenpflege Newsletter", type=ActivityType.kundenpflege, budget=3000, status="Active"),
            ]
            db.add_all(activities)
            print(f"✓ Created {len(activities)} sample activities")

        db.commit()

        # Seed some generic performance metrics if empty
        if db.query(Performance).count() == 0:
            demo_rows = []
            # Simple demo metrics for 8 months
            for i in range(1, 9):
                demo_rows.append(
                    Performance(
                        metric="revenue",
                        value=10000 * i,
                        period=f"2024-{i:02d}",
                    )
                )
                demo_rows.append(
                    Performance(
                        metric="leads",
                        value=50 * i,
                        period=f"2024-{i:02d}",
                    )
                )
            db.add_all(demo_rows)
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()


