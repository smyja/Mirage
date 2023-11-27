import os
import replicate
import requests
from io import BytesIO
from PIL import Image
from torchvision.transforms import GaussianBlur
from dotenv import load_dotenv
load_dotenv()
REPLICATE_API_TOKEN= os.environ["REPLICATE_API_TOKEN"]
replicate.Client(api_token=REPLICATE_API_TOKEN)
output = replicate.run(
  "subscriptions10x/sdxl-inpainting:733bba9bba10b10225a23aae8d62a6d9752f3e89471c2650ec61e50c8c69fb23",
  input={
    "image": "https://replicate.delivery/pbxt/JTvN42RZrXZYc1ud4J1cCD1VQMJnENdRz4AGZ3XjiK4Lxpsg/9a0a1b126a676fb498f81da99c8dffe894ebfe28.png",
    "prompt": "modern bed with beige sheet and pillows",
    "n_prompt": "painting",
    "mask_image": "https://replicate.delivery/pbxt/JTvN4KptGqnSDtv3vaeiuMrNoODjUbgSbymY2wK7RFvcXxM1/465174ce5fa1120c42d2885789ebba0a2386d14d.png"
  }
)
print(output[0])

# Extract the link from the list





# url = 'https://replicate.delivery/pbxt/gF95zZVnfelbNkBK0PasgYt7lg1OuIa13XtU0lth42ClHD8RA/inverted_mask.jpg'

# # Download the image using requests
# response = requests.get(url)

# # Check if the request was successful
# if response.status_code == 200:
#     # Open the image using Pillow
#     mask_i = Image.open(BytesIO(response.content))
#     blur = GaussianBlur(11,20)
#     mask = blur(mask_i)
#     print(mask)
# else:
#     print(f"Failed to download image. Status code: {response.status_code}")
