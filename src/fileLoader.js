// fileLoader

import * as WEBIFC from "web-ifc";
import * as OBC from "@thatopen/components";

export class FileLoader
{
  constructor( components, container )
  {
    this.components = components;

    const worlds = components.get( this.components.OBC.Worlds );
    // this.world = world;
    this.world = worlds.create();
    this.world.container = container; // assign to global

    this.world.scene = new this.components.OBC.SimpleScene( this.components );
    this.world.renderer = new this.components.OBCF.PostproductionRenderer( this.components, this.world.container );
    this.world.camera = new this.components.OBC.OrthoPerspectiveCamera( this.components );


    this.components.init();

    // fragments
    this.fragmentIfcLoader = this.components.get( OBC.IfcLoader );

    this.fragmentIfcLoader.setup( {
      autoSetWasm: false,
      wasm: {
        path: "/viewer/wasm/",
        absolute: true,
      },
    } );
    this.fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
  }

  async loadIFC ( url = null )
  {
    try
    {
      let a = document.getElementById( "ifc-file" );
      if ( a )
      {
        url = a.href;

        const response = await fetch( url );

        // Check if the response is OK (status code 200–299)
        if ( !response.ok )
        {
          throw new Error( `Failed to fetch IFC file: ${ response.status } ${ response.statusText }` );
        }

        this.world.renderer.postproduction.enabled = true;

        // this.world.camera.controls.setLookAt(20, 6, 18, 0, 0, -10);
        this.world.camera.controls.setLookAt( 20, 0, 10, 20, 0, -10 );

        this.world.scene.setup();

        const grids = this.components.get( OBC.Grids );
        const grid = grids.create( this.world );
        this.world.renderer.postproduction.customEffects.excludedMeshes.push( grid.three );

        //   Optionally exclude categories that we don't want to convert to fragments like very easily:
        const excludedCats = [
          WEBIFC.IFCTENDONANCHOR,
          WEBIFC.IFCREINFORCINGBAR,
          WEBIFC.IFCREINFORCINGELEMENT,
        ];

        for ( const cat of excludedCats )
        {
          this.fragmentIfcLoader.settings.excludedCategories.add( cat );
        }

        // await new Promise((resolve) => setTimeout(resolve, 5000)); // @debug: Pause

        const dataBuffer = await response.arrayBuffer();
        const int8ArrayBuffer = new Uint8Array( dataBuffer );
        // Load the IFC model
        const model = await this.fragmentIfcLoader.load( int8ArrayBuffer );
        // console.log(model);
        model.name = "nbes";
        this.world.scene.three.add( model );
        this.world.meshes.add( model );

        // Culler
        console.log( "Adding cullers" );
        const cullers = this.components.get( OBC.Cullers );
        const culler = cullers.create( this.world );
        culler.config.threshold = 100;
        culler.needsUpdate = true;
        this.world.camera.controls.addEventListener( "controlend", () =>
        {
          culler.needsUpdate = true;
        } );

        this.world.model = model;

        return { world: this.world, model }; // @test

        // If the response is successful, return true
      }
    } catch ( error )
    {
      // Log the error for debugging purposes
      console.error( "Error loading IFC file:", error.message );

      // Optionally re-throw the error or return false based on your use case
      // Uncomment one of the following lines:
      // throw error; // Re-throw the error for the caller to handle
      return false; // Return false if you want to suppress the error
    }
  }

  classifyByCategory ( model, category )
  {
    const classifier = this.components.get( OBC.Classifier );
    classifier.byEntity( model );

    const getItems = classifier.find( { entities: [ category ] } );

    // classifier.dispose();

    return getItems;
  }
}
