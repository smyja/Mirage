import os
import replicate
import requests
from io import BytesIO
from PIL import Image
from torchvision.transforms import GaussianBlur
from dotenv import load_dotenv
load_dotenv()
# REPLICATE_API_TOKEN= os.environ["REPLICATE_API_TOKEN"]
# replicate.Client(api_token=REPLICATE_API_TOKEN)
# output = replicate.run(
#   "schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c",
#   input={
#     "image": "https://platform.stability.ai/Inpainting-C1.png",
#     "mask_prompt": "rocket",
#     "adjustment_factor": -25,
#     "negative_mask_prompt": "trees"
#   }
#   )
# print("started")
# for image in output:
#       print(image)

url = 'https://replicate.delivery/pbxt/gF95zZVnfelbNkBK0PasgYt7lg1OuIa13XtU0lth42ClHD8RA/inverted_mask.jpg'

# Download the image using requests
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Open the image using Pillow
    mask_i = Image.open(BytesIO(response.content))
    blur = GaussianBlur(11,20)
    mask = blur(mask_i)
    print(mask)
else:
    print(f"Failed to download image. Status code: {response.status_code}")
