-- ==========================================================
-- Заявки с сайта
--
-- Личные данные (имя, телефон). Держим только то, что нужно для
-- связи, и не размножаем копии: phone_normalized существует ради
-- поиска дублей при повторной отправке формы, а не как второе поле.
--
-- created_at — ISO-8601 в UTC (текст). Совпадает с форматом поля
-- createdAt у Lead в коде и сортируется лексикографически, поэтому
-- отдельный тип под даты заводить не нужно.
-- ==========================================================

CREATE TABLE IF NOT EXISTS leads (
  id               TEXT PRIMARY KEY,
  created_at       TEXT    NOT NULL,

  name             TEXT    NOT NULL,
  phone            TEXT    NOT NULL,
  phone_normalized TEXT    NOT NULL,

  course_id        TEXT,
  course_title     TEXT,
  preferred_time   TEXT,
  comment          TEXT,

  source           TEXT    NOT NULL,
  utm_json         TEXT,
  page_url         TEXT,

  -- new → in_progress → done, плюс rejected для отсева спама
  status           TEXT    NOT NULL DEFAULT 'new',

  CHECK (status IN ('new', 'in_progress', 'done', 'rejected'))
);

-- Разбор списка: почти всегда «последние N заявок»
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- Рабочая очередь: что взяли в обработку
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status, created_at DESC);

-- Повторная отправка формы с того же номера
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone_normalized);
