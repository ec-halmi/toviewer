// spatialLoader
// import * as WEBIFC from "web-ifc";
// import { HighlightLoader } from "./highlightLoader";
import { VisibilityLoader } from "./visibilityLoader";
// import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

export class SpatialLoader
{
  constructor( components, world, model, highlightloader )
  {
    this.components = components;
    this.world = world;
    this.model = model;
    this.highlighter = highlightloader;
    this.highlighter.highlighter.add( "item-select", new THREE.Color( "red" ) );

    // const color = new THREE.Color("#202932");
    const color = new THREE.Color( "#d6d6d6" );
    const color2 = new THREE.Color().lerp( color, 0.2 );
    this.color = color2;

    this.classifier = this.components.get( this.components.OBC.Classifier );
    this.classifier.byModel( this.model.uuid, this.model );
    this.all = this.classifier.find( {
      models: [ this.model.uuid ],
    } );

    this.indexer = this.components.get( this.components.OBC.IfcRelationsIndexer );

    const fragmentsManager = this.components.get( this.components.OBC.FragmentsManager );

    fragmentsManager.onFragmentsLoaded.add( async ( model ) =>
    {
      if ( model.hasProperties ) await this.indexer.process( model );
    } );

    const serializedRelations = this.indexer.serializeModelRelations( this.model );
    this.jsonData = JSON.parse( serializedRelations );

    // init selection
    this.selectedItem = null;

    // generate prject info
    this._fetchProjectInfo();
    // generate tree
    this._fetchModelTree().then( () =>
    {
      const toolbar = document.getElementById( "toolbar" );
      toolbar.addEventListener( "click", ( e ) =>
      {
        this.classifier.resetColor( this.all );
        if ( this.selectedItem !== null )
        {
          this.selectedItem.classList.remove( "active" );
        }
      } );
    } ).then( () =>
    {
      /**
       * get anchor, if exist, select the item in model and reveal in browser
       */
      const anchor = window.location.hash;
      if ( typeof anchor === "string" && anchor.length > 0 )
      {
        const [ str, id ] = anchor.split( '-' );
        if ( !isNaN( id ) )
        {
          this.openAccordionItem( id );

          this.classifier.setColor( this.all, this.color ); // set all colors
          this.highlighter.highlightItem( id, this.color );
        } else
        {
          console.log( "No item was selected." );
        }
      }
    } );
  }

  /** generate the model browser
   * 
   * sites > buildings > storeys
   * 
   * browser will support multi sites, buildings, storeys
   * 
   * instead of looping, set data manually so we only fetch required data
   * 
   */
  async _fetchModelTree ()
  {
    const mainDiv = document.getElementById( "spatial-browser-body" ); // main browser div

    // get project
    const project = this.jsonData[ Object.keys( this.jsonData )[ 0 ] ];

    // get sites
    const sites = project[ 0 ]; // site ids
    for ( const site of sites )
    {

      const siteInfo = await this.getProperties( site );

      // site title
      const siteTitle = this.createRow( "Site", siteInfo[ "Name" ].value ?? siteInfo[ "LongName" ].value );
      const siteDiv = this._createDiv( siteTitle );

      // create accordian
      const accordian = this._createAccordian();

      // site buildings
      for ( const b of this.jsonData[ site ][ 0 ] )
      {
        const building = await this.getProperties( b );

        // fetch storeys
        // create accordian for storeys
        const accordianStorey = this._createAccordian();

        const visibilityLoader = new VisibilityLoader( this.components, this.world, this.model );
        const lists = await visibilityLoader.classifierByStorey();
        const spatialStructures = lists.spatialStructures;

        for ( const s of this.jsonData[ b ][ 0 ] )
        {
          const storey = await this.getProperties( s );
          // 0 childs?
          // 3 material
          // 7 properties
          // 9 type
          // 12 parent/storey

          // generate elements list here
          const children = await this._fetchStoreyElements( this.jsonData[ s ][ 13 ] );
          const storeyList = await this._generateStoreyAccordian( children );

          const item = this._createAccordianItem( accordianStorey.id, storey[ "LongName" ].value ?? storey[ "Name" ].value, storeyList );
          accordianStorey.append( item );

          // fetch the button, and add icon
          const icon = document.createElement( "i" );
          icon.id = storey.GlobalId.value;
          icon.classList.add( "material-symbols-outlined", "py-2", "plan-icon", "active" );
          icon.style.fontWeight = "600";
          icon.innerHTML = "visibility";
          const itemsMap = Object.values( spatialStructures ).find( item => item.name === storey[ "LongName" ].value );
          icon.addEventListener( "click", ( e ) =>
          {
            if ( icon.classList.contains( "active" ) )
            {
              icon.classList.remove( "active" );

              visibilityLoader.visibilityToggle( itemsMap.map, false );
            } else
            {
              icon.classList.add( "active" );
              visibilityLoader.visibilityToggle( itemsMap.map, true );
            }
          } );
          const header = item.querySelector( '.accordion-header' );
          header.classList.add( "d-flex", "justify-content-between" );
          header.prepend( icon );
        }

        // add building to list
        const item = this._createAccordianItem( accordian.id, building[ "LongName" ].value ?? building[ "Name" ].value, accordianStorey, 'siteName' );

        accordian.style.overflow = "auto";
        accordian.style.maxHeight = "calc(100vh - 60px)";
        // accordian.style.maxHeight = "100vh";
        accordian.append( item );

        siteDiv.append( accordian );
      }

      mainDiv.append( siteDiv );
    }
  }

