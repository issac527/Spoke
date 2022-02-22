import React from "react";
import NodeEditor from "./NodeEditor";
import { Cube } from "styled-icons/fa-solid/Cube";
import PropTypes from "prop-types";
import NumericInputGroup from "../inputs/NumericInputGroup";
import useSetPropertySelected from "./useSetPropertySelected";
// Add the following imports
import InputGroup from "../inputs/InputGroup";
import ImageInput from "../inputs/ImageInput";
import AttributionNodeEditor from "./AttributionNodeEditor";

export default function SpinningCubeNodeEditor(props) {
  const { editor, node } = props;
  const onChangeSpeed = useSetPropertySelected(editor, "speed");
  // Here we add the new property setter
  const onChangeTextureSrc = useSetPropertySelected(editor, "textureSrc");

  // ImageGroup shows the label for an input and adds the correct margins
  // ImageInput is another input field type that accepts urls for images.
  // You can drag and drop files or assets from the assets panel into this field.
  // The AttributionNodeEditor lets you add additional attribution info to this object.
  // Since we're allowing the user to set a texture from an unknown source, we need to add this.

  return (
    <NodeEditor {...props} description={SpinningCubeNodeEditor.description}>
      <NumericInputGroup
        name="Speed"
        smallStep={0.1}
        mediumStep={1}
        largeStep={10}
        value={node.speed}
        onChange={onChangeSpeed}
        unit="°/s"
      />
      <InputGroup name="Texture Url">
        <ImageInput value={node.textureSrc} onChange={onChangeTextureSrc} />
      </InputGroup>
      <AttributionNodeEditor name="Attribution" {...props} />
    </NodeEditor>
  );
}

SpinningCubeNodeEditor.iconComponent = Cube;

SpinningCubeNodeEditor.description = "It's a cube! And it spins!";

SpinningCubeNodeEditor.propTypes = {
  editor: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired
};
