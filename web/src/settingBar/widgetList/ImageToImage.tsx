import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import Konva from "konva";
import { Node, NodeConfig } from "konva/lib/Node";
import { WidgetKind } from "../Widget";
import { SettingBarProps } from "..";
import useItem from "../../hook/useItem";

export type Image2ImageKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  selectedItems: Node<NodeConfig>[];
};

type Image2ImageWidgetProps = {
  data: WidgetKind & SettingBarProps
};

const Image2ImageWidget: React.FC<Image2ImageWidgetProps> = ({ data }) => {
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { updateItem } = useItem();
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextPrompt(e.target.value);
  };

  const generateImagefromImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("prompt", textPrompt);
  
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
  
      const response = await fetch("http://0.0.0.0/generate_image_from_file", {
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

export default Image2ImageWidget;