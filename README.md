# Mirage 
Mirage is a browser-based interface design tool that is powered by Stability-AI and Fixie for generating images and texts.

![preview](images/gentext.png)
## ✨ Features

- Includes complete front-end and back-end code.
- Support deployment both locally and in the cloud.
- Fully based on open source and can be used for commercial purposes.
- Mask prompting based on Grounding DINO & Segment Anything.
- Image Generation with Stability API
- Image to Image

### Inpainting
To change an object in an Image, Grounded dino and Segment anything is used to segment and mask the object. Specify the object you want and the object you dont want and mask. Once you are done with masking, select both items and specify what you want to replace your masked image with. 
![preview](images/segment.png)
## 
![preview](images/inpainting.png)

## 📦 Installation

```bash
cd web
```
Once you have changed directory,install the packages

```bash
npm install # web

```

## ⌨️ Server setup

```bash
cd  server # web

```

```bash
pip install -r requirements.txt  # web

```
```
bash runserver.sh
```

## 🔗 Built with
- Stabilty AI
- Fixie
- FastAPI
- React