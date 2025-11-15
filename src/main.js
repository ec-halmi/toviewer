import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

import { FileLoader } from "./fileLoader";
import { HighlightLoader } from "./highlightLoader";
import { ToolBarLoader } from "./toolBar";
import { SpatialLoader } from "./spatialLoader";

// Fetch container
const container = document.getElementById( "viewer" );

// Inits
const components = new OBC.Components();
components.OBC = OBC;
components.OBCF = OBCF;

const fileloader = new FileLoader( components, container ); // debug

// init nulls
var highlightloader = null;

// const ifcFileUrl = "/viewer/models/RVT23_NBeS-3.01_aPT-3 STY SEMI D_240914.ifc"; // URL to the Flask API endpoint
// const ifcFileUrl = "/models/RVT23_NBeS-4.0_aPT-SCHOOL_250403.ifc"; // URL to the Flask API endpoint
// const ifcFileUrl = "/models/RVT25_NBeS-3.02_aPT-P8_250114.ifc"; // URL to the Flask API endpoint

document.addEventListener( 'DOMContentLoaded', async () =>
{
  console.log( "Loading viewer..." );

  fileloader.loadIFC()
    .then( loader =>
    {
      if ( loader )
      {
        // hide space by default
        const spaceItems = fileloader.classifyByCategory( loader.model, "IFCSPACE" );

        highlightloader = new HighlightLoader( components, loader.world ); // get highligther
        highlightloader.hideHandler( spaceItems, false, "Space items" ); // hide by fragments

        console.log( "IFC file loaded successfully." );

        return loader;
      } else
      {
        console.log( "Failed to load IFC file." );
      }
    } ).then( loader =>
    {
      const toolbarLoader = new ToolBarLoader( components, loader.world, loader.model, highlightloader );

      // loads the spatial tree
      new SpatialLoader( components, loader.world, loader.model, highlightloader );

      return loader;
    } )
    .catch( ( error ) =>
    {
      console.error( "An unexpected error occurred:", error );
    } ).finally( () =>
    {
      // Execute this code regardless of success or failure
      console.log( "DOM is fully loaded and processed." );
      document.getElementById( "viewer" ).focus();
      overlay.style.display = "none";
    } );
} );
