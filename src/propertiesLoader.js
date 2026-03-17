// propertiesLoader
import * as WEBIFC from "web-ifc";

export class PropertiesLoader
{
  constructor( components, world, indexer )
  {
    this.components = components;
    this.world = world;
    this.model = this.world.model;

    // main box
    const infoBoxId = "element-details-box";
    this.infoBoxElem = document.getElementById( infoBoxId );
    // content box
    const infoBodyId = "element-card-body";
    this.infoBoxBody = document.getElementById( infoBodyId );
    // info card
    this.infoCard = document.getElementById( "element-details-box" );

    this.btnListeners();
    this.enableDragDiv();

    // indexer
    this.indexer = indexer;
  }

  /* 
  listener
   */
  btnListeners ()
  {
    const closeBtn = document.getElementById( "element-details-box-close" );
    closeBtn.onclick = e =>
    {
      e.preventDefault();
      this.infoBoxElem.style.display = "none";
      this.infoBoxBody.innerHTML = "";
    };

    const minimiseBtn = document.getElementById( "element-details-box-minimise" );
    minimiseBtn.onclick = e =>
    {
      e.preventDefault();
      this.infoBoxBody.classList.toggle( "active" );

      if ( this.infoBoxBody.classList.contains( "active" ) )
      {
        this.infoBoxBody.style.display = "none";
      } else
      {
        this.infoBoxBody.style.display = "block";
      }
    };
  }

  /**
   * 
   * @param {*} data 
   *  id must be int
   */
  async display ( data, show = true )
  {
    if ( show === false )
    {
      this.infoBoxElem.style.display = "none";
      return;
    }

    // set box to middle
    this.infoCard.classList.add( "top-50" );

    this.infoBoxElem.style.display = "block";
    this.infoBoxBody.innerHTML = ""; // reset contents

    // reset position of card
    this.infoCard.style.left = "unset";
    this.infoCard.style.top = "unset";

    // process data
    const props = await this.model.getProperties( data.id );

    // infoBoxBody
    // element name
    const name = document.createElement( "h2" );
    name.classList.add( "py-3" );
    name.innerHTML = props[ "LongName" ] ? props[ "LongName" ].value : props[ "Name" ].value;
    this.infoBoxBody.append( name );

    // element type
    const ifcName = this.components.OBC.IfcCategoryMap[ props.type ];
    const ifcClass = this.propertyRow( "IFC Class", ifcName );
    this.infoBoxBody.append( ifcClass );
    // show element if space
    /* if ( props.type === WEBIFC.IFCSPACE )
    {
      console.log( WEBIFC.IFCSPACE );
    } */

    // expressID
    const expressID = this.propertyRow( "Express ID", props[ "expressID" ] );
    this.infoBoxBody.append( expressID );
    // object type
    /** changes
     * 2025-11-17 15:04:39
     * update to catch if item is null
     */
    const objectType = this.propertyRow( "Object Type", props[ "ObjectType" ]?.value ?? "Not Available" );
    this.infoBoxBody.append( objectType );
    // PredefinedType
    const predefinedType = this.propertyRow( "Predefined Type", props[ "PredefinedType" ] ? props[ "PredefinedType" ].value : "Not Available" );
    this.infoBoxBody.append( predefinedType );

    const definedByRelations = await this.indexer.getEntityRelations(
      this.model,
      data.id,
      "IsDefinedBy",
    );

    if ( definedByRelations )
    {
      const psets = [];
      const qsets = [];

      for ( const definition of definedByRelations )
      {
        const attrs = await this.model.getProperties( definition );
        if ( !attrs ) continue;
        if ( attrs.type === WEBIFC.IFCPROPERTYSET ) psets.push( attrs );
        if ( attrs.type === WEBIFC.IFCELEMENTQUANTITY ) qsets.push( attrs );
      }

      const psetsDiv = await this.createPropertySections( "PropertySets", psets );
      this.propertSets( psetsDiv );

      const qsetsDiv = await this.createPropertySections( "QuantitySets", qsets );
      this.propertSets( qsetsDiv );
    }
  }

