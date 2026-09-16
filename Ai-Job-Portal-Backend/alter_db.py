import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join("Backend", ".env"))

db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# Get the constraint name
query = """
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'companies'
  AND kcu.column_name = 'recruiter_id';
"""

cur.execute(query)
rows = cur.fetchall()

if rows:
    constraint_name = rows[0][0]
    print(f"Found constraint: {constraint_name}")
    
    # Drop constraint
    drop_query = f"ALTER TABLE companies DROP CONSTRAINT IF EXISTS \"{constraint_name}\";"
    print(f"Running: {drop_query}")
    cur.execute(drop_query)
    
    # Add new constraint with cascade
    add_query = f"""
    ALTER TABLE companies
    ADD CONSTRAINT "{constraint_name}"
    FOREIGN KEY (recruiter_id)
    REFERENCES recruiters(id)
    ON DELETE CASCADE;
    """
    print(f"Running: {add_query}")
    cur.execute(add_query)
    
    print("Successfully added ON DELETE CASCADE.")
else:
    print("Could not find a foreign key constraint on companies.recruiter_id.")
    
cur.close()
conn.close()
