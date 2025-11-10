#!/usr/bin/env python3
"""
Update JSON files with image dimensions for all children and nested children.
Reads WebP images and adds/updates width and height fields in JSON.
"""

import json
import os
from pathlib import Path
from PIL import Image

def get_image_dimensions(image_path):
    """
    Get image dimensions from file.
    Returns (width, height) or None if file doesn't exist or can't be read.
    """
    if not os.path.exists(image_path):
        return None
    
    try:
        with Image.open(image_path) as img:
            return img.size
    except Exception as e:
        print(f"Error reading image {image_path}: {e}")
        return None

def update_child_dimensions(child, json_dir):
    """
    Recursively update width and height for a child and all nested children.
    
    Args:
        child: Dictionary representing a child element
        json_dir: Directory where the JSON file is located
    """
    # Try to find the corresponding image file
    if "path" in child:
        # Try multiple image formats
        image_name = child["path"]
        image_extensions = [".webp", ".webm", ".png", ".jpg", ".jpeg", ".gif"]
        
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
    
    # Recursively process nested children
    if "children" in child and isinstance(child["children"], list):
        for nested_child in child["children"]:
            update_child_dimensions(nested_child, json_dir)

def process_json_file(json_file_path):
    """
    Process a single JSON file and update dimensions for all children.
    
    Args:
        json_file_path: Path to the JSON file
    """
    print(f"\nProcessing: {json_file_path}")
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file {json_file_path}: {e}")
        return False
    
    json_dir = os.path.dirname(json_file_path)
    
    # Process all top-level children
    if "children" in data and isinstance(data["children"], list):
        for child in data["children"]:
            update_child_dimensions(child, json_dir)
    
    # Write updated JSON back to file
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"Saved: {json_file_path}")
        return True
    except Exception as e:
        print(f"Error writing JSON file {json_file_path}: {e}")
        return False

def main():
    """
    Main function to process all JSON files in the scenes directory.
    """
    scenes_dir = Path("./scenes")
    
    if not scenes_dir.exists():
        print(f"Error: Scenes directory not found at {scenes_dir.absolute()}")
        return
    
    # Find all JSON files recursively
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
