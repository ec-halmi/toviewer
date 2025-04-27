import { MeasurementsLoader } from "./measurementsLoader";
import { VisibilityLoader } from "./visibilityLoader";
import { MiniMapLoader } from "./minimapLoader";
import { PlansLoader } from "./plansLoader";

export class ToolBarLoader {
  constructor(component, world, model, highlight) {
    this.component = component;
    this.world = world;
    this.model = model
    this.highlight = highlight;

    this.btnResetCamera();

    const measurementPanelName = "measurement-panel";
    this.btnMeasurementTools(measurementPanelName);

    // visibility
    // show/hide elements by storey, ifc category, with reset view button
    this.btnVisibility();

    // minimap
    this.btnMiniMap();

    // floorplans
    this.btnFloorPlans();
  }

  /**
   * 
  */
  btnFloorPlans() {
    const iconBtn = document.getElementById("tool-icon-plans");

    const plansLoader = new PlansLoader(this.component, this.world, this.model);

    iconBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const btnStatus = this.toggleBtnActiveClass(iconBtn);

      if (btnStatus) {
        plansLoader.enable();
      } else {
        plansLoader.disable();
      }
    });
  }


  /** enable minimap
   * 
   * show status box
   */
  btnMiniMap() {
    const iconBtn = document.getElementById("tool-icon-minimap");

    const miniMapLoader = new MiniMapLoader(this.component, this.world, this.model);

    iconBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const btnStatus = this.toggleBtnActiveClass(iconBtn);
      if (btnStatus) { // true
        miniMapLoader.enable();
      } else { // false
        miniMapLoader.disable();
      }
    })
  }

  /** Provide visibility control
   * 
   * show/hide storey, ifc categories
   */
  btnVisibility() {
    // hide box by default
    const box = document.getElementById("visibility-panel");
    box.style.display = "none";

    const iconBtn = document.getElementById("tool-icon-visibility");

    iconBtn.addEventListener("click", async (e) => {
      const btnStatus = this.toggleBtnActiveClass(iconBtn);

      const visibilityLoader = new VisibilityLoader(this.component, this.world, this.model);
      if (btnStatus) { // true
        await visibilityLoader.enable(box);
      } else { // false
        await visibilityLoader.enable(false);
      }
    });
  }

  btnResetCamera() {
    const iconBtn = document.getElementById("camera-reset");

    iconBtn.addEventListener("click", async (e) => {
      this.world.camera.controls.setLookAt(20, 0, 10, 20, 0, -10);
    });
  }

  btnMeasurementTools(panelName = null) {
    const iconBtn = document.getElementById("tool-icon-measurement");

    iconBtn.addEventListener("click", async (e) => {
      const penalItem = document.getElementById(panelName);
      const btnStatus = this.toggleBtnActiveClass(iconBtn);

      // load class
      let measurementsLoader = new MeasurementsLoader(this.component, this.world, this.highlight);

      if (btnStatus) { // if btn active
        // enable measurement tool box
        measurementsLoader.enable(panelName);
        // enable tool box
        penalItem.style.display = "block";
      } else {
        // disable
        measurementsLoader.enable();
        // 
        measurementsLoader = null;
        // hide tool box
        penalItem.style.display = "none";
      }
    });
  }

  toggleBtnActiveClass(iconBtn) {
    const isAlreadyActive = iconBtn.classList.contains("active");

    if (iconBtn) {
      if (isAlreadyActive) { // already active
        // remove active class
        iconBtn.classList.remove("active");

        return false;
      } else {
        // add active class
        iconBtn.classList.add("active");

        return true;
      }
    }
  } // ~toggleBtnActiveClass
}