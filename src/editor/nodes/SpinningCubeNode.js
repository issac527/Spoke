import { Mesh, MeshBasicMaterial, BoxBufferGeometry } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class SpinningCubeNode extends EditorNodeMixin(Mesh) {
  static componentName = "spinning-cube";

  static nodeName = "Spinning Cube";

  constructor(editor) {
    super(editor, new BoxBufferGeometry(), new MeshBasicMaterial());
  }

  serialize() {
    return super.serialize({
      [SpinningCubeNode.componentName]: {}
    });
  }
}
