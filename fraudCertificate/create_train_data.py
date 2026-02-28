import numpy as np

# Create training data pairs using available files
train_data = [
    ('data/input/test_01_facebook.jpg', 'data/output/test_01_facebook.png'),
    ('data/input/test_01_original.tif', 'data/output/test_01_original.png'),
    ('data/input/test_01_wechat.jpg', 'data/output/test_01_wechat.png'),
    ('data/input/test_01_weibo.jpg', 'data/output/test_01_weibo.png'),
]

# Save as numpy array
np.save('data/train.npy', train_data)
print("Created train.npy with", len(train_data), "samples")