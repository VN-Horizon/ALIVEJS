#!/usr/bin/env python3
import sys
import time
from pathlib import Path
from wand.image import Image

# Configuration
WEBP_QUALITY = 95
WEBP_METHOD = 6
BACKUP_ON_ERROR = True


def get_file_size(path):
    """Get file size in bytes."""
    try:
        return path.stat().st_size
    except (OSError, FileNotFoundError):
        return 0


def format_size(bytes_size):
    """Format bytes to human-readable size."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.2f}{unit}"
        bytes_size /= 1024
    return f"{bytes_size:.2f}TB"


def convert_png_to_webp(png_path):
    result = {
        'success': False,
        'error': None,
        'original_size': 0,
        'new_size': 0,
        'savings': 0
    }
    
    try:
        png_path = Path(png_path)
        result['original_size'] = get_file_size(png_path)
        webp_path = png_path.with_suffix('.webp')
        
        with Image(filename=str(png_path)) as img:
            img.format = 'webp'
            img.options['webp:method'] = str(WEBP_METHOD)
            img.compression_quality = WEBP_QUALITY
            img.save(filename=str(webp_path))
        
        result['new_size'] = get_file_size(webp_path)
        result['savings'] = result['original_size'] - result['new_size']
        
        png_path.unlink()
        
        result['success'] = True
        
    except Exception as e:
        result['error'] = str(e)
        if BACKUP_ON_ERROR:
            webp_path = png_path.with_suffix('.webp')
            if webp_path.exists():
                try:
                    webp_path.unlink()
                except OSError:
                    pass
    
    return result


def main():
    script_dir = Path(__file__).resolve().parent
    scenes_dir = script_dir / "../assets/scenes"
    if not scenes_dir.exists():
        print(f"Error: Scenes directory not found at {scenes_dir}")
        sys.exit(1)
    png_files = sorted(scenes_dir.rglob("*.png"))
    
    if not png_files:
        print(f"No PNG files found in {scenes_dir}")
        sys.exit(0)
    
    print(f"Found {len(png_files)} PNG files to convert")
    print(f"Quality: {WEBP_QUALITY}, Method: {WEBP_METHOD}")
    print()
    start_time = time.time()
    successful = 0
    failed = 0
    total_original_size = 0
    total_new_size = 0
    errors = []
    
    for idx, png_file in enumerate(png_files, 1):
        print(f"[{idx}/{len(png_files)}] Converting {png_file.name}...", end=" ", flush=True)
        
        result = convert_png_to_webp(png_file)
        total_original_size += result['original_size']
        total_new_size += result['new_size']
        
        if result['success']:
            savings_pct = (result['savings'] / result['original_size'] * 100) if result['original_size'] > 0 else 0
            print(f"✓ ({format_size(result['original_size'])} → {format_size(result['new_size'])} | -{savings_pct:.1f}%)")
            successful += 1
        else:
            print(f"✗ Error: {result['error']}")
            failed += 1
            errors.append((png_file.name, result['error']))
    
    elapsed_time = time.time() - start_time
    total_savings = total_original_size - total_new_size
    total_savings_pct = (total_savings / total_original_size * 100) if total_original_size > 0 else 0
    
    print()
    print("=" * 60)
    print(f"Conversion Complete!")
    print("=" * 60)
    print(f"  Successful: {successful}/{len(png_files)}")
    print(f"  Failed: {failed}/{len(png_files)}")
    print(f"  Total Size: {format_size(total_original_size)} → {format_size(total_new_size)}")
    print(f"  Space Saved: {format_size(total_savings)} ({total_savings_pct:.1f}%)")
    print(f"  Time Elapsed: {elapsed_time:.2f}s")
    print("=" * 60)
    
    if errors:
        print()
        print("Errors:")
        for filename, error in errors:
            print(f"  - {filename}: {error}")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
