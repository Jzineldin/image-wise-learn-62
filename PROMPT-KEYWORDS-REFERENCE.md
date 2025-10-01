# Image Generation Prompt Keywords Reference

## Understanding How Keywords Affect SDXL Output

This guide explains what each keyword does and how to use them effectively.

---

## 🎨 Style Keywords

### Illustration vs Photography

| Keyword | Effect | Use When |
|---------|--------|----------|
| `illustration` | Clearly illustrated, NOT photographic | Always for children's content |
| `digital painting` | Painted look with soft edges | Want painterly aesthetic |
| `storybook art` | Traditional children's book style | Want classic storybook feel |
| `picture book` | Modern picture book aesthetic | Want contemporary look |
| `hand-painted` | Organic, artistic feel | Want warm, human touch |

**❌ AVOID:**
- `photorealistic`, `photo`, `photograph` - Makes it look like a photo
- `3d render`, `CGI` - Makes it look computer-generated
- `cinematic` - Pushes toward movie-like realism

---

## 🖌️ Painting Techniques

### Watercolor
```
soft watercolor, gentle watercolor painting, delicate brush work, 
light washes, flowing colors, watercolor textures
```
**Effect:** Soft edges, dreamy, gentle, pastel colors, artistic

### Gouache
```
gouache illustration, opaque paint, matte finish, flat colors, 
textured illustration, hand-painted gouache
```
**Effect:** Vibrant, matte, modern, bold colors, contemporary

### Digital Painting
```
digital painting, soft brush strokes, painterly style, blended colors, 
soft edges, artistic digital illustration
```
**Effect:** Polished, professional, soft transitions, high quality

### Flat Illustration
```
flat illustration, textured flat colors, simplified shapes, 
graphic design, bold illustration, clean style
```
**Effect:** Modern, simple, clear, graphic, minimal depth

---

## 🌈 Color Keywords

### Vibrant & Colorful
```
vibrant colors, colorful, rich colors, saturated colors, 
bold color palette, bright colors
```
**Effect:** Eye-catching, energetic, engaging

### Warm & Inviting
```
warm color palette, warm tones, cozy colors, inviting colors, 
gentle lighting, soft warm glow
```
**Effect:** Friendly, comfortable, safe feeling

### Pastel & Soft
```
pastel colors, soft colors, gentle hues, light colors, 
delicate color palette, muted tones
```
**Effect:** Calm, soothing, gentle, non-threatening

### Magical & Fantasy
```
magical colors, ethereal colors, mystical palette, 
enchanted atmosphere, fantasy colors
```
**Effect:** Whimsical, dreamlike, otherworldly

---

## 💡 Lighting Keywords

### Gentle & Soft
```
gentle lighting, soft lighting, diffused light, warm glow, 
ambient light, natural soft light
```
**Effect:** Comfortable, safe, inviting

### Magical & Dramatic
```
magical lighting, glowing light, enchanted glow, mystical light, 
beautiful lighting, dramatic but soft
```
**Effect:** Whimsical, fantasy, engaging

**❌ AVOID:**
- `harsh lighting`, `dramatic shadows` - Too intense
- `cinematic lighting` - Too photorealistic
- `studio lighting` - Too professional/realistic

---

## 🎭 Mood & Atmosphere

### Child-Friendly
```
whimsical, charming, friendly, inviting, safe for children, 
age-appropriate, playful, joyful
```
**Effect:** Appropriate, engaging, non-threatening

### Fantasy & Magic
```
magical, enchanted, mystical, dreamlike, fantastical, 
ethereal, otherworldly, surreal
```
**Effect:** Imaginative, wonder-filled, engaging

### Warm & Cozy
```
warm, cozy, inviting, comfortable, gentle, soft, 
nurturing, peaceful
```
**Effect:** Safe, comforting, bedtime-appropriate

**❌ AVOID:**
- `dark`, `gritty`, `scary`, `horror` - Too intense
- `realistic`, `serious`, `dramatic` - Too adult

---

## 🏆 Quality Keywords

### High Quality (Safe)
```
high quality, professional, well-crafted, detailed illustration, 
masterful, polished, refined
```
**Effect:** Professional look without photorealism

### Artistic Quality
```
artistic, beautiful, aesthetic, visually appealing, 
well-composed, harmonious
```
**Effect:** Elevated quality, artistic merit

