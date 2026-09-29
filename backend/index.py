import sys
import os

# إضافة مجلد backend لمسارات Python
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from server import app

# Vercel يتعرف تلقائياً على المتغير app