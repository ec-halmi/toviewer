// minimapLoader

export class MiniMapLoader {
  constructor(component, world, model) {
    this.component = component;
    this.world = world;
    this.model = model;

    // this.maps = new this.component.OBC.MiniMaps(this.component);
    this.maps = this.component.get(this.component.OBC.MiniMaps);
    this.map = this.maps.create(this.world);

    this.mapContainer = document.getElementById("minimap");
    this.canvas = this.map.renderer.domElement;
    this.mapContainer.append(this.canvas);
    this.map.resize();
    this.map.config.visible = false;
    this.map.enabled = false;
  }

  enable() {
    this.map.enabled = true;
    this.map.config.visible = true;
  }

  disable() {
    this.map.enabled = false;
    this.map.config.visible = false;
  }
}