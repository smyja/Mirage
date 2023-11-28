import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import Konva from "konva";
import { Node, NodeConfig } from "konva/lib/Node";
import { WidgetKind } from "../Widget";
import { SettingBarProps } from "..";

export type GenCopyKind = {
  "data-item-type": string;
  id: string;
  icon: string;
  selectedItems: Node<NodeConfig>[];
};

type GenCopyWidgetProps = {
  data: WidgetKind & SettingBarProps
};

const GenCopyWidget: React.FC<GenCopyWidgetProps> = ({ data }) => {
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextPrompt(e.target.value);
  };

  const generateProductCopy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("https://mirage.mirage.humanise.app/create_copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textPrompt }),
      });


      const api_response = await response.json();
      console.log(api_response.status);
      if (api_response.status === "success" && data.selectedItems) {
        const selectedTextItem = data.selectedItems.find(
          (item: Node<NodeConfig>) => item.attrs["data-item-type"] === "text"
        ) as Konva.Text;

        if (selectedTextItem) {
          selectedTextItem.text(api_response.response);
          
          // Adjust the width of the text node to fit the new text
          const textWidth = selectedTextItem.getTextWidth();
          selectedTextItem.height(500);
          selectedTextItem.width(400);
          selectedTextItem.wrap("char");
          selectedTextItem.getLayer()?.batchDraw();
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
        onClick={generateProductCopy}
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

export default GenCopyWidget;