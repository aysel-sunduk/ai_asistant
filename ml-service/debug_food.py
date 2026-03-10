
import io
import time
from app.models.food_analyzer import analyzer
import os

def test():
    print("Testing food analyzer...")
    # Load model if not initialized
    if not analyzer.initialized:
        print("Initializing model...")
        base_path = "food-calorie-estimator/checkpoints"
        m_path = os.path.join(base_path, "best_model.pth")
        n_path = os.path.join(base_path, "normalizer.npy")
        analyzer.initialize(m_path, n_path)
    
    # Use a test image
    test_img = "food-calorie-estimator/checkpoints/test1.jpg"
    if not os.path.exists(test_img):
        print(f"Test image not found: {test_img}")
        return

    with open(test_img, "rb") as f:
        img_bytes = io.BytesIO(f.read())
    
    start = time.time()
    print("Starting analysis...")
    result = analyzer.analyze(img_bytes)
    end = time.time()
    
    print(f"Result: {result}")
    print(f"Time taken: {end - start:.2f}s")

if __name__ == "__main__":
    test()
