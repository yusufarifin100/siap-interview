import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
