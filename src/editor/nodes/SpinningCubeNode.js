import { Mesh, MeshBasicMaterial, BoxBufferGeometry, Euler, Math as MathUtils } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues, maybeAddLargeFileIssue } from "../utils/performance";

export default class SpinningCubeNode extends EditorNodeMixin(Mesh) {
  static componentName = "spinning-cube";

  static nodeName = "Spinning Cube";

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const { speed, textureSrc } = json.components.find(c => c.name === SpinningCubeNode.componentName).props;

    node.speed = speed === undefined ? 10 : speed;

    loadAsync(
      (async () => {
        await node.loadTexture(textureSrc, onError);
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor, new BoxBufferGeometry(), new MeshBasicMaterial());
    this._textureSrc = "";
    this.speed = 10;
    this.originalRotation = new Euler();
  }

  get textureSrc() {
    return this._textureSrc;
  }

  set textureSrc(value) {
    this.loadTexture(value).catch(console.error);
  }

  async loadTexture(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._textureSrc) {
      return;
    }

    this._textureSrc = nextSrc;
    this.issues = [];

    try {
      const { accessibleUrl, meta } = await this.editor.api.resolveMedia(nextSrc);

      this.meta = meta;

      this.updateAttribution();

      const texture = await this.editor.textureCache.get(accessibleUrl);

      this.material.map = texture;
      this.material.needsUpdate = true;

      this.issues = getObjectPerfIssues(this, false);

      const perfEntries = performance.getEntriesByName(accessibleUrl);

      if (perfEntries.length > 0) {
        const imageSize = perfEntries[0].encodedBodySize;
        maybeAddLargeFileIssue("image", imageSize, this.issues);
      }
    } catch (error) {
      const textureError = new RethrownError(`Error loading texture ${this._textureSrc}`, error);

      if (onError) {
        onError(this, textureError);
      }

      console.error(textureError);

      this.issues.push({ severity: "error", message: "Error loading texture." });
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");

    return this;
  }

  onPlay() {
    this.originalRotation.copy(this.rotation);
  }

  onUpdate(dt) {
    if (this.editor.playing) {
      this.rotation.y += dt * MathUtils.degToRad(this.speed);
    }
  }

  onPause() {
    this.rotation.copy(this.originalRotation);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.material.map = source.material.map;

    this._textureSrc = source._textureSrc;
    this.speed = source.speed;

    return this;
  }

  serialize() {
    return super.serialize({
      [SpinningCubeNode.componentName]: {
        speed: this.speed,
        textureSrc: this.textureSrc
      }
    });
  }

  // Add this method to modify the object after cloning the scene but before exporting.
  prepareForExport() {
    // You need to call the super method for the GLTFExporter to properly work with this object.
    super.prepareForExport();

    // Then we can add the rotate component and set the speed component.
    this.addGLTFComponent("rotate", {
      speed: this.speed
    });
  }
}
