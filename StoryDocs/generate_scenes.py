#!/usr/bin/env python3
"""Generate debranded instructional scene thumbnails (640x360) for StoryDocs."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "assets" / "scenes"
YELLOW = (253, 203, 1)
DARK = (45, 45, 48)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)
BLUE = (40, 140, 255)
GRAY = (235, 235, 237)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius, fill=None, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_header_bar(draw: ImageDraw.ImageDraw, y=0, h=72, right_icons=True, left_mark="docs"):
    rounded_rect(draw, (24, y + 8, 616, y + h), 18, fill=DARK)
    # generic mark
    cx, cy = 64, y + h // 2 + 4
    draw.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), fill=WHITE)
    if left_mark == "docs":
        draw.rectangle((cx - 10, cy - 8, cx + 10, cy + 10), outline=BLACK, width=2)
        draw.line((cx - 6, cy - 2, cx + 6, cy - 2), fill=BLACK, width=2)
        draw.line((cx - 6, cy + 3, cx + 4, cy + 3), fill=BLACK, width=2)
    elif left_mark == "product":
        # clapperboard mini
        draw.rectangle((cx - 12, cy - 10, cx + 12, cy + 10), fill=BLACK)
        draw.rectangle((cx - 12, cy - 10, cx + 12, cy - 2), fill=YELLOW)
    if right_icons:
        for i, kind in enumerate(("bell", "dash", "user")):
            x = 520 + i * 36
            draw.ellipse((x - 14, cy - 14, x + 14, cy + 14), fill=(55, 55, 58))
            if kind == "bell":
                draw.polygon([(x, cy - 6), (x - 7, cy + 4), (x + 7, cy + 4)], outline=WHITE)
            elif kind == "dash":
                for r in range(2):
                    for c in range(2):
                        draw.rectangle(
                            (x - 6 + c * 7, cy - 6 + r * 7, x - 2 + c * 7, cy - 2 + r * 7),
                            outline=WHITE,
                            width=1,
                        )
            else:
                draw.ellipse((x - 4, cy - 7, x + 4, cy - 1), outline=WHITE, width=1)
                draw.arc((x - 8, cy - 1, x + 8, cy + 10), 200, 340, fill=WHITE, width=1)


def caption(draw, line1, line2, y=250):
    draw.text((36, y), line1, font=font(28), fill=WHITE)
    # soft shadow via offset
    draw.text((37, y + 1), line1, font=font(28), fill=BLACK)
    draw.text((36, y), line1, font=font(28), fill=WHITE)
    draw.text((36, y + 36), line2, font=font(32), fill=BLACK)


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    img.save(path, "WEBP", quality=90)
    print("wrote", path.name)


def scene_01():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    # generic wordmark
    d.text((36, 28), "DOCS", font=font(48), fill=WHITE)
    d.text((38, 30), "DOCS", font=font(48), fill=BLACK)
    d.text((36, 28), "DOCS", font=font(48), fill=WHITE)
    # document icon instead of bomb
    d.rounded_rectangle((540, 28, 600, 98), 8, fill=WHITE, outline=BLACK, width=3)
    d.line((552, 48, 588, 48), fill=BLACK, width=2)
    d.line((552, 60, 580, 60), fill=BLACK, width=2)
    d.line((552, 72, 588, 72), fill=BLACK, width=2)
    caption(d, "Getting Started", "How to Storyboarding", y=240)
    save(img, "scene-01.webp")


def scene_02():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    draw_header_bar(d, left_mark="product", right_icons=False)
    # title chip
    rounded_rect(d, (110, 22, 360, 62), 20, fill=WHITE, outline=BLUE, width=3)
    d.text((130, 30), "Getting Started", font=font(20), fill=BLACK)
    d.ellipse((320, 28, 348, 56), fill=DARK)
    d.text((330, 32), "⋮", font=font(18), fill=WHITE)
    # annotation
    d.line((280, 180, 240, 70), fill=BLUE, width=4)
    d.polygon([(240, 70), (228, 88), (252, 88)], fill=BLUE)
    caption(d, "Header (left side)", "Storyboard Title and Tools", y=200)
    save(img, "scene-02.webp")


def scene_03():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    draw_header_bar(d, left_mark="docs")
    rounded_rect(d, (470, 18, 610, 70), 22, outline=BLUE, width=3)
    d.line((360, 200, 520, 70), fill=BLUE, width=4)
    d.polygon([(520, 70), (504, 78), (514, 90)], fill=BLUE)
    caption(d, "Header (right side)", "Notifications & Dashboard", y=220)
    save(img, "scene-03.webp")


def scene_04():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    draw_header_bar(d, left_mark="docs")
    # step badge instead of brand burst
    d.ellipse((40, 90, 120, 170), fill=WHITE, outline=BLACK, width=3)
    d.text((62, 108), "1", font=font(48), fill=BLACK)
    # highlight user
    d.ellipse((568, 18, 620, 70), outline=BLUE, width=3)
    d.line((300, 220, 590, 70), fill=BLUE, width=4)
    caption(d, "Managing the App", "The User, the App Settings", y=230)
    save(img, "scene-04.webp")


def scene_05():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 640, 90), fill=GRAY)
    # generic docs badge
    d.ellipse((28, 18, 84, 74), fill=WHITE, outline=BLACK, width=2)
    d.rectangle((42, 34, 70, 58), outline=BLACK, width=2)
    # view modes
    rounded_rect(d, (430, 22, 610, 70), 16, fill=WHITE, outline=BLUE, width=3)
    # tile
    for r in range(3):
        for c in range(3):
            d.ellipse((448 + c * 12, 34 + r * 12, 456 + c * 12, 42 + r * 12), fill=DARK)
    # list
    d.rectangle((500, 36, 530, 44), fill=DARK)
    d.rectangle((500, 50, 530, 58), fill=DARK)
    # slide
    d.rectangle((555, 34, 585, 60), outline=DARK, width=2)
    d.polygon([(562, 38), (562, 56), (580, 47)], fill=DARK)
    d.line((320, 200, 520, 70), fill=BLUE, width=4)
    caption(d, "Scenes Appearance", "Tile, List, or Slide Mode", y=220)
    save(img, "scene-05.webp")


def scene_06():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    d.ellipse((36, 28, 110, 102), fill=WHITE, outline=BLACK, width=3)
    d.text((58, 44), "2", font=font(48), fill=BLACK)
    # kebab
    d.ellipse((520, 40, 580, 100), fill=DARK)
    for i, yy in enumerate((58, 70, 82)):
        d.ellipse((544, yy, 556, yy + 12), fill=WHITE)
    d.ellipse((510, 30, 590, 110), outline=BLUE, width=4)
    d.line((280, 200, 540, 100), fill=BLUE, width=4)
    caption(d, "Scene Controls", "Image, Description & More", y=230)
    save(img, "scene-06.webp")


def scene_07():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    d.ellipse((36, 28, 100, 92), fill=WHITE, outline=BLACK, width=2)
    d.rectangle((50, 44, 86, 76), outline=BLACK, width=2)
    d.line((58, 54, 78, 54), fill=BLACK, width=2)
    # Add Scene button
    rounded_rect(d, (200, 120, 440, 180), 28, fill=DARK, outline=BLUE, width=4)
    d.text((230, 136), "Add Scene", font=font(26), fill=YELLOW)
    d.line((360, 132, 360, 168), fill=YELLOW, width=2)
    d.polygon([(390, 140), (410, 140), (400, 158)], fill=YELLOW)
    caption(d, "Import Images", "Upload Multiple Images", y=230)
    save(img, "scene-07.webp")


def scene_08():
    img = Image.new("RGB", (640, 360), YELLOW)
    d = ImageDraw.Draw(img)
    d.ellipse((36, 28, 110, 102), fill=WHITE, outline=BLACK, width=3)
    d.text((58, 44), "3", font=font(48), fill=BLACK)
    # magnifying glass (no mascot)
    d.ellipse((420, 80, 540, 200), outline=WHITE, width=10)
    d.line((520, 190, 580, 260), fill=WHITE, width=12)
    d.ellipse((445, 105, 515, 175), outline=BLACK, width=3)
    caption(d, "Get Answers", "Help and Support", y=240)
    save(img, "scene-08.webp")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    scene_01()
    scene_02()
    scene_03()
    scene_04()
    scene_05()
    scene_06()
    scene_07()
    scene_08()


if __name__ == "__main__":
    main()
