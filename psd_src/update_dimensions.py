#!/usr/bin/env python3
import json
import os
from pathlib import Path
from PIL import Image

def get_image_dimensions(image_path):
    if not os.path.exists(image_path):
        return None
    
    try:
        with Image.open(image_path) as img:
            return img.size
    except Exception as e:
        print(f"Error reading image {image_path}: {e}")
        return None

def update_child_dimensions(child, json_dir):
    if "path" in child:
        image_name = child["path"]
        image_extensions = [".png"]
        
        for ext in image_extensions:
            image_path = os.path.join(json_dir, image_name + ext)
            dimensions = get_image_dimensions(image_path)
            
            if dimensions:
                width, height = dimensions
                child["width"] = width
                child["height"] = height
                print(f"Updated {image_name}{ext}: {width}x{height}")
                break
        else:
            print(f"Warning: No image found for {image_name} in {json_dir}")
    
    if "children" in child and isinstance(child["children"], list):
        for nested_child in child["children"]:
            update_child_dimensions(nested_child, json_dir)

def process_json_file(json_file_path):
    print(f"\nProcessing: {json_file_path}")
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file {json_file_path}: {e}")
        return False
    
    json_dir = os.path.dirname(json_file_path)
    
    if "children" in data and isinstance(data["children"], list):
        for child in data["children"]:
            update_child_dimensions(child, json_dir)
    
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"Saved: {json_file_path}")
        return True
    except Exception as e:
        print(f"Error writing JSON file {json_file_path}: {e}")
        return False

def main():
    scenes_dir = Path("../assets/scenes")
    
    if not scenes_dir.exists():
        print(f"Error: Scenes directory not found at {scenes_dir.absolute()}")
        return
    
    json_files = list(scenes_dir.glob("**/*.json"))
    
    if not json_files:
        print("No JSON files found in scenes directory")
        return
    
    print(f"Found {len(json_files)} JSON files")
    
    processed_count = 0
    for json_file in json_files:
        if process_json_file(str(json_file)):
            processed_count += 1
    
    print(f"\n{'='*50}")
    print(f"Completed! Processed {processed_count}/{len(json_files)} files")

if __name__ == "__main__":
    main()
