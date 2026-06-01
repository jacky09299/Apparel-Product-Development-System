import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import pickle
import os
import json
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=1000):
        super(PositionalEncoding, self).__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]

class QuantileTransformer(nn.Module):
    def __init__(self, input_size=3, d_model=128, nhead=8, num_layers=6, seq_out=270, quantiles=[0.025, 0.5, 0.975], dropout=0.2):
        super().__init__()
        self.seq_out = seq_out
        self.quantiles = quantiles

        self.input_proj = nn.Linear(input_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model)

        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, dim_feedforward=d_model*4, dropout=dropout, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        self.fc = nn.Sequential(
            nn.Linear(d_model, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, seq_out * len(quantiles))
        )

    def forward(self, x):
        x = self.input_proj(x)
        x = self.pos_encoder(x)
        x = self.transformer_encoder(x)

        x = x.mean(dim=1)
        daily_deltas = self.fc(x)
        daily_deltas = daily_deltas.view(-1, self.seq_out, len(self.quantiles))

        accumulated_out = torch.cumsum(daily_deltas, dim=1)
        return accumulated_out

def process_real_data():
    base_dir = "/home/jacky/文件/myweb/Product Development Decision Support System/popularity prediction/fashion dataset"
    
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
        
    model = QuantileTransformer(input_size=3, d_model=128, nhead=8, num_layers=6, seq_out=270, quantiles=[0.025, 0.5, 0.975])
    state_dict = torch.load('model_cumsum_95.pth', map_location='cpu')
    clean_state_dict = {k.replace('_orig_mod.', ''): v for k, v in state_dict.items()}
    model.load_state_dict(clean_state_dict, strict=False)
    model.eval()

    def process_csv(csv_path, item_name, category_name, item_id):
        df = pd.read_csv(csv_path)
        df['time'] = pd.to_datetime(df['time'])
        
        if len(df) < 365 + 270:
            return None
            
        input_start = len(df) - 365 - 270
        input_end = len(df) - 270
        
        history_df = df.iloc[input_start:input_end]
        
        pop_values = history_df['popularity'].values.reshape(-1, 1)
        pop_scaled = scaler.transform(pop_values)
        
        month = history_df['time'].dt.month.values
        month_sin = np.sin(2 * np.pi * month / 12.0).reshape(-1, 1)
        month_cos = np.cos(2 * np.pi * month / 12.0).reshape(-1, 1)
        
        x_window = np.hstack([pop_scaled, month_sin, month_cos])
        X_tensor = torch.tensor(np.array([x_window]), dtype=torch.float32)
        
        with torch.no_grad():
            preds_delta = model(X_tensor)
            
        anchor = pop_scaled[-1, 0]
        preds_abs = preds_delta + anchor
        
        pred_lower = scaler.inverse_transform(preds_abs[:, :, 0].numpy().reshape(-1, 1)).flatten()
        pred_50 = scaler.inverse_transform(preds_abs[:, :, 1].numpy().reshape(-1, 1)).flatten()
        pred_upper = scaler.inverse_transform(preds_abs[:, :, 2].numpy().reshape(-1, 1)).flatten()
        
        real_history = pop_values.flatten()
        
        timeline = []
        for i in range(12):
            chunk = real_history[int(i*(365/12)) : int((i+1)*(365/12))]
            val = np.mean(chunk) if len(chunk)>0 else 0
            timeline.append({"median": round(val), "lower": round(val), "upper": round(val)})
            
        for i in range(9):
            start = int(i * (270/9))
            end = int((i + 1) * (270/9))
            c_low = np.mean(pred_lower[start:end])
            c_med = np.mean(pred_50[start:end])
            c_up = np.mean(pred_upper[start:end])
            timeline.append({
                "median": round(c_med), 
                "lower": round(c_low), 
                "upper": round(c_up)
            })
            
        target = timeline[17]
        score = target["median"]
        interval = [target["lower"], target["upper"]]
        
        return {
            "id": item_id,
            "category": category_name,
            "name": item_name,
            "score": score,
            "interval": interval,
            "timeline": timeline
        }

    cat_dir = os.path.join(base_dir, "Clothing category")
    cat_files = sorted([f for f in os.listdir(cat_dir) if f.endswith('.csv')])
    real_items = []
    
    name_map = {
        'dress': '洋裝 (Dress)',
        'outerwear': '外套 (Outerwear)',
        'shirt': '襯衫 (Shirt)',
        'suit': '西裝 (Suit)',
        'sweater': '毛衣 (Sweater)',
        'tank top': '背心 (Tank Top)'
    }
    
    for i, f in enumerate(cat_files):
        key = f.split('_')[0]
        name = name_map.get(key, key)
        item = process_csv(os.path.join(cat_dir, f), name, "品項", f"ai-cat-{i}")
        if item: real_items.append(item)
        
    color_dir = os.path.join(base_dir, "Major color")
    color_files = sorted([f for f in os.listdir(color_dir) if f.endswith('.csv')])
    
    color_map = {
        'black': '黑色', 'blue': '藍色', 'brown': '棕色', 'cyan': '青色',
        'gray': '灰色', 'green': '綠色', 'orange': '橘色', 'pink': '粉色',
        'purple': '紫色', 'red': '紅色', 'white': '白色', 'yellow': '黃色'
    }
    
    for i, f in enumerate(color_files):
        key = f.split('_')[0]
        name = color_map.get(key, key)
        item = process_csv(os.path.join(color_dir, f), name, "主色", f"ai-col-{i}")
        if item: real_items.append(item)
        
    json_path = "/home/jacky/文件/myweb/Product Development Decision Support System/public/ai_predictions.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    filtered_data = [d for d in data if d['category'] not in ['品項', '主色']]
    
    # Scale fake data to match real magnitude (about 5 ~ 35)
    for item in filtered_data:
        old = item.get('score', 80)
        if isinstance(old, (int, float)):
            new_score = int(max(5, min(35, (old - 60) / 38 * 24 + 8)))
            item['score'] = new_score
            spread = int(max(1, new_score * 0.15))
            item['interval'] = [new_score - spread, new_score + spread]
    
    final_data = real_items + filtered_data
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
        
    print("Successfully updated ai_predictions.json with new model predictions!")

if __name__ == '__main__':
    process_real_data()
