#!/usr/bin/env python
import os
import sys
import shutil
import argparse
import time

# Ensure repo root is in sys.path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from test import Model, forensics_test, rm_and_make_dir, merge

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input image')
    args = parser.parse_args()

    src = args.image
    # Prepare input directory
    input_dir = os.path.join(ROOT, 'data', 'input')
    rm_and_make_dir(input_dir)

    # Copy the image into data/input
    base = os.path.basename(src)
    dst = os.path.join(input_dir, base)
    shutil.copyfile(src, dst)

    # Load model and run forensics_test
    model = Model()
    model.load()
    model.eval()

    # Run inference
    forensics_test(model)

    # Output image should be in data/output/<basename_without_ext>.png
    name_noext = os.path.splitext(base)[0]
    out_path = os.path.join(ROOT, 'data', 'output', name_noext + '.png')

    # Wait briefly for file to appear
    timeout = 10
    waited = 0
    while not os.path.exists(out_path) and waited < timeout:
        time.sleep(0.5)
        waited += 0.5

    if not os.path.exists(out_path):
        print('ERROR: output not found', file=sys.stderr)
        sys.exit(2)

    # Print the output path so caller can read it
    print(out_path)

if __name__ == '__main__':
    main()
