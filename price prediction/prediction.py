import tkinter as tk
from tkinter import ttk, messagebox
import torch
import numpy as np
import pandas as pd
import pickle

from preprocess import Preprocessor, MercariDataset, collate_fn
from train import MercariCNNModel

class MercariPredictorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("AI 二手商品估價神器 (純手工 Transformer 版)")
        self.root.geometry("450x550")
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.base_dir = '/content/drive/MyDrive/price/' if self.device.type == 'cuda' else './'
        self.load_model()
        
        self.create_widgets()

    def load_model(self):
        try:
            with open(f'{self.base_dir}preprocessor.pkl', 'rb') as f:
                self.prep = pickle.load(f)
                
            self.model = MercariCNNModel(
        vocab_size=len(self.prep.vocab),
        brand_size=len(self.prep.brands),
        c1_size=len(self.prep.cat1s),
        c2_size=len(self.prep.cat2s),
        c3_size=len(self.prep.cat3s)
    ).to(self.device)
            
            self.model.load_state_dict(torch.load(f'{self.base_dir}model.pth', map_location=self.device))
            self.model.eval()
            
        except Exception as e:
            messagebox.showerror("載入失敗", f"請確定已執行過 preprocess.py 和 train.py！\n錯誤: {str(e)}")
            self.root.destroy()

    def create_widgets(self):
        style = ttk.Style()
        style.configure('TLabel', font=('Arial', 12))
        style.configure('TButton', font=('Arial', 12, 'bold'))

        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="商品名稱 (Name):").pack(anchor=tk.W, pady=(0, 5))
        self.name_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.name_var, width=40).pack(fill=tk.X, pady=(0, 10))

        ttk.Label(main_frame, text="品牌 (Brand):").pack(anchor=tk.W, pady=(0, 5))
        self.brand_var = tk.StringVar(value="missing")
        ttk.Entry(main_frame, textvariable=self.brand_var, width=40).pack(fill=tk.X, pady=(0, 10))

        ttk.Label(main_frame, text="分類 (例: Men/Shoes/Sneakers):").pack(anchor=tk.W, pady=(0, 5))
        self.cat_var = tk.StringVar(value="missing/missing/missing")
        ttk.Entry(main_frame, textvariable=self.cat_var, width=40).pack(fill=tk.X, pady=(0, 10))

        ttk.Label(main_frame, text="商品狀況 (1~5，1為最新):").pack(anchor=tk.W, pady=(0, 5))
        self.cond_var = tk.IntVar(value=1)
        cond_combo = ttk.Combobox(main_frame, textvariable=self.cond_var, values=[1,2,3,4,5], state="readonly")
        cond_combo.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(main_frame, text="運費支付方式:").pack(anchor=tk.W, pady=(0, 5))
        self.ship_var_str = tk.StringVar(value="賣家付/免運")
        ship_combo = ttk.Combobox(main_frame, textvariable=self.ship_var_str, values=["買家付運費", "賣家付/免運"], state="readonly")
        ship_combo.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(main_frame, text="商品描述 (Description):").pack(anchor=tk.W, pady=(0, 5))
        self.desc_text = tk.Text(main_frame, height=5, width=40)
        self.desc_text.pack(fill=tk.X, pady=(0, 15))

        predict_btn = ttk.Button(main_frame, text="開始估價 💰", command=self.predict_price)
        predict_btn.pack(fill=tk.X, pady=10)

        self.result_label = ttk.Label(main_frame, text="建議售價: $0.00", font=('Arial', 18, 'bold'), foreground='blue')
        self.result_label.pack(pady=10)

    def predict_price(self):
        name = self.name_var.get().strip()
        if not name:
            messagebox.showwarning("警告", "商品名稱不能為空！")
            return
            
        brand = self.brand_var.get().strip()
        cat = self.cat_var.get().strip()
        cond = self.cond_var.get()
        desc = self.desc_text.get("1.0", tk.END).strip()
        shipping = 1 if self.ship_var_str.get() == "賣家付/免運" else 0

        my_item = pd.DataFrame([{
            'name': name,
            'item_description': desc,
            'brand_name': brand,
            'category_name': cat,
            'item_condition_id': cond,
            'shipping': shipping
        }])

        test_data = self.prep.transform(my_item)
        test_ds = MercariDataset(*test_data)
        
        batch = collate_fn([test_ds[0]])
        batch = [b.to(self.device) for b in batch]

        with torch.no_grad():
            output_log = self.model(*batch)
            predicted_price = np.expm1(output_log.item())

        self.result_label.config(text=f"建議售價: ${predicted_price:.2f} (美金)")

if __name__ == '__main__':
    root = tk.Tk()
    app = MercariPredictorApp(root)
    root.mainloop()
