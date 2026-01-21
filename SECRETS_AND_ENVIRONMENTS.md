# Secrets и окружения (prod / staging)

## Принципы

- **Никаких секретов в репозитории**: не коммитим `.env*`, `env.local`, ключи, токены, приватные ключи.
- **Prod и Staging — разные секреты и разные базы**.
- **Staging = production-like**: те же ограничения безопасности (CSRF/TrustedHost/DEBUG=false), но отдельные ресурсы.

## Окружения

### Production
- `ENVIRONMENT=production`
- Секреты и URL задаются **в Render/Vercel Environment Variables** (не файлами).
- `SKIP_EMAIL_VERIFY` **должен быть false**.

### Staging
- `ENVIRONMENT=staging`
- Используем отдельный сервис/проект и отдельную БД.
- Те же требования к секретам, что и для production.

### Development (локально)
- `ENVIRONMENT=development`
- Можно использовать `docker-compose.yml` + `env.development`.

## Ротация секретов (политика)

Рекомендация: **каждые 90 дней** и **сразу** при подозрении на компрометацию.

- **JWT_SECRET_KEY**
  - Что ломает: все текущие access/refresh токены (потребуется перелогин).
- **CSRF_SECRET_KEY**
  - Что ломает: активные сессии/формы могут потребовать обновления страницы.
- **NEXTAUTH_SECRET** (если используется NextAuth)
  - Что ломает: NextAuth сессии/подписи.
- **SMTP / OPENAI ключи**
  - Ротация по политике провайдера + при утечке.

### Генерация новых секретов

Запусти локально:

`python3 scripts/generate_secrets.py`

и внеси значения в:
- Render → Backend service → Environment
- Vercel → Project → Settings → Environment Variables (Prod / Preview / Development)

## Защита от утечек (репозиторий / артефакты)

В проекте включены:
- `.gitignore` блокирует `.env*` и `env.local`.
- `.dockerignore` (root/backend/frontend) исключает `.env*`, `env.local` и похожие файлы из Docker build context.
- CI job **`secrets-hygiene`** запускает `scripts/check_secrets_hygiene.py`.
- Husky pre-commit запускает тот же чек локально.

## Checklist перед деплоем

- [ ] `ENVIRONMENT` выставлен корректно (production/staging)
- [ ] `DEBUG=false`
- [ ] `SKIP_EMAIL_VERIFY=false`
- [ ] `JWT_SECRET_KEY` и `CSRF_SECRET_KEY` выставлены и сильные
- [ ] Нет `.env*` в git / docker артефактах

