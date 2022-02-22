import React from "react";
import NodeEditor from "./NodeEditor";
import { Cube } from "styled-icons/fa-solid/Cube";
// Add the following imports
import PropTypes from "prop-types";
import NumericInputGroup from "../inputs/NumericInputGroup";
import useSetPropertySelected from "./useSetPropertySelected";

export default function SpinningCubeNodeEditor(props) {
  // We're passing all of the props to NodeEditor, but we also want to pull out editor and node.
  const { editor, node } = props;
  // useSetPropertySelected is a hook that can be used to set the specified properties on the selected objects.
  const onChangeSpeed = useSetPropertySelected(editor, "speed");

  // Here's a rundown of the NumericInputGroup props:
  // name: The input label
  // smallStep: How much the value adjusts when you hold ctrl + up/down arrows
  // mediumStep: How much the value adjusts when you press the up/down arrows
  // largeStep: How much the value adjusts when you hold shift + up/down arrows
  // value: The speed property of the current active node (last selected)
  // onChange: The setter from above
  // unit: Show the correct units to the user

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
    </NodeEditor>
  );
}

SpinningCubeNodeEditor.iconComponent = Cube;

SpinningCubeNodeEditor.description = "It's a cube! And it spins!!!";

// Make eslint happy with some prop types.
SpinningCubeNodeEditor.propTypes = {
  editor: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired
};