**❌ AVOID:**
- `masterpiece`, `award-winning` - Can push toward photorealism
- `highly detailed`, `hyperdetailed` - Too realistic
- `8k`, `4k`, `ultra HD` - Photography terms

---

## 🚫 Negative Prompt Keywords

### Essential Anti-Photorealism
```
photorealistic, photo, photograph, realistic photography, 
3d render, CGI, hyperrealistic, camera, lens, depth of field, 
bokeh, film grain, DSLR, photographic, cinematic photography
```
**Why:** Prevents SDXL from generating photographic images

### Quality Issues
```
low quality, worst quality, blurry, pixelated, jpeg artifacts, 
noise, grainy, compression artifacts
```
**Why:** Ensures high-quality output

### Anatomical Issues
```
deformed, distorted, extra limbs, mutated hands, bad anatomy, 
crooked eyes, disfigured, malformed, extra fingers, missing limbs
```
**Why:** Prevents character deformities

### Child Safety
```
nsfw, gore, scary, horror, violent, blood, weapons, nudity, 
disturbing, creepy, nightmare, terrifying
```
**Why:** Ensures age-appropriate content

### Unwanted Elements
```
text, caption, logo, watermark, signature, username, artist name
```
**Why:** Clean images without text overlays

---

## 📝 Complete Style Formulas

### Formula 1: Digital Storybook (Recommended)
```
POSITIVE:
digital storybook illustration, painterly style, soft brush strokes, 
vibrant children's book art, warm color palette, gentle lighting, 
whimsical but sophisticated, picture book quality, hand-painted feel, 
storybook aesthetic, charming illustration, professional children's book art, 
colorful and inviting, safe for children, age-appropriate

NEGATIVE:
photorealistic, photo, photograph, 3d render, CGI, hyperrealistic, 
camera, lens, depth of field, bokeh, harsh shadows, dark atmosphere, 
low quality, blurry, deformed, text, nsfw, scary, violent
```

### Formula 2: Watercolor Fantasy
```
POSITIVE:
soft watercolor illustration, gentle watercolor painting, delicate brush work, 
pastel fantasy colors, dreamy watercolor art, light washes, ethereal watercolor style, 
children's watercolor book, flowing colors, artistic watercolor, storybook watercolor, 
safe for children

NEGATIVE:
photorealistic, photo, 3d render, sharp edges, hard lines, digital art, 
harsh lighting, dark, gritty, low quality, deformed, text, nsfw, scary
```

### Formula 3: Gouache Illustration
```
POSITIVE:
gouache illustration style, opaque paint aesthetic, matte finish illustration, 
vibrant gouache colors, textured illustration, modern storybook art, 
flat color illustration, contemporary children's book style, 
hand-painted gouache feel, colorful and inviting

NEGATIVE:
photorealistic, photo, 3d render, glossy, shiny, realistic lighting, 
CGI, hyperdetailed, photograph, low quality, deformed, text, nsfw, scary
```

### Formula 4: Soft Digital Painting
```
POSITIVE:
soft digital painting, gentle brush work, painted illustration, warm digital art, 
blended colors, soft edges, illustrated painting style, storybook painting, 
artistic digital illustration, hand-painted digital art, safe for children

NEGATIVE:
photorealistic, photo, 3d render, sharp focus, hyperrealistic, photograph, 
realistic photography, CGI render, low quality, deformed, text, nsfw, scary
```

### Formula 5: Flat Illustration
```
POSITIVE:
flat illustration style, textured flat colors, modern children's illustration, 
simplified shapes, graphic storybook art, contemporary flat design, 
bold illustration, clean geometric style, textured digital illustration, 
colorful and friendly

NEGATIVE:
photorealistic, photo, 3d render, realistic, detailed rendering, shadows, 
depth of field, photograph, low quality, deformed, text, nsfw, scary
```

---

## 🔧 Fine-Tuning Tips

### To Make Images MORE Illustrated (Less Realistic)
1. **Add more style keywords:** `illustrated`, `storybook art`, `picture book`
2. **Strengthen negative prompt:** Add `realistic`, `photographic`, `3d render`
3. **Reduce steps:** 35 → 30 (softer, less detailed)
4. **Increase guidance:** 7.0 → 7.5 (stronger style enforcement)

