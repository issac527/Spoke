// Note we'll need to import the Math class from three, but it conflicts with the browser's Math class so we'll map it to MathUtils
import { Mesh, MeshBasicMaterial, BoxBufferGeometry, Euler, Math as MathUtils } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class SpinningCubeNode extends EditorNodeMixin(Mesh) {
  static componentName = "spinning-cube";

  static nodeName = "Spinning Cube";

  // When we load the Spoke project we need to load this new speed property, so we'll need a custom deserialize function.
  static async deserialize(editor, json) {
    // The default deserializer will set the transform, name, visibility, and other basic properties.
    const node = await super.deserialize(editor, json);

    // json will be the entity object in the Spoke project and components will be an array of the form:
    // { name: "spinning-cube", props: { speed: 10 } }

    const { speed } = json.components.find(c => c.name === SpinningCubeNode.componentName).props;

    // We'll set the object's speed property and default to 10 deg/s if it's undefined.
    node.speed = speed === undefined ? 10 : speed;

    return node;
  }

  constructor(editor) {
    super(editor, new BoxBufferGeometry(), new MeshBasicMaterial());

    // We'll set the default speed to rotate 10 degrees every second.
    this.speed = 10;

    this.originalRotation = new Euler();
  }

  onPlay() {
    this.originalRotation.copy(this.rotation);
  }

  onUpdate(dt) {
    if (this.editor.playing) {
      // Now we can use the speed property
      // Note: rotation.y is in radians so we'll need to convert from degrees to radians
      this.rotation.y += dt * MathUtils.degToRad(this.speed);
    }
  }

  onPause() {
    this.rotation.copy(this.originalRotation);
  }

  serialize() {
    return super.serialize({
      [SpinningCubeNode.componentName]: {
        // We need to serialize this new property to the Spoke project.
        // The contents of this object will get set on the entity's "spinning-node" component
        // { name: "spinning-cube", props: { speed: <speed> } }
        speed: this.speed
      }
    });
  }
}
