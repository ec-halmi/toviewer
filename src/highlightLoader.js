import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";
import { PropertiesLoader } from "./propertiesLoader";


export class HighlightLoader {
  constructor(components, world) {
    this.components = components;
    this.world = world;

    this.highlighter = this.components.get(OBCF.Highlighter);
    this.highlighter.setup({
      world: world,
      hoverEnabled: false, // disable selection on hover
    });
    this.highlighter.zoomToSelection = false;
    this.highlightName = "default";
    this.highlighter.add(this.highlightName, null);

    // add outliner
    this.outliner = null;
    this.outLineHandler();

    // init handler
    this.hideEventHandler = null;
    this.boundHideHandler = null; // Store bound function for proper removal

    this.highlightClickEvent();
    this.highlightDblClickEvent();

    // Loads properties class
    this.propertiesLoader = new PropertiesLoader(this.components, this.world);
  }

  /** implement clicks on element
   * 
   */
  async highlightClickEvent() {
    this.world.container.onclick = async (event) => {
      // console.log(event); // @debug
      event.stopPropagation();
      event.preventDefault();
      const result = await this.highlighter.highlight(this.highlightName, true, false);
      // console.log("Click", result);
    };
  }

  /** implement double clicks on element
   * 
   */
  async highlightDblClickEvent() {
    this.world.container.ondblclick = async (event) => {
      event.stopPropagation();
      event.preventDefault();
      const result = await this.highlighter.highlight(this.highlightName, true, false);

      if (result) {
        await this.propertiesLoader.display(result);
      }
    };
  }

  /** implement outliner
   * 
   */
  outLineHandler() {
    this.outliner = this.components.get(OBCF.Outliner);
    this.outliner.world = this.world;
    this.outliner.enabled = true;

    this.outliner.create(
      "outliner",
      new THREE.MeshBasicMaterial({
        color: 0xbcf124,
        transparent: true,
        opacity: 0.5,
      }),
    );

    // init content element
    this.barContent = null;

    // implement highlight onselect
    this.highlighter.events.select.onHighlight.add(data => {
      this.outliner.clear("outliner");
      this.outliner.add("outliner", data);

      this.removeHideListener();

      // Create bound handler with current data
      this.boundHideHandler = (event) => this.hideHighlightedItem(event, data);
      this.hideEventHandler = this.boundHideHandler;

      // add listener - keydown
      document.addEventListener('keydown', this.hideEventHandler);

      // adds status bar message
      this.barContent = document.getElementById("highlight-status"); // get existing element

      if (this.barContent === null) { // creates if null
        this.barContent = document.createElement("div");
        this.barContent.id = "highlight-status";
        this.barContent.innerHTML = "Hide selected item(s): Shift+H, Reset hidden items: Escape";

        const statusContentBar = document.getElementById("status-bar-content");
        statusContentBar.appendChild(this.barContent);
      }
    });

    // implement highlight onclear
    this.highlighter.events.select.onClear.add(() => {
      this.outliner.clear("outliner");
      // console.log("Highlight clear");

      // remove bar content if exist
      if (this.barContent !== null) {
        this.barContent.remove();
      }

      this.removeHideListener();
      this.destroy();
    });
  }

  // Implement hider
  hideHandler(items, flag, message = null) {
    try {
      const hider = this.components.get(OBC.Hider);
      hider.set(flag, items); // false means hide the elements

      if (message !== null) {
        console.log("Items successfully hidden", message);
      }
    } catch (error) {
      console.error("Error hiding elements:", error);
    }
  }

  /** keydown events
   * 
   * H+Shift - hide element
   * Esc - clear selections
   */
  async hideHighlightedItem(event, data) {
    if (event.key === 'H' && event.shiftKey) {
      this.hideHandler(data, false);
    }
    if (event.key === 'Escape' || event.key === 'Esc') {
      this.hideHandler(null, true); // unhide all items
      this.hideHandler("IFCSPACE", false); // hide IfcSpace
      this.highlighter.clear();
    }
  }

  // Function to remove event listener
  removeHideListener() {
    if (this.hideEventHandler) {
      document.removeEventListener('keydown', this.hideEventHandler);
      this.hideEventHandler = null;
      this.boundHideHandler = null;
    }
  }

  // Cleanup when instance is no longer needed
  destroy() {
    this.removeHideListener();
  }


  /**
   * - clear previous selections
   * - set color
   * - get fragment
   * - highlight
   * 
   * @param {string} expressId 
   */
  async highlightItem(expressId) {
    this.highlighter.clear(); // clear previous selections

    const fragment = this.world.model.getFragmentMap([parseInt(expressId)]);
    await this.highlighter.highlightByID("item-select", fragment, true, true);
  }
}