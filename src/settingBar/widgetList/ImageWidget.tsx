import React, { useState } from "react";
import { Button, Col, Figure, Row, Form, Spinner,Modal } from "react-bootstrap";
import { nanoid } from "nanoid";
import presetImageList from "../../config/image.json";
import { ImageItemKind } from "../../view/object/image";
import colorStyles from "../../style/color.module.css";
import borderStyles from "../../style/border.module.css";
import sizeStyles from "../../style/size.module.css";
import spaceStyles from "../../style/space.module.css";
import displayStyles from "../../style/display.module.css";
import alignStyles from "../../style/align.module.css";
import fontStyles from "../../style/font.module.css";
import Drag from "../../util/Drag";
import TRIGGER from "../../config/trigger";
import useImageAsset from "../../hook/useImageAsset";
import useI18n from "../../hook/usei18n";

export const IMAGE_LIST_KEY = "importedImage";

const ImageWidget: React.FC = () => {
  const { setImageAsset, getAllImageAsset } = useImageAsset();
  const { getTranslation } = useI18n();
  const [imageAssetList, setImageAssetList] = useState(() => {
    if (getAllImageAsset().length) {
      return [...getAllImageAsset()!];
    }
    setImageAsset(presetImageList);
    return [...presetImageList];
  });
  const [loading, setLoading] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [showGeneratedImage, setShowGeneratedImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);


  const uploadImage = () => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setImageAssetList((prev) => {
        const result = [
          {
            type: "image",
            id: nanoid(),
            name: "imported image",
            src: fileReader.result as string,
          },
          
          ...prev,
        ];
        setImageAsset(result);
        return result;
      });
    };
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/png, image/jpeg";
    file.onchange = (e) => {
      const event = e;
      if (event.target && (event.target as HTMLInputElement).files) {
        Object.values((event.target as HTMLInputElement).files!).forEach((file) => {
          fileReader.readAsDataURL(file);
        });
      }
    };
    file.click();
  };
  const generateImage = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://0.0.0.0:80/generate_image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setGeneratedImageUrl(data.image_url);
      setImageAssetList((prev) => [
        {
          type: "image",
          id: nanoid(),
          name: "generated image",
          src: data.image_url,
        },
        ...prev,
      ]);
      setShowGeneratedImage(true);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextPrompt(event.target.value);
  };


  return (
    <Col className={[sizeStyles["mx-h-30vh"]].join(" ")}>
      <Row>
        <h6>
          {getTranslation("widget", "image", "name")}
          <Button
            className={[
              colorStyles.transparentDarkColorTheme,
              borderStyles.none,
              displayStyles["inline-block"],
              sizeStyles.width25,
              spaceStyles.p0,
              spaceStyles.ml1rem,
              alignStyles["text-left"],
            ].join(" ")}
            onClick={uploadImage}
          >
            upload
          </Button>
        </h6>
      </Row>
      <Row xs={2}>
        <Form>
          <Form.Group controlId="textPrompt">
            <Form.Control
              type="text"
              placeholder="Enter text prompt"
              value={textPrompt}
              onChange={handleTextChange}
            />
          </Form.Group>
          <Button
            variant="primary"
            onClick={generateImage}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                Generating Image...
              </>
            ) : (
              "Generate Image"
            )}
          </Button>
        </Form>
        {imageAssetList.map((_data) => (
          <ImageThumbnail
            key={`image-thumbnail-${_data.id}`}
            data={{
              id: _data.id,
              src: _data.src ?? `find:${_data.id}`,
              name: _data.name,
              "data-item-type": _data.type,
            }}
            maxPx={80}
          />
        ))}
      </Row>
    </Col>
  );
};

export default ImageWidget;

const ImageThumbnail: React.FC<{
  maxPx: number;
  data: Omit<ImageItemKind, "image">;
}> = ({ data: { id, ...data }, maxPx }) => {
  const { getImageAssetSrc } = useImageAsset();
  const isGeneratedImage = data.src || data.src.startsWith("http");
  return (
    <Figure as={Col} className={[alignStyles.absoluteCenter, alignStyles.wrapTrue].join(" ")}>
      <Drag
        dragType="copyMove"
        dragSrc={{
          trigger: TRIGGER.INSERT.IMAGE,
          "data-item-type": data["data-item-type"],
          src: isGeneratedImage ? data.src : getImageAssetSrc(id),

        }}
        key={isGeneratedImage ? `generated-image-${id}` : `image-${id}`} // Unique key for each Drag component
      >
        {isGeneratedImage && data.src ? (
          <Figure.Image
            alt={data.name}
            src={data.src}
          />
        ) : null}
      </Drag>
      <Figure.Caption
        className={[fontStyles.font075em, sizeStyles.width100, "text-center"].join(" ")}>
        {data.name}
      </Figure.Caption>
    </Figure>
  );
};
