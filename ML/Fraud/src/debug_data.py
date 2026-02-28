"""
Debug script to test data loading
"""
import os
import sys
sys.path.append(os.path.dirname(__file__))

from data_loader import CertificateDataLoader

def test_data_loading():
    print("Testing data loader...")
    
    data_dir = '../data'
    print(f"Checking directory: {data_dir}")
    
    if not os.path.exists(data_dir):
        print(f"Directory {data_dir} does not exist!")
        return
    
    files = os.listdir(data_dir)
    print(f"Files found: {files}")
    
    jpg_files = [f for f in files if f.endswith('.jpg')]
    json_files = [f for f in files if f.endswith('.json')]
    
    print(f"JPG files: {len(jpg_files)}")
    print(f"JSON files: {len(json_files)}")
    
    try:
        data_loader = CertificateDataLoader(data_dir)
        print("Data loader created successfully")
        
        images, texts, metadata, labels = data_loader.load_dataset()
        print(f"Loaded {len(images)} images, {len(texts)} texts, {len(metadata)} metadata, {len(labels)} labels")
        
        if len(images) > 0:
            print("First image shape:", images[0].shape if images[0] is not None else "None")
            print("First text preview:", texts[0][:50] if texts[0] else "Empty")
            print("First metadata:", metadata[0])
            print("First label:", labels[0])
        
    except Exception as e:
        print(f"Error during data loading: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_data_loading()