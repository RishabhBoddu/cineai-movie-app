import os
import zipfile
import urllib.request
import ssl

def download_movielens_dataset():
    dataset_url = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
    dest_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(dest_dir, "ml-latest-small.zip")
    extract_path = dest_dir

    print(f"Downloading dataset from {dataset_url}...")
    
    # Handle potential SSL certificate verification errors
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(dataset_url, context=ctx) as response, open(zip_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print("Download complete.")
    except Exception as e:
        print(f"Failed to download using urllib with custom SSL context: {e}")
        print("Attempting standard download...")
        try:
            urllib.request.urlretrieve(dataset_url, zip_path)
            print("Download complete.")
        except Exception as err:
            print(f"Failed to download dataset: {err}")
            return False

    print(f"Extracting zip archive to {extract_path}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print("Extraction complete.")
        
        # Clean up zip file
        os.remove(zip_path)
        print("Temporary zip file cleaned up.")
        return True
    except Exception as e:
        print(f"Failed to extract zip file: {e}")
        return False

if __name__ == "__main__":
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    success = download_movielens_dataset()
    if success:
        print("Dataset setup successful.")
    else:
        print("Dataset setup failed.")
        exit(1)
