import React, { useState } from "react";
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

      for (const selectedImage of selectedImages) {
        const imageElement = selectedImage.image() as HTMLImageElement;
        const src = imageElement.src;

        if (src.startsWith("data:image")) {
          // If the src is a base64 data URL, convert it to a blob
          const response = await fetch(src);
          const blob = await response.blob();
          formData.append("image_file", blob, "image.png");
        } else {
          // If the src is an external URL, append it as a string
          formData.append("mask_url", src);
        }
      }

      const response = await fetch("http://0.0.0.0/inpainting", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const api_response = await response.json();
      console.log(api_response.image_url);
      if (api_response && data.selectedItems) {
        // Update the selected images with the new image from the API response
        for (const selectedImage of selectedImages) {
          const newImage = new Image();
          newImage.onload = () => {
            selectedImage.image(newImage);
            selectedImage.getLayer()?.batchDraw();
            console.log(selectedImage.id());
            dispatch(stageDataAction.updateItem({
              id: selectedImage.id(),
              attrs: { ...selectedImage.attrs, image: newImage, src: api_response.image_url },
              className: selectedImage.className,
            }));
          };
          newImage.src = api_response.image_url;
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