import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import Konva from "konva";
import { Node, NodeConfig } from "konva/lib/Node";
import { WidgetKind } from "../Widget";
import { SettingBarProps } from "..";
import useItem from "../../hook/useItem";

export type MaskImageKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  selectedItems: Node<NodeConfig>[];
};

type MaskImageWidgetProps = {
  data: WidgetKind & SettingBarProps
};

const MaskImageWidget: React.FC<MaskImageWidgetProps> = ({ data }) => {
  const [maskPrompt, setMaskPrompt] = useState<string>("");
  const [negativePrompt,setNegativePrompt]= useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { updateItem } = useItem();
  const handleMaskPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaskPrompt(e.target.value);
  };

  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNegativePrompt(e.target.value);
  };

  const generateMaskfromImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("mask_prompt", maskPrompt);
      formData.append("negative_mask_prompt",negativePrompt);
  
      // Get the selected image
      const selectedImageItem = data.selectedItems.find(
        (item: Node<NodeConfig>) => item.attrs["data-item-type"] === "image"
      ) as Konva.Image;
  
      if (selectedImageItem && selectedImageItem.image()) {
        const imageElement = selectedImageItem.image() as HTMLImageElement;
        const response = await fetch(imageElement.src);
        const blob = await response.blob();
  
        // Append the Blob to the FormData
        formData.append("image_file", blob, "image.png");
      }
  
      const response = await fetch("http://0.0.0.0/generate_mask", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const api_response = await response.json();
      console.log(api_response.image_url);
      if (api_response && data.selectedItems) {
        // Update the selected image with the new image from the API response
        const selectedImageItem = data.selectedItems.find(
          (item: Node<NodeConfig>) => item.attrs["data-item-type"] === "image"
        ) as Konva.Image;
  
        if (selectedImageItem) {
          const newImage = new Image();
          newImage.onload = () => {
            selectedImageItem.image(newImage);
            selectedImageItem.getLayer()?.batchDraw();
            updateItem(selectedImageItem.id(), () => ({ ...selectedImageItem.attrs, image: newImage }));
          };
          newImage.src = api_response.inverted_mask_url;
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
          placeholder="Enter mask prompt"
          value={maskPrompt}
          onChange={handleMaskPromptChange}
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
        onClick={generateMaskfromImage}
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

export default MaskImageWidget;