  /**
   * if data is null,
   *  - dont create button 
   * 
   * @param {string} parent 
   * @param {string} title 
   * @param {object} data 
   * @returns 
   */
  _createAccordianItem ( parent, title, data, expressId = null )
  {
    const id = this.generateUUID();

    // main
    const item = document.createElement( "div" );
    item.classList.add( "accordion-item" );

    // body
    const body = document.createElement( "div" );
    body.id = id;
    // content
    const content = document.createElement( "div" );
    content.classList.add( "accordion-body" );

    if ( typeof data === "object" && data !== null )
    {
      // header
      const header = document.createElement( "div" );
      header.classList.add( "accordion-header" );

      // button
      const button = document.createElement( "button" );
      button.id = expressId;
      button.classList.add( "accordion-button", "collapsed", "fw-semibold" );
      button.setAttribute( "type", "button" );
      button.setAttribute( "data-bs-toggle", "collapse" );
      button.setAttribute( "data-bs-target", "#" + id );
      button.setAttribute( "aria-expanded", "false" );
      button.setAttribute( "aria-controls", id );
      button.innerHTML = title;

      header.append( button );
      item.append( header );

      content.append( data );

      body.classList.add( "accordion-collapse", "collapse" );
      if ( expressId == 'siteName' )
      {
        content.id = "site-accordian-body";
        content.classList.add( "overflow-auto" );
        body.classList.add( "show" );
      }
      body.setAttribute( "data-bs-parent", "#" + parent );
    } else
    {
      content.innerHTML = title;
      if ( expressId !== null )
      {
        content.id = expressId;
        content.classList.add( "ifc-element", "user-select-none" );
        content.setAttribute( "data-expressId", expressId );

        content.addEventListener( "click", e =>
        {
          e.preventDefault;

          if ( e.target.classList.contains( "active" ) )
          {
            e.target.classList.remove( "active" );
            this.classifier.resetColor( this.all );
          } else
          {
            document.querySelectorAll( ".ifc-element" ).forEach( element =>
            {
              element.classList.remove( "active" );
            } );

            // highlights
            this.classifier.setColor( this.all, this.color ); // set all colors
            this.highlighter.highlightItem( e.target.id, this.color );

            e.target.classList.toggle( "active" );
            this.selectedItem = e.target;
          }
        } );
      }
    }

    body.append( content );

    item.append( body );

    return item;
  }

  _createAccordian ()
  {
    const parent = document.createElement( "div" );
    // parent.id = self.crypto.randomUUID();
    parent.id = this.generateUUID();

    parent.classList.add( "accordion", "accordion-flush" );

    return parent;
  }

  _createDiv ( append )
  {
    const div = document.createElement( "div" ); // site div
    div.append( append );

    return div;
  }

  async getAllPropertiesOfType ( type )
  {
    const items = await this.model.getAllPropertiesOfType( type );

    return items;
  }

  async getProperties ( expressId = null )
  {
    if ( expressId )
    {
      try
      {
        const elem = await this.model.getProperties( expressId );

        return elem;
      } catch ( error )
      {
        console.error( "Error:", error );
      }
    }
  }

  async _fetchProjectInfo ()
  {
    const projectId = Object.keys( this.jsonData )[ 0 ];

    const project = await this.getProperties( projectId );

    const content = this.createContentDiv();
    content.style.overflow = "auto";
    content.style.maxHeight = "calc(100vh - 250px)";
    // Name
    const name = this.createRow( "Name", project[ "Name" ].value ?? "Not Available" );
    content.append( name );
    // LongName
    const LongName = this.createRow( "Long Name", project[ "LongName" ].value ?? "Not Available", false );
    content.append( LongName );
    // globalid
    const GlobalId = this.createRow( "Global ID", project[ "GlobalId" ].value ?? "Not Available" );
    content.append( GlobalId );
    // expressid
    const expressID = this.createRow( "Express ID", project[ "expressID" ].value ?? "Not Available" );
    content.append( expressID );
    // OwnerHistory > OwningUser > TheOrganization > ThePerson
    // 
    const aaa = this._fetchProperties( project[ "OwnerHistory" ][ "OwningUser" ][ "TheOrganization" ] );
    const TheOrganization = this.createRow( "TheOrganization", aaa ?? "Not Available", false );
    content.append( TheOrganization );
    // 
    const bbb = this._fetchProperties( project[ "OwnerHistory" ][ "OwningUser" ][ "ThePerson" ] );
    const ThePerson = this.createRow( "ThePerson", bbb ?? "Not Available", false );
    content.append( ThePerson );

    const body = document.getElementById( "spatial-project-body" );
    body.append( content );
  }

