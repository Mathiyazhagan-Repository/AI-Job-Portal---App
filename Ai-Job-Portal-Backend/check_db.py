import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join("Backend", ".env"))

db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

query = """
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'jobs';
"""

cur.execute(query)
for row in cur.fetchall():
    print(row)
cur.close()
conn.close()
