import os, psycopg2
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'")
print("Profiles:", cur.fetchall())
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_members'")
print("Company_members:", cur.fetchall())
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'")
print("Companies:", cur.fetchall())
cur.close()
conn.close()