  createContentDiv ()
  {
    const div = document.createElement( "div" );
    div.classList.add( "accordion-body", "overflow-auto" );
    return div;
  }

  createRow ( title, value, nowrap = true )
  {
    const titleDiv = document.createElement( "div" );
    titleDiv.classList.add( "fw-semibold" );
    titleDiv.innerHTML = title;

    const valueDiv = document.createElement( "div" );
    if ( typeof value === "object" && value !== null )
    {
      valueDiv.classList.add( "px-3", "py-1" );
      valueDiv.append( value );
    } else
    {
      valueDiv.innerHTML = value ?? "Not Available";
    }

    const div = document.createElement( "div" );

    div.classList.add( "mb-1" );

    if ( nowrap )
    {
      div.classList.add( "d-flex", "justify-content-between" );
    }

    div.style.padding = "6px";
    div.append( titleDiv, valueDiv );

    return div;
  }

  _fetchProperties ( data )
  {
    const div = document.createElement( "div" );

    for ( const prop in data )
    {
      if ( ( typeof data[ prop ] === "object" ) && ( data[ prop ] !== null ) )
      {
        this._fetchProperties( data[ prop ] );
      } else
      {
        const e = this.createRow( prop, data[ prop ] );
        div.append( e );
      }
    }

    return div;
  }

  /** generates elements for storey, sorted by ifc type
   * 
   * @param obj json json of elements
   */
  async _fetchStoreyElements ( json )
  {
    // init set
    const childrenList = [];

    const promises = json.map( async ( child ) =>
    {
      const prop = await this.model.getProperties( child );
      const type = prop.constructor.name;
      const expressID = child;
      const name = prop.Name.value;

      let children = [];
      if ( this.jsonData[ child ].hasOwnProperty( 0 ) )
      {
        children = this.jsonData[ child ][ 0 ];
      }

      // If the type doesn't exist in the object, create an empty array for it
      if ( !childrenList[ type ] )
      {
        childrenList[ type ] = [];
      }

      // Push the expressID into the array for the corresponding type
      childrenList[ type ].push( [ expressID, name, children ] );
    } );

    // Wait for all promises to resolve
    await Promise.all( promises );

    // Now childrenList will be populated
    return childrenList;
  }

  /**
   * 
   * @param (array) children 
   */
  async _generateStoreyAccordian ( children )
  {
    const accordian = this._createAccordian();

    // loop by types
    Object.entries( children ).forEach( ( [ type, elems ] ) =>
    {
      if ( elems.length > 0 )
      {

        const elemsAccordian = this._createAccordian();

        // element accordian
        elems.forEach( async elem =>
        {
          let byElem;
          if ( elem[ 2 ].length === 0 )
          { // if no child, elem[2].length = 0, data = null
            byElem = this._createAccordianItem( elemsAccordian.id, elem[ 1 ], null, elem[ 0 ] );
          } else
          { // hav child, neeed to create child accordian
            // create accordian
            const subAcc = this._createAccordian();
            // create items
            for ( const item of elem[ 2 ] )
            {
              const prop = await this.getProperties( item );
              const subItem = this._createAccordianItem( subAcc.id, prop[ "LongName" ] ? prop[ "longName" ].value : prop[ "Name" ].value, null, item );

              subAcc.append( subItem );
            }

            byElem = this._createAccordianItem( elemsAccordian.id, elem[ 1 ], subAcc );
          }

          elemsAccordian.append( byElem );
        } );

        // add type accordian
        const byType = this._createAccordianItem( accordian.id, type, elemsAccordian );

        accordian.style.marginLeft = "30px";
        accordian.append( byType );
      }
    } );

    return accordian;
  }

  /** reveal the target item in the browser and highlight it
   * 
   * @param {string} targetId - expressid
   * @returns 
   */
  async openAccordionItem ( targetId )
  {
    const target = document.getElementById( targetId );

    if ( !target )
    {
      console.warn( `Element with ID ${ targetId } not found.` );
      return;
    }

    target.classList.add( "active" );

    // Traverse up to find all parent collapse elements
    let element = target;
    while ( element && element !== document.body )
    {
      if ( element.classList.contains( 'accordion-collapse' ) )
      {
        // Show this collapse
        const bsCollapse = new bootstrap.Collapse( element, { toggle: false } );
        bsCollapse.show();
      }
      element = element.parentElement;
    }
  }

  generateUUID ()
  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c )
    {
      const r = ( Math.random() * 16 ) | 0;
      const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
      return v.toString( 16 );
    } );
  }
}