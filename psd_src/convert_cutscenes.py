import os
import subprocess
import tempfile
from pathlib import Path
from psd_tools import PSDImage

def convert_psd_to_webm(psd_path, output_path):
    print(f"Processing: {psd_path.name}")
    psd = PSDImage.open(psd_path)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        
        # Extract layers as frames
        # Layers are typically ordered from bottom to top in Photoshop, 
        # but we'll read them in the order psd-tools provides (top to bottom).
        # You can reverse `psd` if the animation should be bottom-up.
        frames = list(psd)
        # frames.reverse() # Usually animations in PSD are built bottom-layer = first frame
        
        for i, layer in enumerate(frames):
            # Temporarily turn on visibility for the target layer 
            # and off for all others
            for l in frames:
                l.visible = False
            layer.visible = True
            
            frame_image = psd.composite(viewport=(0, 0, psd.width, psd.height))
            
            # Apply layer opacity manually
            if hasattr(layer, 'opacity') and layer.opacity < 255:
                if frame_image.mode != 'RGBA':
                    frame_image = frame_image.convert('RGBA')
                r, g, b, a = frame_image.split()
                a = a.point(lambda p: p * layer.opacity // 255)
                frame_image.putalpha(a)
                
            frame_path = temp_dir_path / f"frame_{i:04d}.png"
            frame_image.save(frame_path)
            
        print(f"Extracted {len(frames)} frames. Encoding to WebM...")
        
        # ffmpeg command for VP9 WebM with alpha channel
        # -crf 20 specifies high quality (lower is better, 0-63)
        # -deadline best and -cpu-used 0 ensure maximum compression
        # -pix_fmt yuva420p ensures alpha channel is kept
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",  # overwrite output
            "-framerate", "30",
            "-i", str(temp_dir_path / "frame_%04d.png"),
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-crf", "20",       # quality (80% roughly translates to ~20 CRF)
            "-b:v", "0",        # needed for CRF to work primarily
            "-deadline", "best", # max compression
            "-cpu-used", "0",    # max compression
            "-auto-alt-ref", "0", # sometimes needed for alpha with vp9
            str(output_path)
        ]
        
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        print(f"Saved: {output_path}")

def main():
    base_dir = Path(__file__).parent
    workspace_root = base_dir.parent
    
    input_dir = base_dir / "Cutscenes"
    output_dir = workspace_root / "assets" / "scenes" / "Cutscenes"
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not input_dir.exists():
        print(f"Input directory does not exist: {input_dir}")
        return
        
    for psd_file in input_dir.glob("*.PSD"):
        output_file = output_dir / (psd_file.stem + ".webm")
        try:
            convert_psd_to_webm(psd_file, output_file)
        except Exception as e:
            print(f"Error processing {psd_file.name}: {e}")

if __name__ == "__main__":
    main()
