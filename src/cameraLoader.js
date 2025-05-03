// cameraLoader

export class CameraLoader {
  constructor(components, world) {
    this.components = components;
    this.world = world;
  }

  setMode(modeID = "Orbit") {
    this.world.camera.set(modeID);
  }
}