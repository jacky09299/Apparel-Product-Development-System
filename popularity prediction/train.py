import math
import torch
import torch.nn as nn
import torch.optim as optim
# import matplotlib.pyplot as plt
from torch.utils.data import TensorDataset, DataLoader

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.pe = pe.unsqueeze(0)

    def forward(self, x):
        seq_len = x.size(1)
        x = x + self.pe[:, :seq_len, :].to(x.device)
        return x

class QuantileTransformer(nn.Module):
    # 改為 95% 預測區間: 2.5% ~ 97.5%
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
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.GELU(),
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

def quantile_loss(preds, target, quantiles):
    target = target.expand_as(preds)
    errors = target - preds
    loss = 0
    for i, q in enumerate(quantiles):
        e = errors[:, :, i]
        loss += torch.max((q - 1) * e, q * e).mean()
    return loss

def train_model():
    X_train, y_train, _ = torch.load('train.pt')
    X_val, y_val, _ = torch.load('val.pt')
    
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=16, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=16, shuffle=False)
    
    seq_out = y_train.shape[1]
    quantiles = [0.025, 0.5, 0.975]
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"訓練裝置 (Training Device): {device}")
    
    input_size = X_train.shape[2]
    model = QuantileTransformer(input_size=input_size, seq_out=seq_out, quantiles=quantiles).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.0005)
    
    epochs = 200
    train_losses, val_losses = [], []
    
    best_val_loss = float('inf')
    patience = 20
    patience_counter = 0
    
    print("開始訓練【95% 區間累加型 Transformer】...")
    for epoch in range(epochs):
        model.train()
        epoch_train_loss = 0
        for X_b, y_b in train_loader:
            X_b, y_b = X_b.to(device), y_b.to(device)
            
            optimizer.zero_grad()
            preds = model(X_b)
            loss = quantile_loss(preds, y_b, quantiles)
            loss.backward()
            optimizer.step()
            epoch_train_loss += loss.item()
            
        model.eval()
        epoch_val_loss = 0
        with torch.no_grad():
            for X_b, y_b in val_loader:
                X_b, y_b = X_b.to(device), y_b.to(device)
                
                preds = model(X_b)
                loss = quantile_loss(preds, y_b, quantiles)
                epoch_val_loss += loss.item()
                
        t_loss = epoch_train_loss / len(train_loader)
        v_loss = epoch_val_loss / len(val_loader)
        train_losses.append(t_loss)
        val_losses.append(v_loss)
        
        if v_loss < best_val_loss:
            best_val_loss = v_loss
            torch.save(model.state_dict(), 'model_cumsum_95.pth')
            patience_counter = 0
        else:
            patience_counter += 1
            
        if (epoch+1) % 10 == 0:
            print(f"Epoch {epoch+1:03d}/{epochs} | Train Loss: {t_loss:.4f} | Val Loss: {v_loss:.4f} | Patience: {patience_counter}/{patience}")
            
        if patience_counter >= patience:
            print(f"\n[Early Stopping] 驗證集誤差已不再下降，提早於 Epoch {epoch+1} 停止訓練！")
            break
            
    plt.figure(figsize=(10, 5))
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Val Loss')
    plt.title('95% Cumsum Transformer Loss Curve')
    plt.xlabel('Epochs')
    plt.ylabel('Quantile Loss')
    plt.legend()
    plt.savefig('loss_curve_cumsum_95.png')

if __name__ == '__main__':
    train_model()