### To Make Images MORE Vibrant
1. **Add color keywords:** `vibrant colors`, `saturated`, `bold color palette`
2. **Remove from negative:** Don't include `saturated` in negative prompt
3. **Increase guidance:** 7.0 → 7.5 (stronger color adherence)

### To Make Images SOFTER/GENTLER
1. **Add softness keywords:** `soft`, `gentle`, `delicate`, `pastel colors`
2. **Use watercolor style:** Switch to `watercolor_fantasy`
3. **Reduce steps:** 35 → 30
4. **Reduce guidance:** 7.0 → 6.5

### To Make Images MORE MODERN
1. **Use flat or gouache style:** `flat_illustration` or `gouache`
2. **Add contemporary keywords:** `modern`, `contemporary`, `graphic design`
3. **Simplify:** `clean`, `simplified shapes`, `bold`

---

## 🎯 Common Issues & Solutions

### Issue: Images Still Look Too Realistic
**Solution:**
1. Add to negative prompt: `photorealistic, photo, photograph, realistic photography, 3d render, CGI, hyperrealistic, camera, lens`
2. Strengthen positive prompt: Add more `illustrated`, `storybook`, `painted` keywords
3. Increase guidance to 7.5 or 8.0
4. Switch to `watercolor_fantasy` or `flat_illustration` style

### Issue: Images Look Too Cartoonish/Cheap
**Solution:**
1. Remove `cartoon` keywords
2. Add quality keywords: `professional`, `high quality`, `well-crafted`
3. Use `digital_storybook` or `soft_painting` style
4. Increase steps to 40

### Issue: Colors Are Too Dull
**Solution:**
1. Add: `vibrant colors`, `saturated`, `bold color palette`, `rich colors`
2. Remove from negative: `saturated`, `vibrant`
3. Use `gouache` or `digital_storybook` style
4. Increase guidance to 7.5

### Issue: Images Are Too Dark/Scary
**Solution:**
1. Add: `gentle lighting`, `warm glow`, `bright`, `cheerful`
2. Add to negative: `dark atmosphere`, `shadows`, `gritty`, `moody`
3. Use `watercolor_fantasy` or `flat_illustration` style

---

## 📊 Keyword Weight Guide

SDXL pays attention to keyword order and repetition:

### High Priority (Use Early in Prompt)
- Style definition: `digital storybook illustration`
- Medium: `painterly style`, `watercolor painting`
- Main subject: `[your scene description]`

### Medium Priority (Middle of Prompt)
- Color palette: `vibrant colors`, `warm tones`
- Lighting: `gentle lighting`, `soft glow`
- Mood: `whimsical`, `friendly`

### Low Priority (End of Prompt)
- Quality: `high quality`, `professional`
- Safety: `safe for children`, `age-appropriate`
- Technical: `well-composed`, `detailed`

### Emphasis Techniques
- **Repetition:** `soft, gentle, soft lighting` (emphasizes softness)
- **Parentheses:** `(vibrant colors)` (slight emphasis)
- **Multiple related terms:** `magical, enchanted, mystical` (reinforces theme)

---

## 🚀 Quick Reference

**For most children's stories:**
```
[scene], digital storybook illustration, painterly style, vibrant colors, 
gentle lighting, whimsical, safe for children
```

**For gentle/bedtime stories:**
```
[scene], soft watercolor illustration, pastel colors, dreamy, gentle lighting, 
peaceful, safe for children
```

**For vibrant/action stories:**
```
[scene], gouache illustration, vibrant colors, bold, energetic, 
modern storybook art, safe for children
```

**For educational stories:**
```
[scene], flat illustration, simplified shapes, clear, colorful, 
modern children's illustration, safe for children
```

---

## 💡 Pro Tips

1. **Always include:** `safe for children`, `age-appropriate`
2. **Always exclude:** `photorealistic`, `photo`, `3d render`, `nsfw`, `scary`
3. **Be specific about style:** Don't just say "illustration" - say what KIND
4. **Use consistent terminology:** Pick a style and stick with its keywords
5. **Test and iterate:** Generate multiple images with slight variations
6. **Less is sometimes more:** Don't overload with too many keywords
7. **Order matters:** Put most important keywords first

---

This reference guide should help you understand and customize the image generation prompts effectively!

