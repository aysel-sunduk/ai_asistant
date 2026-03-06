import torch
ckpt = torch.load('d:/Downloads/Ai_asistan/ml-service/food-calorie-estimator/checkpoints/best_model.pth', map_location='cpu')
print(f"Epoch: {ckpt.get('epoch', 'N/A')}")
print(f"Val Loss: {ckpt.get('val_loss', 'N/A')}")
