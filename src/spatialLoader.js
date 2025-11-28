// spatialLoader
// import * as WEBIFC from "web-ifc";
// import { HighlightLoader } from "./highlightLoader";
import { VisibilityLoader } from "./visibilityLoader";
import { PropertiesLoader } from "./propertiesLoader";

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
      /** toolbar click
       * 
       * - reset color and tree selection
       * - hide spaces
       */
      /* const toolbar = document.getElementById( "toolbar" );
      toolbar.addEventListener( "click", ( e ) =>
      {
        if ( this.selectedItem !== null )
        {
          this.selectedItem.classList.remove( "active" );
        }
      } ); */
    } ).then( () =>
    {
      /** hash handler
       * 
       * feature to check on hash, on load or when changed
       */
      this.expressIdUrlHandler.call( this );

      window.addEventListener( "hashchange", () => this.expressIdUrlHandler.call( this ) );
    } );

    this.propertiesLoader = new PropertiesLoader( this.components, this.world );
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

        /** CONSTRUCT STOREYS
         * 
         */
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
          // 13 sub elements

          /** get elements
           * 
           * spaces are in array 0, other elements in 13
           * need to combine them together
           * sometimes storeys dont have space
           * therefore need to check before adding
           */
          let ids = this.jsonData[ s ][ 13 ];
          if ( this.jsonData[ s ][ 0 ] !== undefined )
          {
            ids.push( ...this.jsonData[ s ][ 0 ] );
          }

          // generate elements list here
          const children = await this._fetchStoreyElements( ids );
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
        body.id = expressId;
        body.classList.add( "ifc-element", "user-select-none" );
        body.setAttribute( "data-expressId", expressId );

        // add info icon
        body.classList.add( "d-flex", "align-items-center" ); // make icons to the left
        const infoBtn = document.createElement( "i" );
        infoBtn.classList.add( "material-symbols-outlined" );
        infoBtn.classList.add( "px-1" );
        infoBtn.innerHTML = "info";

        /** row listener
         * make row active
         * highlight and select element
         * gray out other elements
         */
        body.addEventListener( "click", async e =>
        {
          e.preventDefault;
          // hide all ifcspace, just in case
          this.highlighter.hideHandler( this.classifier.list.entities[ "IFCSPACE" ].map, false ); // hide IfcSpace

          if ( body.classList.contains( "active" ) )
          {
            // close infobox
            await this.propertiesLoader.display( {}, false );
            this.propertiesLoader.btnListeners();
            // remove all selections
            body.classList.remove( "active" );
            // reset all colors
            this.classifier.resetColor( this.all );
          } else
          {
            // remove from all elements
            document.querySelectorAll( ".ifc-element" ).forEach( e => e.classList.remove( "active" ) );

            // gray all elements
            this.classifier.setColor( this.all, this.color ); // set all colors
            this.highlighter.highlightItem( expressId, this.color );

            body.classList.toggle( "active" );
            this.selectedItem = body;

            // display selected elem, just in case
            let fragment = this.world.model.getFragmentMap( [ parseInt( expressId ) ] );
            this.highlighter.hideHandler( fragment, true );
          }
        } );

        /** icon listener
         * show infobox
         */
        infoBtn.addEventListener( "click", async e =>
        {
          e.stopPropagation(); // prevent bubbling to parent
          e.preventDefault;

          await this.propertiesLoader.display( { id: parseInt( expressId ) } );
        } );
        body.prepend( infoBtn );
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

    // set all colors
    this.classifier.setColor( this.all, this.color );
    // set item color
    this.highlighter.highlightItem( targetId, this.color );

    // Traverse up to find all parent collapse elements
    let element = target;
    while ( element && element !== document.body )
    {
      if ( element.classList.contains( 'accordion-collapse' ) )
      {
        // Show this collapse
        element.classList.add( 'show' );
      }
      element = element.parentElement;
    }

    /** 
     * 2025-11-17 17:52:40
     * - show item if type is space @todo
     */
    let fragment = this.world.model.getFragmentMap( [ parseInt( targetId ) ] );
    this.highlighter.hideHandler( fragment, true );
    await this.propertiesLoader.display( { id: parseInt( targetId ) } );
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

  /**
 * get anchor, if exist, select the item in model and reveal in browser
 */
  expressIdUrlHandler ()
  {
    const anchor = window.location.hash;

    if ( typeof anchor === "string" && anchor.length > 0 )
    {
      const [ str, id ] = anchor.split( '-' );
      if ( !isNaN( id ) )
      {
        this.openAccordionItem( id );
      } else
      {
        console.log( "No item was selected." );
      }
    }
  }
}