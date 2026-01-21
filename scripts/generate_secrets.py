#!/usr/bin/env python3
"""
Generate production-grade secrets for deployment environments.

Prints values to stdout; do NOT commit the output.
"""

from __future__ import annotations

import secrets


def token(nbytes: int = 48) -> str:
    # URL-safe; ~ (4/3)*nbytes chars
    return secrets.token_urlsafe(nbytes)


def main() -> None:
    print("# Paste these into your secret manager / Render / Vercel env vars")
    print(f"JWT_SECRET_KEY={token(64)}")
    print(f"CSRF_SECRET_KEY={token(64)}")
    print(f"NEXTAUTH_SECRET={token(48)}")
    print("# Optional")
    print(f"ADMIN_BOOTSTRAP_TOKEN={token(32)}")


if __name__ == "__main__":
    main()

