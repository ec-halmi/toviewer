import { MeasurementsLoader } from "./measurementsLoader";

export class ToolBarLoader {
  constructor(component, world, highlight) {
    this.component = component;
    this.world = world;
    this.highlight = highlight;

    this.btnResetCamera();
    const measurementPanelName = "measurement-panel";
    this.btnMeasurementTools(measurementPanelName);
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
  }
}