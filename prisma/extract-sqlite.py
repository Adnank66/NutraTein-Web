import sqlite3
import json
from datetime import datetime

conn = sqlite3.connect(r'prisma\dev.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

tables = [
    'User',
    'Category',
    'Product',
    'ProductImage',
    'ProductVariant',
    'Address',
    'Order',
    'OrderItem',
    'Review',
    'Coupon',
    'Payment',
    'Account',
    'Session',
    'Cart',
    'CartItem',
    'Wishlist',
    'WishlistItem',
    'VerificationToken'
]

dump = {}
total_records = 0

for table in tables:
    try:
        cursor.execute(f'SELECT * FROM "{table}"')
        rows = [dict(r) for r in cursor.fetchall()]
        dump[table] = rows
        count = len(rows)
        total_records += count
        print(f"Extracted {count:>3} records from {table}")
    except Exception as e:
        print(f"Error extracting {table}: {e}")
        dump[table] = []

with open(r'prisma\sqlite_dump.json', 'w', encoding='utf-8') as f:
    json.dump(dump, f, indent=2, default=str)

print(f"\nDump complete: {total_records} total records written to prisma\\sqlite_dump.json")
conn.close()