  async createPropertySections ( name, attributes )
  {
    const row = { data: { Name: name } };

    for ( const attr of attributes )
    {
      const setRow = {
        data: { Name: attr.Name?.value },
      };

      if ( attr.type === WEBIFC.IFCELEMENTQUANTITY )
      {
        for ( const propHandle of attr.Quantities )
        {
          const { value: propID } = propHandle;
          const propAttrs = await this.model.getProperties( propID );
          if ( !propAttrs ) continue;

          const valueKey = Object.keys( propAttrs ).find( ( attr ) =>
            attr.includes( "Value" ),
          );

          if ( !( valueKey && propAttrs[ valueKey ] ) ) continue;
          let value = propAttrs[ valueKey ].value;
          let symbol = "";

          const { name } = propAttrs[ valueKey ];
          const units = ( await this.getModelUnit( this.model, name ) ) ?? {};
          symbol = units.symbol;
          value = propAttrs[ valueKey ].value;
          if ( typeof value === "number" && units.digits )
          {
            value = value.toFixed( units.digits );
          }

          const propRow = {
            data: {
              Name: propAttrs.Name?.value,
              Value: `${ value } ${ symbol ?? "" }`,
            },
          };
          if ( !setRow.children ) setRow.children = [];
          setRow.children.push( propRow );
        }
      }

      if ( attr.type === WEBIFC.IFCPROPERTYSET )
      {
        for ( const propHandle of attr.HasProperties )
        {
          const { value: propID } = propHandle;
          const propAttrs = await this.model.getProperties( propID );
          if ( !propAttrs ) continue;
          const valueKey = Object.keys( propAttrs ).find( ( attr ) =>
            attr.includes( "Value" ),
          );

          if ( !( valueKey && propAttrs[ valueKey ] ) ) continue;
          let value = propAttrs[ valueKey ].value;
          let symbol = "";

          const { name } = propAttrs[ valueKey ];
          const units = ( await this.getModelUnit( this.model, name ) ) ?? {};
          symbol = units.symbol;
          value = propAttrs[ valueKey ].value;
          if ( typeof value === "number" && units.digits )
          {
            value = value.toFixed( units.digits );
          }

          const propRow = {
            data: {
              Name: propAttrs.Name?.value,
              Value: `${ value } ${ symbol ?? "" }`,
            },
          };
          if ( !setRow.children ) setRow.children = [];
          setRow.children.push( propRow );
        }
      }

      if ( !setRow.children ) continue;
      if ( !row.children ) row.children = [];
      row.children.push( setRow );
    }

    return row;
  }

  /** create property set boxes
   * 
   * @param {*} row 
   */
  propertSets ( row )
  {
    if ( row.children )
    {

      const div = document.createElement( "div" );
      div.classList.add( "pt-3" );
      const title = document.createElement( "h4" );
      title.classList.add( "py-1" );
      title.innerHTML = row.data.Name;
      div.append( title );

      for ( const child of row.children )
      {
        const subDiv = document.createElement( "div" );
        subDiv.classList.add( "px-2", "pt-2", "ps-3" );
        subDiv.innerHTML = `<h4>${ child.data.Name }</h4>`;

        if ( child.children )
        {
          for ( const item of child.children )
          {
            const c = this.propertyRow( item.data.Name, item.data.Value );
            subDiv.append( c );
          }
        }

        div.append( subDiv );
      }

      this.infoBoxBody.append( div );
    }
  }

  propertyRow ( title, value )
  {
    const label = document.createElement( "span" );
    label.classList.add( "label" );
    label.innerHTML = title + ": ";

    const item = document.createElement( "span" );
    item.innerHTML = value;

    const row = document.createElement( "div" );
    row.classList.add( "ps-3", "py-1" );
    row.append( label, item );

    return row;
  }

  // closeInfoEvent(event) {
  // }

  /** implement drag and drop for card
   * 
   * dont implement on the main div as its position=absoulute. this way we can easily reset the position of the card.
   * 
   */
  enableDragDiv ()
  {
    const card = this.infoCard;
    const dragHandle = document.getElementById( "element-details-box" );

    let offsetX = 0, offsetY = 0;
    let isDragging = false;

    // Start dragging
    dragHandle.addEventListener( 'mousedown', function ( e )
    {
      isDragging = true;
      offsetX = e.clientX - card.offsetLeft;
      offsetY = e.clientY - card.offsetTop;
      card.style.cursor = 'grabbing';
    } );

    // Move
    document.addEventListener( 'mousemove', function ( e )
    {
      if ( isDragging )
      {
        card.classList.remove( "top-50" );
        card.style.left = `${ e.clientX - offsetX }px`;
        card.style.top = `${ e.clientY - offsetY }px`;
      }
    } );

    // Stop dragging
    document.addEventListener( 'mouseup', function ()
    {
      isDragging = false;
      card.style.cursor = 'grab';
    } );
  }

  async getModelUnit ( model, type )
  {
    const map = {
      IFCLENGTHMEASURE: "LENGTHUNIT",
      IFCAREAMEASURE: "AREAUNIT",
      IFCVOLUMEMEASURE: "VOLUMEUNIT",
      IFCPLANEANGLEMEASURE: "PLANEANGLEUNIT",
    };

    const ifcUnitSymbols = {
      MILLIMETRE: { symbol: "mm", digits: 2 },
      METRE: { symbol: "m", digits: 2 },
      KILOMETRE: { symbol: "km", digits: 2 },
      SQUARE_METRE: { symbol: "m²", digits: 2 },
      CUBIC_METRE: { symbol: "m³", digits: 2 },
      DEGREE: { symbol: "°", digits: 2 },
      RADIAN: { symbol: "rad", digits: 2 },
      GRAM: { symbol: "g", digits: 2 },
      KILOGRAM: { symbol: "kg", digits: 2 },
      MILLISECOND: { symbol: "ms", digits: 2 },
      SECOND: { symbol: "s", digits: 2 },
    };

    const units = Object.values(
      ( await this.model.getAllPropertiesOfType( WEBIFC.IFCUNITASSIGNMENT ) ),
    )[ 0 ];
    let unit;
    for ( const handle of units.Units )
    {
      const unitAttrs = await model.getProperties( handle.value );
      if ( unitAttrs && unitAttrs.UnitType?.value === map[ type ] )
      {
        unit = `${ unitAttrs.Prefix?.value ?? "" }${ unitAttrs.Name?.value ?? "" }`;
        break;
      }
    }
    if ( unit ) return ifcUnitSymbols[ unit ];
    return null;
  }
}