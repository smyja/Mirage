import React, { useState,useEffect} from "react";
import { Form, Button } from "react-bootstrap";
import Konva from "konva";
import { Node, NodeConfig } from "konva/lib/Node";
import { WidgetKind } from "../Widget";
import { SettingBarProps } from "..";
import useItem from "../../hook/useItem";
import { useDispatch } from "react-redux";
import { stageDataAction } from "../../redux/currentStageData";

export type InpaintingKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  selectedItems: Node<NodeConfig>[];
};

type InpaintingWidgetProps = {
  data: WidgetKind & SettingBarProps
};

const InpaintingWidget: React.FC<InpaintingWidgetProps> = ({ data }) => {
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [negativePrompt,setNegativePrompt]= useState<string>("");
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [imageLink, setImageLink] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextPrompt(e.target.value);
  };
  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNegativePrompt(e.target.value);
  };
  const dispatch = useDispatch();
  const generateImagefromImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("mask_prompt", textPrompt);
      formData.append("negative_mask_prompt", negativePrompt);

      // Get the selected images
      const selectedImages = data.selectedItems.filter(
        (item: Node<NodeConfig>) => item.attrs["data-item-type"] === "image"
      ) as Konva.Image[];
      console.log(selectedImages);
      
      for (const selectedImage of selectedImages) {
        const imageElement = selectedImage.image() as HTMLImageElement;
        const src = imageElement.src;
      
        if (src.includes("mask") && !maskUrl) {
          console.log("set mask url");
          setMaskUrl(src);
        } else if (!imageFile && !imageLink && !src.includes("replicate") && !src.includes("mask")) {
          if (src.startsWith("data:image")) {
            console.log("present");
            // If the src is a base64 data URL, convert it to a blob
            const response = await fetch(src);
            const blob = await response.blob();
            setImageFile(blob);
          } else {
            console.log("presental");
            // If the src is an external URL, set it as imageLink
            setImageLink(src);
          }
        }
      }
      
      // Append to formData after the loop
      if (maskUrl) {
        formData.append("mask_url", maskUrl);
      }
      if (imageFile) {
        formData.append("image_file", imageFile, "image.png");
      }
      if (imageLink) {
        formData.append("image_link", imageLink);
      }

      const response = await fetch("https://mirage.mirage.humanise.app/inpainting", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const api_response = await response.json();
      console.log(api_response.inpainting_url);
      if (api_response && data.selectedItems) {
        // Update the selected images with the new image from the API response
        for (const selectedImage of selectedImages) {
          const imageElement = selectedImage.image() as HTMLImageElement;
          const src = imageElement.src;
      
          // Check if "mask" is in the src of the selectedImage
          if (src.includes("mask")) {
            const newImage = new Image();
            newImage.onload = () => {
              selectedImage.image(newImage);
              selectedImage.getLayer()?.batchDraw();
              console.log(selectedImage.id());
              dispatch(stageDataAction.updateItem({
                id: selectedImage.id(),
                attrs: { ...selectedImage.attrs, image: newImage, src: api_response.inpainting_url },
                className: selectedImage.className,
              }));
            };
            newImage.src = api_response.inpainting_url;
          }
        }
      }
    } catch (error: any) {
      setError(error.message);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form>
      <Form.Group controlId="textPrompt">
        <Form.Control
          type="text"
          placeholder="Enter text prompt"
          value={textPrompt}
          onChange={handleTextChange}
          style={{ marginBottom: 10 }}
        />
        <Form.Control
          type="text"
          placeholder="Enter negative prompt"
          value={negativePrompt}
          onChange={handleNegativePromptChange}
          style={{ marginBottom: 10 }}
        />        
      </Form.Group>
      <Button
        variant="primary"
        onClick={generateImagefromImage}
        size="sm"
        style={{ marginBottom: 10 }}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Generate"}
      </Button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </Form>
  );
};

export default InpaintingWidget;