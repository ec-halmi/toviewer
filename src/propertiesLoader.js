// propertiesLoader

export class PropertiesLoader {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.model = this.world.model;
  }
}