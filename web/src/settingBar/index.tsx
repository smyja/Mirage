import React from "react";
import { Accordion } from "react-bootstrap";
import { Node, NodeConfig } from "konva/lib/Node";
import Widget, { WidgetKind } from "./Widget";
import widgetList from "../config/widget.json";
import FrameWidget from "./widgetList/FrameWidget";
import ImageWidget from "./widgetList/ImageWidget";
import ColorPaletteWidget from "./widgetList/ColorPaletteWidget";
import TextWidget from "./widgetList/TextWidget";
import AlignWidget from "./widgetList/AlignWidget";
import ExportWidget from "./widgetList/ExportWidget";
import useSelection from "../hook/useSelection";
import useStage from "../hook/useStage";
import ShapeWidget from "./widgetList/ShapeWidget";
import IconWidget from "./widgetList/IconWidget";
import LineWidget from "./widgetList/LineWidget";
import GenCopyWidget from "./widgetList/GenCopyWidget";
import Image2ImageWidget from "./widgetList/ImageToImageWidget";
import MaskImageWidget from "./widgetList/MaskImageWidget";
import InpaintingWidget from "./widgetList/InpaintingWidget";

export type SettingBarProps = {
  selectedItems: Node<NodeConfig>[];
  clearSelection: ReturnType<typeof useSelection>["clearSelection"];
  stageRef: ReturnType<typeof useStage>["stageRef"];
};

const Widgets = {
  colorPalette: (data: WidgetKind & SettingBarProps) => <ColorPaletteWidget data={data} />,
  align: (data: WidgetKind & SettingBarProps) => <AlignWidget data={data} />,
  image: (data: WidgetKind & SettingBarProps) => <ImageWidget />,
  frame: (data: WidgetKind & SettingBarProps) => <FrameWidget />,
  shape: (data: WidgetKind & SettingBarProps) => <ShapeWidget />,
  text: (data: WidgetKind & SettingBarProps) => <TextWidget />,
  line: (data: WidgetKind & SettingBarProps) => <LineWidget />,
  gencopy: (data: WidgetKind & SettingBarProps) => <GenCopyWidget data={data}/>,
  image2image: (data: WidgetKind & SettingBarProps) => <Image2ImageWidget data={data}/>,
  maskimage: (data: WidgetKind & SettingBarProps) => <MaskImageWidget data={data}/>,
  inpainting: (data: WidgetKind & SettingBarProps) => <InpaintingWidget data={data}/>,
  icon: (data: WidgetKind & SettingBarProps) => <IconWidget />,
  export: (data: WidgetKind & SettingBarProps) => <ExportWidget data={data} />,
};

export type WidgetIDList = keyof typeof Widgets;

const SettingBar: React.FC<SettingBarProps> = (settingProps) => (
  <aside>
    <Accordion>
      {(widgetList as WidgetKind[]).map((data) => (
        <Widget key={`widget-${data.id}`} data={{ ...data, ...settingProps }}>
          {Widgets[data.id] && Widgets[data.id]({ ...data, ...settingProps })}
        </Widget>
      ))}
    </Accordion>
  </aside>
);

export default SettingBar;
