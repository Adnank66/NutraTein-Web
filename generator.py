# Python generator for remaining files
import os

def save(p, content):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Saved: {p}')

print('Generator initialized')
