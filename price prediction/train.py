import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import pickle
import copy

from preprocess import Preprocessor, MercariDataset, collate_fn

# 1. 回歸本質：強大的 1D CNN (專抓關鍵字組合，防死背神器)
class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim=128, num_filters=128):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(in_channels=embed_dim, out_channels=num_filters, kernel_size=k) 
            for k in [1, 2, 3, 4] # 一次看 1~4 個連續單字
        ])
        
    def forward(self, x):
        if x.size(1) < 4:
            x = F.pad(x, (0, 4 - x.size(1)))
            
        x = self.embedding(x)
        x = x.transpose(1, 2)
        
        pools = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = torch.max(c, dim=2)[0]
            pools.append(p)
            
        return torch.cat(pools, dim=1)

# 2. 混合模型
class MercariCNNModel(nn.Module):
    def __init__(self, vocab_size, brand_size, c1_size, c2_size, c3_size, embed_dim=128):
        super().__init__()
        
        self.name_cnn = TextCNN(vocab_size, embed_dim=embed_dim, num_filters=128)
        self.desc_cnn = TextCNN(vocab_size, embed_dim=embed_dim, num_filters=128)
        
        self.brand_emb = nn.Embedding(brand_size, 64)
        self.c1_emb = nn.Embedding(c1_size, 32)
        self.c2_emb = nn.Embedding(c2_size, 32)
        self.c3_emb = nn.Embedding(c3_size, 32)
        self.cond_emb = nn.Embedding(10, 8) 
        
        # 128(filters) * 4(kernels) * 2(name+desc) = 1024
        # 64 + 32*3 + 8 + 1 = 169
        in_features = 1024 + 169
        
        self.fc1 = nn.Linear(in_features, 512)
        self.ln1 = nn.LayerNorm(512)
        self.fc2 = nn.Linear(512, 128)
        self.ln2 = nn.LayerNorm(128)
        self.out = nn.Linear(128, 1)
        self.relu = nn.ReLU()
        # CNN 不像 Transformer 那麼容易死背，Dropout 降回適當的 0.3 即可
        self.dropout = nn.Dropout(0.3)

    def forward(self, name, name_mask, desc, desc_mask, brand, c1, c2, c3, cond, ship):
        # CNN 不需要 mask，它靠 padding_idx=0 以及 MaxPooling 自己過濾掉無用資訊
        n_feat = self.name_cnn(name)
        d_feat = self.desc_cnn(desc)
        
        b_e = self.brand_emb(brand)
        c1_e = self.c1_emb(c1)
        c2_e = self.c2_emb(c2)
        c3_e = self.c3_emb(c3)
        cond_e = self.cond_emb(cond)
        
        x = torch.cat([n_feat, d_feat, b_e, c1_e, c2_e, c3_e, cond_e, ship.unsqueeze(1).float()], dim=1)
        
        x = self.relu(self.ln1(self.fc1(x)))
        x = self.dropout(x)
        x = self.relu(self.ln2(self.fc2(x)))
        x = self.dropout(x)
        
        x = self.out(x)
        return x.squeeze(1)

if __name__ == '__main__':
    # ================================
    # 訓練超參數設定 (直接在這裡修改)
    # ================================
    EPOCHS = 15
    BATCH_SIZE = 256
    LR = 0.001
    PATIENCE = 3
    SAMPLE_SIZE = None

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    BASE_DIR = '/content/drive/MyDrive/price/' if device.type == 'cuda' else './'
    print(f"Using device: {device}, BASE_DIR: {BASE_DIR}")

    print("Loading Data...")
    train_df = pd.read_csv(f'{BASE_DIR}train_split.tsv', sep='\t')
    val_df = pd.read_csv(f'{BASE_DIR}val_split.tsv', sep='\t')

    if SAMPLE_SIZE:
        train_df = train_df.sample(min(SAMPLE_SIZE, len(train_df)), random_state=42)
        val_df = val_df.sample(min(SAMPLE_SIZE // 5, len(val_df)), random_state=42)

    with open(f'{BASE_DIR}preprocessor.pkl', 'rb') as f:
        prep = pickle.load(f)

    train_data = prep.transform(train_df)
    val_data = prep.transform(val_df)

    train_ds = MercariDataset(*train_data)
    val_ds = MercariDataset(*val_data)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn)

    model = MercariCNNModel(
        vocab_size=len(prep.vocab),
        brand_size=len(prep.brands),
        c1_size=len(prep.cat1s),
        c2_size=len(prep.cat2s),
        c3_size=len(prep.cat3s)
    ).to(device)

    criterion = nn.MSELoss()
    # CNN 比較不會死背，weight_decay 調回 1e-4 讓它更好收斂
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=1)

    train_losses = []
    val_losses = []

    best_val_rmsle = float('inf')
    epochs_no_improve = 0
    best_model_wts = copy.deepcopy(model.state_dict())

    print("\n🚀 開始訓練「黃金架構」1D CNN 模型！")
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_train_loss = 0
        for batch in train_loader:
            batch = [b.to(device) for b in batch]
            *inputs, targets = batch
            
            optimizer.zero_grad()
            outputs = model(*inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            total_train_loss += loss.item() * targets.size(0)
            
        train_rmsle = np.sqrt(total_train_loss / len(train_ds))
        train_losses.append(train_rmsle)

        model.eval()
        total_val_loss = 0
        with torch.no_grad():
            for batch in val_loader:
                batch = [b.to(device) for b in batch]
                *inputs, targets = batch
                
                outputs = model(*inputs)
                loss = criterion(outputs, targets)
                total_val_loss += loss.item() * targets.size(0)
                
        val_rmsle = np.sqrt(total_val_loss / len(val_ds))
        val_losses.append(val_rmsle)
        
        old_lr = optimizer.param_groups[0]['lr']
        scheduler.step(val_rmsle)
        new_lr = optimizer.param_groups[0]['lr']
        
        print(f"Epoch {epoch}/{EPOCHS} - Train RMSLE: {train_rmsle:.4f} - Val RMSLE: {val_rmsle:.4f}")
        if new_lr < old_lr:
            print(f"  📉 學習率下調至 {new_lr}")

        if val_rmsle < best_val_rmsle:
            best_val_rmsle = val_rmsle
            best_model_wts = copy.deepcopy(model.state_dict())
            epochs_no_improve = 0
            print("  🌟 獲得目前最佳模型，已存檔。")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= PATIENCE:
                print("\n🛑 Early Stopping！")
                break

    model.load_state_dict(best_model_wts)
    torch.save(model.state_dict(), f'{BASE_DIR}model.pth')
    print(f"🏆 最強 1D CNN 模型已儲存至 {BASE_DIR}model.pth")
    
    plt.figure(figsize=(8,6))
    plt.plot(range(1, len(train_losses)+1), train_losses, marker='o', label='Train RMSLE')
    plt.plot(range(1, len(val_losses)+1), val_losses, marker='o', label='Val RMSLE')
    plt.xlabel('Epochs')
    plt.ylabel('RMSLE')
    plt.title('Training Curve (1D CNN)')
    plt.legend()
    plt.grid(True)
    plt.savefig(f'{BASE_DIR}training_curve.png')
    plt.close()
