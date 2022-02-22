import { Mesh, MeshBasicMaterial, BoxBufferGeometry, Euler, Math as MathUtils } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
// Add the following imports
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues, maybeAddLargeFileIssue } from "../utils/performance";

export default class SpinningCubeNode extends EditorNodeMixin(Mesh) {
  static componentName = "spinning-cube";

  static nodeName = "Spinning Cube";

  // We'll be using two additional arguments to deserialize
  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    // Load the textureSrc property out of the props
    const { speed, textureSrc } = json.components.find(c => c.name === SpinningCubeNode.componentName).props;

    node.speed = speed === undefined ? 10 : speed;

    // Spoke will load the texture asynchronously so we don't block other nodes from loading.
    loadAsync(
      (async () => {
        // loadTexture will handle loading the texture and setting the texture src property.
        // onError will be used to handle loading errors asynchronously.
        await node.loadTexture(textureSrc, onError);
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor, new BoxBufferGeometry(), new MeshBasicMaterial());
    // We're going to be using getter/setters for the textureSrc property.
    // We still need a place to store the textureSrc value so we'll prefix it with an underscore.
    this._textureSrc = "";
    this.speed = 10;
    this.originalRotation = new Euler();
  }

  // Here's our getter, nothing special here.
  get textureSrc() {
    return this._textureSrc;
  }

  // Our setter is going to call this async method.
  set textureSrc(value) {
    this.loadTexture(value).catch(console.error);
  }

  async loadTexture(src, onError) {
    // Make sure if we pass undefined in the deserialize method that we set it to an empty string.
    const nextSrc = src || "";

    // We don't want to load the texture if it hasn't changed.
    if (nextSrc === this._textureSrc) {
      return;
    }

    this._textureSrc = nextSrc;

    // The issues array will be used to highlight any scene performance warnings or problems while loading assets.
    // We need to reset it since we're going to load a new texture.
    this.issues = [];

    try {
      // Textures can be images from all over the web. As such we need to proxy media if it needs proper CORS headers.
      // The resolveMedia function will give us a url that can be accessed in Spoke and metadata for attribution details.
      const { accessibleUrl, meta } = await this.editor.api.resolveMedia(nextSrc);

      this.meta = meta;

      this.updateAttribution();

      // This is where the texture is actually loaded. We use an in-memory cache for textures so that duplicates
      // aren't loaded more than once.
      const texture = await this.editor.textureCache.get(accessibleUrl);

      this.material.map = texture; // Set the texture on the material
      this.material.needsUpdate = true; // Don't forget to set the needsUpdate flag!

      // Here's where we'll add any performance issues with the texture size on this mesh.
      // High resolution textures will display a warning.
      this.issues = getObjectPerfIssues(this, false);

      // The browser has an API to get stats on loading files.
      const perfEntries = performance.getEntriesByName(accessibleUrl);

      if (perfEntries.length > 0) {
        // This is how we check the texture file size.
        // Large image files will also display a warning.
        const imageSize = perfEntries[0].encodedBodySize;
        maybeAddLargeFileIssue("image", imageSize, this.issues);
      }
    } catch (error) {
      // If we ran into an error loading the image, we'll wrap the error with a more user-friendly message.
      const textureError = new RethrownError(`Error loading texture ${this._textureSrc}`, error);

      // Asynchronous error handling when loading the project happens here.
      if (onError) {
        onError(this, textureError);
      }

      console.error(textureError);

      // And we'll want to indicate to the user in the hierarchy panel that there was an error loading the texture.
      this.issues.push({ severity: "error", message: "Error loading texture." });
    }

    // The object changed asynchronously so we'll need to manually trigger an objectsChanged and selectionChanged event.
    // This will update the project modification status as well as the properties panel and other internal editor state.
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

  serialize() {
    return super.serialize({
      [SpinningCubeNode.componentName]: {
        speed: this.speed,
        // We'll want to serialize this texture url so that it loads next time we load the project.
        textureSrc: this.textureSrc
      }
    });
  }
}
