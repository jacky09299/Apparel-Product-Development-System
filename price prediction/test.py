import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader
import pickle
import matplotlib.pyplot as plt

from preprocess import Preprocessor, MercariDataset, collate_fn
from train import MercariCNNModel

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    BASE_DIR = '/content/drive/MyDrive/price/' if device.type == 'cuda' else './'
    print(f"Using device: {device}, BASE_DIR: {BASE_DIR}")

    with open(f'{BASE_DIR}preprocessor.pkl', 'rb') as f:
        prep = pickle.load(f)

    model = MercariCNNModel(
        vocab_size=len(prep.vocab),
        brand_size=len(prep.brands),
        c1_size=len(prep.cat1s),
        c2_size=len(prep.cat2s),
        c3_size=len(prep.cat3s)
    ).to(device)
    
    print("Loading model weights...")
    model.load_state_dict(torch.load(f'{BASE_DIR}model.pth', map_location=device))
    model.eval()

    print("Loading test_split.tsv...")
    df = pd.read_csv(f'{BASE_DIR}test_split.tsv', sep='\t')
    
    test_data = prep.transform(df)
    test_ds = MercariDataset(*test_data)
    test_loader = DataLoader(test_ds, batch_size=512, shuffle=False, collate_fn=collate_fn)

    all_preds = []
    all_targets = []
    
    print("Evaluating on test set...")
    with torch.no_grad():
        for batch in test_loader:
            batch = [b.to(device) for b in batch]
            *inputs, targets = batch
            
            all_targets.extend(targets.cpu().numpy())
            
            outputs = model(*inputs)
            all_preds.extend(outputs.cpu().numpy())

    preds_expm1 = np.expm1(all_preds)
    true_prices = df['price'].values
    
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.scatter(true_prices, preds_expm1, alpha=0.3, s=5, color='blue')
    plt.plot([1, max(true_prices)], [1, max(true_prices)], color='red', linestyle='--')
    plt.xlabel('Actual Price')
    plt.ylabel('Predicted Price')
    plt.title('Test Set: Actual vs Predicted')
    plt.xscale('log')
    plt.yscale('log')
    plt.xlim(1, max(true_prices)+10)
    plt.ylim(1, max(preds_expm1)+10)
    
    plt.subplot(1, 2, 2)
    errors = np.log1p(preds_expm1) - np.log1p(true_prices)
    plt.hist(errors, bins=50, edgecolor='k', alpha=0.7, color='green')
    plt.xlabel('Log Error')
    plt.ylabel('Frequency')
    plt.title('Log Price Error Distribution')
    plt.axvline(0, color='red', linestyle='--')
    
    plt.tight_layout()
    plt.savefig(f'{BASE_DIR}test_evaluation.png')
    plt.close()
    
    rmsle = np.sqrt(np.mean(errors**2))
    print(f"Final Test RMSLE (Custom Transformer): {rmsle:.4f}")
    print("Saved test_evaluation.png")

if __name__ == '__main__':
    main()
