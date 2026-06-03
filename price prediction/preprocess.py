import pandas as pd
from sklearn.model_selection import train_test_split
import re
from collections import Counter
import torch
from torch.utils.data import Dataset
from torch.nn.utils.rnn import pad_sequence
import pickle

def tokenize(text):
    text = str(text).lower()
    return re.findall(r'\w+', text)

def split_cat(text):
    try:
        return text.split('/')[:3]
    except:
        return ['missing', 'missing', 'missing']

class Preprocessor:
    def __init__(self, min_freq=5):
        self.vocab = {'<PAD>': 0, '<UNK>': 1}
        self.brands = {'<UNK>': 0}
        self.cat1s = {'<UNK>': 0}
        self.cat2s = {'<UNK>': 0}
        self.cat3s = {'<UNK>': 0}
        self.min_freq = min_freq
        
    def fit(self, df):
        word_counts = Counter()
        for text in df['name'].fillna('') + ' ' + df['item_description'].fillna(''):
            word_counts.update(tokenize(text))
            
        for word, count in word_counts.items():
            if count >= self.min_freq:
                self.vocab[word] = len(self.vocab)
                
        for b in df['brand_name'].fillna('missing').unique():
            self.brands[b] = len(self.brands)
            
        cats = df['category_name'].fillna('missing//').apply(split_cat)
        for c_list in cats:
            c1, c2, c3 = (c_list + ['missing', 'missing'])[:3]
            if c1 not in self.cat1s: self.cat1s[c1] = len(self.cat1s)
            if c2 not in self.cat2s: self.cat2s[c2] = len(self.cat2s)
            if c3 not in self.cat3s: self.cat3s[c3] = len(self.cat3s)
            
    def transform(self, df):
        names = [[self.vocab.get(w, 1) for w in tokenize(t)] for t in df['name'].fillna('')]
        descs = [[self.vocab.get(w, 1) for w in tokenize(t)] for t in df['item_description'].fillna('')]
        brands = [self.brands.get(b, 0) for b in df['brand_name'].fillna('missing')]
        
        cats = df['category_name'].fillna('missing//').apply(split_cat)
        c1_idx = [self.cat1s.get((c + ['missing', 'missing'])[0], 0) for c in cats]
        c2_idx = [self.cat2s.get((c + ['missing', 'missing'])[1], 0) for c in cats]
        c3_idx = [self.cat3s.get((c + ['missing', 'missing'])[2], 0) for c in cats]
        
        conds = df['item_condition_id'].fillna(1).astype(int).tolist()
        ships = df['shipping'].fillna(0).astype(int).tolist()
        prices = df['price'].values if 'price' in df.columns else None
        
        return names, descs, brands, c1_idx, c2_idx, c3_idx, conds, ships, prices

class MercariDataset(Dataset):
    def __init__(self, names, descs, brands, c1, c2, c3, conds, ships, prices=None):
        self.names = names
        self.descs = descs
        self.brands = brands
        self.c1 = c1
        self.c2 = c2
        self.c3 = c3
        self.conds = conds
        self.ships = ships
        self.prices = prices
        
    def __len__(self):
        return len(self.names)
        
    def __getitem__(self, idx):
        # 為了效能，標題截斷在前 20 個字，描述截斷在前 100 個字
        name = torch.tensor(self.names[idx][:20] if len(self.names[idx]) > 0 else [0], dtype=torch.long)
        desc = torch.tensor(self.descs[idx][:100] if len(self.descs[idx]) > 0 else [0], dtype=torch.long)
        brand = torch.tensor(self.brands[idx], dtype=torch.long)
        c1 = torch.tensor(self.c1[idx], dtype=torch.long)
        c2 = torch.tensor(self.c2[idx], dtype=torch.long)
        c3 = torch.tensor(self.c3[idx], dtype=torch.long)
        cond = torch.tensor(self.conds[idx], dtype=torch.long)
        ship = torch.tensor(self.ships[idx], dtype=torch.long)
        
        if self.prices is not None:
            import numpy as np
            price = torch.tensor(np.log1p(self.prices[idx]), dtype=torch.float)
            return name, desc, brand, c1, c2, c3, cond, ship, price
        return name, desc, brand, c1, c2, c3, cond, ship

def collate_fn(batch):
    names = pad_sequence([item[0] for item in batch], batch_first=True, padding_value=0)
    descs = pad_sequence([item[1] for item in batch], batch_first=True, padding_value=0)
    
    # 產生給 Transformer 的 Attention Mask (True 代表是補 0 的地方，不要看)
    names_mask = (names == 0)
    descs_mask = (descs == 0)
    
    brands = torch.stack([item[2] for item in batch])
    c1s = torch.stack([item[3] for item in batch])
    c2s = torch.stack([item[4] for item in batch])
    c3s = torch.stack([item[5] for item in batch])
    conds = torch.stack([item[6] for item in batch])
    ships = torch.stack([item[7] for item in batch])
    
    if len(batch[0]) == 9:
        prices = torch.stack([item[8] for item in batch])
        return names, names_mask, descs, descs_mask, brands, c1s, c2s, c3s, conds, ships, prices
    return names, names_mask, descs, descs_mask, brands, c1s, c2s, c3s, conds, ships

if __name__ == '__main__':
    print("Loading original train.tsv...")
    df = pd.read_csv('train.tsv', sep='\t')
    df = df[df['price'] > 0].copy()
    
    print("Splitting dataset (Train 80%, Val 10%, Test 10%)...")
    train_df, temp_df = train_test_split(df, test_size=0.2, random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42)
    
    train_df.to_csv('train_split.tsv', sep='\t', index=False)
    val_df.to_csv('val_split.tsv', sep='\t', index=False)
    test_df.to_csv('test_split.tsv', sep='\t', index=False)
    print("Saved train_split.tsv, val_split.tsv, test_split.tsv")
    
    print("Fitting preprocessor (building custom dictionary)...")
    prep = Preprocessor(min_freq=5)
    prep.fit(train_df)
    
    with open('preprocessor.pkl', 'wb') as f:
        pickle.dump(prep, f)
    print("Saved preprocessor.pkl successfully!")
