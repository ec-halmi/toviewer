// spatialLoader

export class SpatialLoader {
  constructor(components, world, model) {
    this.components = components;
    this.world = world;
    this.model = model;


    const indexer = this.components.get(this.components.OBC.IfcRelationsIndexer);

    async () => {
      await indexer.process(model);
    }

    console.log(indexer);
  }
}