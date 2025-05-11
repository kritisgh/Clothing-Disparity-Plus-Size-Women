import json
import openai
import os

openai.api_key = os.environ["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"]

# 1. Load your JSON of image URLs
with open("plusimg.json","r") as f:
    items = json.load(f)

results = []
for item in items:
    url = item["imageUrl"]

    # 2. Send image URL + prompt to GPT-4 Vision
    resp = openai.ChatCompletion.create(
        model="gpt-4o-mini",          # or "gpt-4o" if available
        messages=[
          {"role":"system","content":"You are a fashion expert. Describe the following dress in detail."},
          {"role":"user","content":f"![dress]({url})"}
        ]
    )

    caption = resp.choices[0].message.content.strip()
    print("→", caption)
    results.append({"imageUrl": url, "description": caption})

# 3. Save your enriched JSON
with open("plusimg_with_gpt4v.json","w") as f:
    json.dump(results, f, indent=2)
