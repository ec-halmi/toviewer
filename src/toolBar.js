
export class ToolBarLoader {
  constructor(component, world) {
    this.component = component;
    this.world = world;

    this.btnResetCamera();
  }

  btnResetCamera() {
    const iconResetCamera = document.getElementById("camera-reset");

    iconResetCamera.addEventListener("click", async (e) => {
      // this.world.camera.controls.reset();
      // this.world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
      this.world.camera.controls.setLookAt(20, 0, 10, 20, 0, -10);
    });
  }
}