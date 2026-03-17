import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

import { FileLoader } from "./fileLoader";
import { ToolBarLoader } from "./toolBar";
import { SpatialLoader } from "./spatialLoader";
import { HighlightLoader } from "./highlightLoader";

// Fetch container
const container = document.getElementById( "viewer" );

// Inits
const components = new OBC.Components();
components.OBC = OBC;
components.OBCF = OBCF;

const fileloader = new FileLoader( components, container ); // debug

// init nulls
var highlightloader = null;

document.addEventListener( 'DOMContentLoaded', async () =>
{
  console.log( "Loading viewer..." );

  fileloader.loadIFC()
    .then( loader =>
    {
      if ( loader )
      {
        console.log( "IFC file loaded successfully." );

        return loader;
      } else
      {
        console.log( "Failed to load IFC file." );
      }
    } ).then( loader =>
    {
      let indexer = components.get( components.OBC.IfcRelationsIndexer );
      indexer.process( loader.model );

      highlightloader = new HighlightLoader( components, loader.world, indexer ); // get highligther
      // hide space by default
      const spaceItems = fileloader.classifyByCategory( loader.model, "IFCSPACE" );
      highlightloader.hideHandler( spaceItems, false, "Space items" ); // hide by fragments

      // loads tool bar
      new ToolBarLoader( components, loader.world, loader.model, highlightloader );

      // loads the spatial tree
      new SpatialLoader( components, loader.world, loader.model, highlightloader, indexer );

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
