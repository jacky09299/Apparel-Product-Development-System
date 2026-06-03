import torch
import json
import pickle
import sys
from train import MercariCNNModel
from preprocess import Preprocessor

def main():
    device = torch.device('cpu')
    print("Loading preprocessor...")
    with open('preprocessor.pkl', 'rb') as f:
        prep = pickle.load(f)

    # Save to JSON
    print("Saving preprocessor to JSON...")
    prep_data = {
        'vocab': prep.vocab,
        'brands': prep.brands,
        'cat1s': prep.cat1s,
        'cat2s': prep.cat2s,
        'cat3s': prep.cat3s
    }
    with open('../public/preprocessor.json', 'w', encoding='utf-8') as f:
        json.dump(prep_data, f, ensure_ascii=False)

    print("Loading model...")
    model = MercariCNNModel(
        vocab_size=len(prep.vocab),
        brand_size=len(prep.brands),
        c1_size=len(prep.cat1s),
        c2_size=len(prep.cat2s),
        c3_size=len(prep.cat3s)
    ).to(device)
    model.load_state_dict(torch.load('model.pth', map_location=device))
    model.eval()

    print("Exporting to ONNX...")
    # Dummy inputs (batch_size=1)
    name = torch.zeros((1, 20), dtype=torch.long)
    name_mask = torch.zeros((1, 20), dtype=torch.bool)
    desc = torch.zeros((1, 100), dtype=torch.long)
    desc_mask = torch.zeros((1, 100), dtype=torch.bool)
    brand = torch.zeros((1,), dtype=torch.long)
    c1 = torch.zeros((1,), dtype=torch.long)
    c2 = torch.zeros((1,), dtype=torch.long)
    c3 = torch.zeros((1,), dtype=torch.long)
    cond = torch.zeros((1,), dtype=torch.long)
    ship = torch.zeros((1,), dtype=torch.long)

    torch.onnx.export(
        model, 
        (name, name_mask, desc, desc_mask, brand, c1, c2, c3, cond, ship), 
        "../public/price_model.onnx",
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['name', 'name_mask', 'desc', 'desc_mask', 'brand', 'c1', 'c2', 'c3', 'cond', 'ship'],
        output_names=['output'],
        dynamic_axes={
            'name': {0: 'batch_size', 1: 'name_len'},
            'name_mask': {0: 'batch_size', 1: 'name_len'},
            'desc': {0: 'batch_size', 1: 'desc_len'},
            'desc_mask': {0: 'batch_size', 1: 'desc_len'},
            'brand': {0: 'batch_size'},
            'c1': {0: 'batch_size'},
            'c2': {0: 'batch_size'},
            'c3': {0: 'batch_size'},
            'cond': {0: 'batch_size'},
            'ship': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print("Export successful!")

if __name__ == "__main__":
    main()
