import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import Editor from "../components/Editor";
import FileDialogModalContainer from "./FileDialogModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import HierarchyPanelContainer from "./HierarchyPanelContainer";
import PropertiesPanelContainer from "./PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./AssetExplorerPanelContainer";
import ViewportToolbarContainer from "./ViewportToolbarContainer";
import { MosaicWindow } from "react-mosaic-component";
import PanelToolbar from "../components/PanelToolbar";
import { withProject } from "./ProjectContext";
import { withEditor } from "./EditorContext";
import { HotKeys } from "react-hotkeys";
import styles from "./EditorContainer.scss";

class EditorContainer extends Component {
  static defaultProps = {
    initialPanels: {
      direction: "column",
      first: {
        direction: "row",
        first: {
          direction: "row",
          first: "hierarchy",
          second: "viewport",
          splitPercentage: 33.333
        },
        second: "properties",
        splitPercentage: 75
      },
      second: "assetExplorer",
      splitPercentage: 70
    }
  };

  static propTypes = {
    initialPanels: PropTypes.object,
    editor: PropTypes.object,
    project: PropTypes.object
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", this.onWindowResize, false);

    this.state = {
      sceneURI: null,
      sceneModified: null,
      registeredPanels: {
        hierarchy: {
          component: HierarchyPanelContainer,
          windowProps: {
            title: "Hierarchy",
            toolbarControls: PanelToolbar
          }
        },
        viewport: {
          component: ViewportPanelContainer,
          windowProps: {
            title: "Viewport",
            toolbarControls: ViewportToolbarContainer(),
            draggable: true
          }
        },
        properties: {
          component: PropertiesPanelContainer,
          windowProps: {
            title: "Properties",
            toolbarControls: PanelToolbar
          }
        },
        assetExplorer: {
          component: AssetExplorerPanelContainer,
          windowProps: {
            title: "Asset Explorer",
            toolbarControls: PanelToolbar
          }
        }
      },
      openModal: null,
      keyMap: {
        translateTool: "w",
        rotateTool: "e",
        scaleTool: "r",
        save: ["ctrl+s", "command+s"],
        saveAs: ["ctrl+shift+s", "command+shift+s"],
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shit+z", "command+shift+z"],
        bundle: ["ctrl+b", "command+b"]
      },
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo,
        save: this.onSave,
        saveAs: this.onSaveAs,
        bundle: this.onOpenBundleModal
      }
    };

    this.gltfChangeHandlers = new Map();
  }

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();

    this.props.editor.signals.objectAdded.add(object => {
      const gltfRef = object.userData.MOZ_gltf_ref;

      if (gltfRef) {
        const onChange = (event, uri) => this.onGLTFChanged(event, uri, object);
        this.gltfChangeHandlers.set(object, onChange);
      }
    });

    this.props.editor.signals.objectRemoved.add(object => {
      const gltfRef = object.userData.MOZ_gltf_ref;

      if (gltfRef) {
        this.gltfChangeHandlers.delete(object);
      }
    });

    this.props.editor.signals.openScene.add(this.onOpenScene);
    this.props.editor.signals.sceneGraphChanged.add(this.onSceneChanged);
  }

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project && prevProps.project) {
      prevProps.project.close();
    }
  }

  componentWillUnmount() {
    if (this.props.project) {
      this.props.project.close();
    }

    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onWindowResize = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

  onUndo = () => {
    this.props.editor.undo();
  };

  onRedo = () => {
    this.props.editor.redo();
  };

  openSaveAsDialog(onSave) {
    this.setState({
      openModal: {
        component: FileDialogModalContainer,
        shouldCloseOnOverlayClick: true,
        props: {
          title: "Save scene as...",
          confirmButtonLabel: "Save as...",
          filter: ".gltf",
          onConfirm: onSave,
          onCancel: this.onCloseModal
        }
      }
    });
  }

  onSave = async e => {
    e.preventDefault();

    if (!this.state.sceneURI) {
      this.openSaveAsDialog(this.exportAndSaveScene);
    } else {
      this.exportAndSaveScene(this.state.sceneURI);
    }
  };

  onSaveAs = e => {
    e.preventDefault();
    this.openSaveAsDialog(this.exportAndSaveScene);
  };

  exportAndSaveScene = async sceneURI => {
    try {
      const { json, bin } = await this.props.editor.exportScene();

      await this.props.project.saveScene(sceneURI, json, bin);

      this.setState({
        sceneModified: false,
        sceneURI,
        openModal: null
      });
    } catch (e) {
      throw e;
    }
  };

  onOpenBundleModal = e => {
    e.preventDefault();

    if (!this.state.sceneURI) {
      console.warn("TODO: save scene before bundling instead of doing nothing");
      return;
    }

    this.setState({
      openModal: {
        component: FileDialogModalContainer,
        shouldCloseOnOverlayClick: true,
        props: {
          title: "Select glTF bundle output directory",
          confirmButtonLabel: "Bundle scene...",
          directory: true,
          onConfirm: this.onBundle,
          onCancel: this.onCloseModal
        }
      }
    });
  };

  onBundle = async outputPath => {
    await this.props.project.bundleScene(this.props.editor.scene.name, "0.1.0", this.state.sceneURI, outputPath);
    this.setState({ openModal: null });
  };

  onGLTFChanged = (event, uri, object) => {
    if (event === "changed") {
      this.props.editor.loadGLTF(uri, object);
    } else if (event === "removed") {
      this.props.editor.removeGLTF(uri, object);
      this.gltfChangeHandlers.delete(object);
    }
  };

  onSceneChanged = () => {
    if (!this.state.sceneModified) {
      this.setState({ sceneModified: true });
      document.title = `Hubs Editor - ${this.props.editor.scene.name}*`;
    }
  };

  onOpenScene = uri => {
    if (this.state.sceneURI === uri) {
      return;
    }

    if (
      this.state.sceneModified &&
      !confirm("This scene has unsaved changes do you really want to really want to open a new scene without saving?")
    ) {
      return;
    }

    this.props.editor.clear();
    this.props.editor.loadGLTFScene(uri);

    // Set state after sceneGraphChanged signals have fired.
    setTimeout(() => {
      this.setState({
        sceneURI: uri,
        sceneLastSaved: new Date(),
        sceneModified: false
      });

      document.title = `Hubs Editor - ${this.props.editor.scene.name}`;
    }, 0);
  };

  renderPanel = (panelId, path) => {
    const panel = this.state.registeredPanels[panelId];

    return (
      <MosaicWindow path={path} {...panel.windowProps}>
        <panel.component {...panel.props} />
      </MosaicWindow>
    );
  };

  render() {
    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <HotKeys
          keyMap={this.state.keyMap}
          handlers={this.state.globalHotKeyHandlers}
          className={styles.hotKeysContainer}
        >
          <Editor
            initialPanels={this.props.initialPanels}
            renderPanel={this.renderPanel}
            openModal={this.state.openModal}
            onCloseModal={this.onCloseModal}
            onPanelChange={this.onPanelChange}
          />
        </HotKeys>
      </DragDropContextProvider>
    );
  }
}

export default withProject(withEditor(EditorContainer));