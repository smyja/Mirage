import React, { useState, useEffect } from "react";
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
  const [negativePrompt, setNegativePrompt] = useState<string>("");
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



      if (selectedImages.length >= 2) {

        const firstImageElement = selectedImages[0].image() as HTMLImageElement;
        const secondImageElement = selectedImages[1].image() as HTMLImageElement;

        const firstSrc = firstImageElement.src;
        console.log(firstSrc);
        const secondSrc = secondImageElement.src;
        console.log(secondSrc);
        // Check for mask URL
        if (firstSrc.includes("replicate")) {
          console.log("set mask url");
          setMaskUrl(firstSrc);
        } else if (secondSrc.includes("replicate")) {
          console.log("set mask url");
          setMaskUrl(secondSrc);
        }

        // Check for imageFile
        if (firstSrc.startsWith("data:image")) {
          console.log("present");
          // If the src is a base64 data URL, convert it to a blob
          const response = await fetch(firstSrc);
          const blob = await response.blob();
          setImageFile(blob);
        } else if (secondSrc.startsWith("data:image")) {
          console.log("present");
          // If the src is a base64 data URL, convert it to a blob
          const response = await fetch(secondSrc);
          const blob = await response.blob();
          setImageFile(blob);
        }

        // Check for imageLink
        if (!firstSrc.startsWith("data:image") && !firstSrc.includes("replicate")) {
          console.log("presental");
          // If the src is an external URL, set it as imageLink
          setImageLink(firstSrc);
        } else if (!secondSrc.startsWith("data:image") && !secondSrc.includes("replicate")) {
          console.log("presental");
          // If the src is an external URL, set it as imageLink
          setImageLink(secondSrc);
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
        // Update the selected images with the new image from the API response
        let firstImageElement: HTMLImageElement | undefined;
        let secondImageElement: HTMLImageElement | undefined;

        if (selectedImages.length >= 2) {
          firstImageElement = selectedImages[0].image() as HTMLImageElement;
          secondImageElement = selectedImages[1].image() as HTMLImageElement;
          // rest of your code inside the if block
        }
        for (const selectedImage of selectedImages) {
          let imageElement: HTMLImageElement | undefined;
        
          // Check if the selectedImage is one of the first or second image elements
          if (selectedImage.image() === firstImageElement) {
            imageElement = firstImageElement;
          } else if (selectedImage.image() === secondImageElement) {
            imageElement = secondImageElement;
          }
        
          if (imageElement) {
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
        
              // Break out of the loop after updating the image
              break;
            }
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