import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

import { FileLoader } from "./fileLoader";
import { HighlightLoader } from "./highlightLoader";
import { ToolBarLoader } from "./toolBar";

// Fetch container
const container = document.getElementById("viewer");

// Inits
const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);
const world = worlds.create();
world.container = container; // assign to global

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBCF.PostproductionRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

const fileloader = new FileLoader(components, world, container);

const ifcFileUrl = "/models/RVT23_NBeS-3.01_aPT-3 STY SEMI D_240914.ifc"; // URL to the Flask API endpoint
// const ifcFileUrl = "/models/RVT23_NBeS-4.0_aPT-SCHOOL_250403.ifc"; // URL to the Flask API endpoint
// const ifcFileUrl = "/models/RVT25_NBeS-3.02_aPT-P8_250114.ifc"; // URL to the Flask API endpoint

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Loading viewer...");

  fileloader.loadIFC(ifcFileUrl)
    .then(async (model) => {
      if (model) {
        // hide space by default
        const spaceItems = await fileloader.classifyByCategory(model, "IFCSPACE");

        const highlightloader = new HighlightLoader(components, world);
        highlightloader.hideHandler(spaceItems, false, "Space items");

        console.log("IFC file loaded successfully.");

        return model;
      } else {
        console.log("Failed to load IFC file.");
      }
    }).then((model) => {
      // loads highlight
      const toolbarLoader = new ToolBarLoader(components, world);
    })
    .catch((error) => {
      console.error("An unexpected error occurred:", error);
    }).finally(() => {
      // Execute this code regardless of success or failure
      console.log("DOM is fully loaded and processed.");
      overlay.style.display = "none";
    });
});