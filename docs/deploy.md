# ==========================================================
# Деплой
#
# Фронтенд и бэкенд — одно Next.js-приложение, отдельного бэкенда
# нет. API-роуты (app/api/chat, app/api/lead) деплоятся вместе с ним.
# ==========================================================

## 1. База данных (Turso)

Схема: `migrations/0001_leads.sql`. Применяется один раз:

```bash
npx turso db execute migrations/0001_leads.sql \
  --url "libsql://<db>.<region>.turso.io" \
  --token "<TURSO_AUTH_TOKEN>"
```

Создать новую базу, если нужно:

```bash
npx turso db create airagdb
npx turso db show airagdb        # посмотреть URL
npx turso db tokens create airagdb --type client
```

Токен типа `client` годится для приложения. `group`/`writer` — для
миграций и ручных правок. Оба хранятся в Vercel, токен в репозиторий
не попадает: `.env*` в `.gitignore`.

## 2. Переменные окружения

Локально — в `.env.local`, в продакшене — Vercel → Settings →
Environment Variables. Полный список с комментариями в `.env.example`.

| Переменная | Где | Обязательна |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Vercel | да, если включён Turso |
| `TURSO_AUTH_TOKEN` | Vercel | да, секрет |
| `LEAD_SINKS` | Vercel | да, например `turso,telegram` |
| `NEXT_PUBLIC_SITE_URL` | Vercel | да, для канонических URL и sitemap |
| `CHAT_PROVIDER` | Vercel | для работы AI-ассистента |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Vercel | если включён telegram |
| `SMTP_*`, `LEAD_EMAIL_*` | Vercel | если включён email |
| `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` | Vercel | если включён sheets |

`LEAD_SINKS` принимает список через запятую: `turso`, `telegram`,
`email`, `sheets`, `console`. Приёмники независимы, заявка уходит всем
выбранным. Если ни один не настроился, остаётся `console` — на
serverless это значит, что заявка просто потеряется, поэтому в
продакшене `console` без других приёмников быть не должно.

## 3. Регион

`vercel.json` жёстко задаёт `nrt1` (Токио) — регион базы Turso
`aws-ap-northeast-1`. Функция и база оказываются в одной зоне, задержка
измеряется десятками миллисекунд вместо сотен. Если база переедет,
менять надо и `vercel.json`.

## 4. Vercel

Подключение репозитория: **Import Project** → выбрать репозиторий →
Root Directory оставить корневым → Framework Preset определится как
Next.js. Переменные окружения задаются до первого деплоя, иначе
сборка пройдёт, а заявки не запишутся.

## Известные ограничения

- **Rate limit живёт в памяти процесса.** На Vercel каждый вызов
  функции — отдельный инстанс, поэтому счётчики из `lib/lead/rateLimit.ts`
  фактически не накапливаются и защита от спама в продакшене не работает.
  Счётчики нужно унести в Upstash Redis (`RATE_LIMIT_REDIS_URL`,
  `RATE_LIMIT_REDIS_TOKEN` в `.env.example`) — поддержка в коде уже есть.
- **`content/*.json` попадают в бандл на этапе сборки.** Редактирование
  контента требует нового деплоя, CMS или чтения из БД.
- **Заявка доставляется всем приёмникам параллельно.** Успех считается,
  если отработал хотя бы один; остальные могут упасть, и это попадёт
  в лог, но не повлияет на ответ пользователю.
