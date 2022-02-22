import React from "react";
import NodeEditor from "./NodeEditor";
import { Cube } from "styled-icons/fa-solid/Cube";

export default function SpinningCubeNodeEditor(props) {
  return <NodeEditor {...props} description={SpinningCubeNodeEditor.description} />;
}

SpinningCubeNodeEditor.iconComponent = Cube;

SpinningCubeNodeEditor.description = "It's a cube! And it spins!";
