import os
import replicate


from dotenv import load_dotenv
load_dotenv()
REPLICATE_API_TOKEN= os.environ["REPLICATE_API_TOKEN"]
replicate.Client(api_token=REPLICATE_API_TOKEN)
output = replicate.run(
  "schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c",
  input={
    "image": "https://platform.stability.ai/Inpainting-C1.png",
    "mask_prompt": "rocket",
    "adjustment_factor": -25,
    "negative_mask_prompt": "trees"
  }
  )
print("started")
for image in output:
      print(image)