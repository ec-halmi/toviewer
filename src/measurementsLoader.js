// MeasurementsLoader
// import * as OBCF from "@thatopen/components-front";
// import { HighlightLoader } from "./highlightLoader";

export class MeasurementsLoader {
  constructor(components, world, highlight) {
    this.components = components;
    this.world = world;
    const OBCF = this.components.OBCF;

    // get highllighter
    // this.highlight = highlight;
    this.highlighter = this.components.get(this.components.OBCF.Highlighter);

    // angles
    this.angles = components.get(OBCF.AngleMeasurement);
    this.angles.world = world;

    // area
    this.areaDims = components.get(OBCF.AreaMeasurement);
    this.areaDims.world = world;

    // edge
    this.edge = components.get(OBCF.EdgeMeasurement);
    this.edge.world = world;

    // face
    this.face = components.get(OBCF.FaceMeasurement);
    this.face.world = world;

    // length
    this.length = components.get(OBCF.LengthMeasurement);
    this.length.world = world;
    this.length.snapDistance = 1;

    // volume
    this.volume = components.get(OBCF.VolumeMeasurement);
    this.volume.world = world;
    this.volume.enabled = false;
  }

  enable(container = null) {
    this.container = document.getElementById(container);

    if (container && typeof container === "string") {
      if (this.container) {
        // this.container.style.display = "block";
        this.measurementsListenersPanel();
      }
    } else {
      document.querySelectorAll('input[name="btn-measurement"]').forEach(radio => radio.checked = false); // uncheck all radios
      this.measurementsDisableAll();
    }
  }

  unload() {
    this.components = undefined;
    this.world = undefined;
    this.angles = undefined;
    this.areaDims = undefined;
    this.edge = undefined;
    this.face = undefined;
    this.length = undefined;

    this.container = undefined;
  }


  measurementsListenersPanel() {
    // measurement-delete
    const clearBtn = document.getElementById("measurement-clear");
    clearBtn.style.cursor = "pointer";
    clearBtn.addEventListener("click", (e) => {
      this.measurementsDeleteAll();
    });

    const btns = document.getElementsByName("btn-measurement");
    btns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        // disable all measurement tools
        this.measurementsDeleteAll();
        this.measurementsDisableAll();

        // Stop event propagation to prevent conflicts
        e.stopPropagation();

        switch (e.target.id) {
          case "btn-measurement-angle":
            this.angles.enabled = true;
            this.world.container.ondblclick = () => this.angles.create();
            break;

          case "btn-measurement-length":
            this.length.enabled = true;
            this.world.container.ondblclick = () => this.length.create();
            this.world.container.onkeydown = (event) => {
              if (event.shiftKey && event.key === 'Backspace') {
                this.length.delete(); // delete
                event.preventDefault(); // Prevent default Backspace behavior
              }
            };
            break;

          case "btn-measurement-area":
            this.areaDims.enabled = true;
            this.world.container.ondblclick = () => this.areaDims.create();
            this.world.container.oncontextmenu = () => this.areaDims.endCreation();
            break;

          case "btn-measurement-edge":
            this.edge.enabled = true;
            this.world.container.onclick = () => this.world.container.focus();
            this.world.container.ondblclick = () => this.edge.create();
            this.world.container.onkeydown = (event) => {
              if (event.shiftKey && event.key === 'Backspace') {
                this.edge.delete(); // delete
                event.preventDefault(); // Prevent default Backspace behavior
              }
            };
            break;

          case "btn-measurement-face":
            this.face.enabled = true;
            this.world.container.onclick = () => this.world.container.focus();
            this.world.container.ondblclick = () => this.face.create();
            this.world.container.onkeydown = (event) => {
              if (event.shiftKey && event.key === 'Backspace') {
                this.face.delete(); // delete
                event.preventDefault(); // Prevent default Backspace behavior
              }
            };
            break;

          case "btn-measurement-volume":
            this.volume.enabled = true;
            this.highlighter.events.select.onHighlight.add((event) => {
              const volume = this.volume.getVolumeFromFragments(event);
            });

            this.highlighter.events.select.onClear.add(() => {
              this.volume.clear();
            });
            break;

          default:
            break;
        }
      });
    });
  }

  measurementsDisableAll() {
    // clear all dimensions
    this.measurementsDeleteAll();

    // angle
    this.angles.enabled = false;
    // area
    this.areaDims.enabled = false;
    // edge
    this.edge.enabled = false;
    // edge
    this.face.enabled = false;
    // length
    this.length.enabled = false;
    // volume
    this.volume.enabled = false;
  }

  measurementsDeleteAll() {
    // angle
    this.angles.deleteAll();
    // area
    this.areaDims.deleteAll();
    // edge
    this.edge.deleteAll();
    // edge
    this.face.deleteAll();
    // length
    this.length.deleteAll();
    // volume
    this.volume.deleteAll();
    // highlighter
    this.highlighter.clear();
  }
}