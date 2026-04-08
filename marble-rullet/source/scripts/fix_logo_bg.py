from PIL import Image
import os
from collections import Counter

def get_dominant_bg_color(img):
    # Sample pixels around the center but not in the very middle (where the ball is)
    # And where alpha is high
    pixels = img.getdata()
    bg_candidates = []
    width, height = img.size
    
    # Sample a few points that are likely background
    # Top-left of the rounded square (roughly 1/4 in)
    samples = [
        (width // 4, height // 4),
        (3 * width // 4, height // 4),
        (width // 4, 3 * height // 4),
        (3 * width // 4, 3 * height // 4),
        (width // 2, height // 4),
    ]
    
    for x, y in samples:
        r, g, b, a = img.getpixel((x, y))
        if a > 200:
            bg_candidates.append((r, g, b))
    
    if not bg_candidates:
        return (17, 24, 39) # Default dark color #111827
        
    return Counter(bg_candidates).most_common(1)[0][0]

def fix_logo_properly(file_path):
    if not os.path.exists(file_path):
        return
        
    img = Image.open(file_path).convert("RGBA")
    width, height = img.size
    
    bg_color = get_dominant_bg_color(img)
    print(f"Detected background color: {bg_color}")
    
    # Create a full square background with the detected color
    new_img = Image.new("RGB", (width, height), bg_color)
    
    # Paste the original logo on top (no resizing/margins this time to avoid "worse" look)
    # The original logo likely already has some padding within its rounded square
    new_img.paste(img, (0, 0), mask=img.split()[3])
    
    new_img.save(file_path, "PNG")
    print(f"Fixed {file_path} as a full square with matching background.")

if __name__ == "__main__":
    fix_logo_properly("assets/app_logo.png")
