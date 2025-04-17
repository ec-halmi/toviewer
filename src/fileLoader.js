// fileLoader

import * as WEBIFC from "web-ifc";
import * as OBC from "@thatopen/components";
import * as THREE from "three";

export class FileLoader {
  constructor(components, world, container) {
    this.components = components;
    this.world = world;

    this.components.init();

    // fragments
    // this.fragments = this.components.get(OBC.FragmentsManager);
    this.fragmentIfcLoader = this.components.get(OBC.IfcLoader);
  }

  async loadIFC(url) {
    try {
      const response = await fetch(url);

      // Check if the response is OK (status code 200–299)
      if (!response.ok) {
        throw new Error(`Failed to fetch IFC file: ${response.status} ${response.statusText}`);
      }

      this.world.renderer.postproduction.enabled = true;

      // this.world.camera.controls.setLookAt(20, 6, 18, 0, 0, -10);
      this.world.camera.controls.setLookAt(20, 0, 10, 20, 0, -10);

      this.world.scene.setup();

      const grids = this.components.get(OBC.Grids);
      const grid = grids.create(this.world);
      grid.config.color = new THREE.Color("#949494");
      grid.config.primarySize = 2;
      grid.config.secondarySize = 10;
      this.world.renderer.postproduction.customEffects.excludedMeshes.push(grid.three);

      // this.world.scene.three.background = new THREE.Color(0x87CEEB);
      // this.world.scene.three.background = null;

      await this.fragmentIfcLoader.setup();
      this.fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

      //   Optionally exclude categories that we don't want to convert to fragments like very easily:
      const excludedCats = [
        WEBIFC.IFCTENDONANCHOR,
        WEBIFC.IFCREINFORCINGBAR,
        WEBIFC.IFCREINFORCINGELEMENT,
      ];

      for (const cat of excludedCats) {
        this.fragmentIfcLoader.settings.excludedCategories.add(cat);
      }

      // await new Promise((resolve) => setTimeout(resolve, 5000)); // @debug: Pause

      const dataBuffer = await response.arrayBuffer();
      const int8ArrayBuffer = new Uint8Array(dataBuffer);
      // Load the IFC model
      const model = await this.fragmentIfcLoader.load(int8ArrayBuffer);
      // console.log(model);
      model.name = "example";
      this.world.meshes.add(model);
      this.world.scene.three.add(model);

      return model;

      // If the response is successful, return true
    } catch (error) {
      // Log the error for debugging purposes
      console.error("Error loading IFC file:", error.message);

      // Optionally re-throw the error or return false based on your use case
      // Uncomment one of the following lines:
      // throw error; // Re-throw the error for the caller to handle
      return false; // Return false if you want to suppress the error
    }
  }

  async classifyByCategory(model, category) {
    const classifier = this.components.get(OBC.Classifier);
    classifier.byEntity(model);

    const getItems = await classifier.find({ entities: [category] });

    classifier.dispose();

    return getItems;
  }
}
