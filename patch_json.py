import json

json_path = "/home/jacky/文件/myweb/Product Development Decision Support System/public/ai_predictions.json"
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('category') not in ['品項', '主色']:
        old = item.get('score', 80)
        if isinstance(old, (int, float)):
            # scale down to roughly 8~30 range
            new_score = int(max(5, min(35, (old - 60) / 38 * 24 + 8)))
            item['score'] = new_score
            spread = int(max(1, new_score * 0.15))
            item['interval'] = [new_score - spread, new_score + spread]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Patched JSON fake data")
