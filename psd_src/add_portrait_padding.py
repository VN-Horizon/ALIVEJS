#!/usr/bin/env python3

import json
import os
from pathlib import Path
from PIL import Image

def add_padding_to_image(image_path, left, top, original_width, original_height):
    if not os.path.exists(image_path):
        print(f"Warning: Image not found: {image_path}")
        return None
    
    try:
        with Image.open(image_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            left_padding = left
            bottom_padding = 480 - (top + original_height)
            
            left_padding = max(0, left_padding)
            bottom_padding = max(0, bottom_padding)
            
            new_width = original_width + left_padding
            new_height = original_height + bottom_padding
            
            new_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
            
            new_img.paste(img, (left_padding, 0))
            
            new_img.save(image_path)
            print(f"Processed {os.path.basename(image_path)}: {original_width}x{original_height} -> {new_width}x{new_height} (padding: L={left_padding}, B={bottom_padding})")
            
            return (new_width, new_height)
    
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def process_json_file(json_file_path, assets_dir):
    print(f"\nProcessing: {json_file_path}")
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file {json_file_path}: {e}")
        return False
    
    if "children" in data and isinstance(data["children"], list):
        for child in data["children"]:
            if "path" in child and "left" in child and "top" in child:
                image_name = child["path"]
                left = child["left"]
                top = child["top"]
                original_width = child.get("width", 0)
                original_height = child.get("height", 0)
                
                image_path = os.path.join(assets_dir, image_name + ".png")
                
                if os.path.exists(image_path):
                    result = add_padding_to_image(image_path, left, top, original_width, original_height)
                    
                    if result:
                        new_width, new_height = result
                        child["width"] = new_width
                        child["height"] = new_height
                        print(f"  Updated JSON: {image_name} -> {new_width}x{new_height}")
                else:
                    print(f"Warning: Image not found: {image_path}")
    
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved: {json_file_path}")
        return True
    except Exception as e:
        print(f"Error writing JSON file {json_file_path}: {e}")
        return False

def main():
    script_dir = Path(__file__).resolve().parent
    portraits_dir = script_dir / "../assets/scenes/Portraits"
    
    if not portraits_dir.exists():
        print(f"Error: Portraits directory not found at {portraits_dir.absolute()}")
        return
    
    json_files = list(portraits_dir.glob("*/*.json"))
    
    if not json_files:
        print("No JSON files found")
        return
    
    processed_count = 0
    for json_file in json_files:
        assets_dir = json_file.parent
        if process_json_file(str(json_file), str(assets_dir)):
            processed_count += 1
    
    print(f"\n{'='*50}")
    print(f"Completed! Processed {processed_count}/{len(json_files)} files")

if __name__ == "__main__":
    main()
