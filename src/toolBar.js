// import { MeasurementsLoader } from "/src/measurementsLoader.js";
import { VisibilityLoader } from "/src/visibilityLoader.js";
import { PlansLoader } from "/src/plansLoader.js";
import { CameraLoader } from "/src/cameraLoader.js";

export class ToolBarLoader
{
  constructor( components, world, model, highlight )
  {
    this.components = components;
    this.world = world;
    this.model = model
    this.highlight = highlight;

    this.btnResetCamera();

    // visibility
    // show/hide elements by storey, ifc category, with reset view button
    this.btnVisibility();

    // enable camera loader
    this.camera = new CameraLoader( this.components, this.world );

    this.btnCameraFirstPerson();

    // camera-plan-view
    this.btnCameraPlanView();
  }


  /** camera-first-person
   * 
   */
  btnCameraFirstPerson ()
  {
    const iconBtn = document.getElementById( "camera-first-person" );

    iconBtn.addEventListener( "click", ( e ) =>
    {
      e.preventDefault();

      document.querySelectorAll( ".camera-mode" ).forEach( item =>
      {
        if ( item.id !== iconBtn.id )
        {
          item.classList.remove( "active" );
        }
      } );

      const btnStatus = this.toggleBtnActiveClass( iconBtn );

      if ( btnStatus )
      {
        this.camera.setMode( "FirstPerson" );
      } else
      {
        this.camera.setMode();
      }
    } );
  }

  /** camera-plan-view
   * 
   */
  btnCameraPlanView ()
  {
    const iconBtn = document.getElementById( "camera-plan-view" );

    iconBtn.addEventListener( "click", ( e ) =>
    {
      e.preventDefault();

      document.querySelectorAll( ".camera-mode" ).forEach( item =>
      {
        if ( item.id !== iconBtn.id )
        {
          item.classList.remove( "active" );
        }
      } );

      const btnStatus = this.toggleBtnActiveClass( iconBtn );

      if ( btnStatus )
      {
        this.camera.setMode( "Plan" );
      } else
      {
        this.camera.setMode();
      }
    } );
  }

  /** Provide visibility control
   * 
   * show/hide storey, ifc categories
   */
  btnVisibility ()
  {
    // hide box by default
    const box = document.getElementById( "visibility-panel" );
    box.style.display = "none";

    const iconBtn = document.getElementById( "tool-icon-visibility" );

    iconBtn.addEventListener( "click", async ( e ) =>
    {
      const btnStatus = this.toggleBtnActiveClass( iconBtn );

      const visibilityLoader = new VisibilityLoader( this.components, this.world, this.model );
      if ( btnStatus )
      { // true
        await visibilityLoader.enable( box, true );
      } else
      { // false
        await visibilityLoader.enable( box, false );
      }
    } );
  }

  btnResetCamera ()
  {
    const iconBtn = document.getElementById( "camera-reset" );

    iconBtn.addEventListener( "click", async ( e ) =>
    {
      this.world.camera.controls.setLookAt( 20, 0, 10, 20, 0, -10 );
    } );
  }

  toggleBtnActiveClass ( iconBtn )
  {
    const isAlreadyActive = iconBtn.classList.contains( "active" );

    if ( iconBtn )
    {
      if ( isAlreadyActive )
      { // already active
        // remove active class
        iconBtn.classList.remove( "active" );

        return false;
      } else
      {
        // add active class
        iconBtn.classList.add( "active" );

        return true;
      }
    }
  } // ~toggleBtnActiveClass
}