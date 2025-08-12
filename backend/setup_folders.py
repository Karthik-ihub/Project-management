import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(BASE_DIR, 'agentic_app')

folders = ['agents', 'utils', 'tools']

for folder in folders:
    folder_path = os.path.join(APP_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)
    init_file = os.path.join(folder_path, '__init__.py')
    with open(init_file, 'w') as f:
        pass  # Create empty __init__.py

# Create outputs folder (no __init__.py needed)
outputs_dir = os.path.join(BASE_DIR, 'outputs')
os.makedirs(outputs_dir, exist_ok=True)

print("Folders created successfully!")