// visibilityLoader

import * as WEBIFC from "web-ifc";

export class VisibilityLoader {
  constructor(component, world, model) {
    this.component = component;
    this.world = world;
    this.model = model;

    // get hider
    this.hider = this.component.get(this.component.OBC.Hider);
    // classifier
    this.classifier = this.component.get(this.component.OBC.Classifier);

    // get indexer
    this.indexer = this.component.get(this.component.OBC.IfcRelationsIndexer);
    this.indexer.process(this.model);
    const serializedRelations = this.indexer.serializeModelRelations(this.model);
    this.jsonData = JSON.parse(serializedRelations);
  }

  // enable
  async enable(box, flag = false) {
    const visibilityStoreysList = document.getElementById("visibility-storeys-content");
    // console.log(this.classifier.list);

    if (flag) {
      box.style.display = "block";

      // storeys
      const list = await this.storeysVisibilityToggle();
      visibilityStoreysList.appendChild(list);
      // categorys
      this.categoryVisibilityToggle();
    } else {
      box.style.display = "none";
      visibilityStoreysList.innerHTML = "";
      // unhide all elements
      this.visibilityToggle(false, true);
      // hide ifscpace
      this.visibilityToggle(this.classifier.list.entities["IFCSPACE"].map, false);
    }
  }

  /**
   * @note need to classify both byIfcRel and bySpatialStructure.
   *  byIfcRel only loads direct children. bySpatialStructure is needed to get children of children such as ifcflight and ifcramp.
   * 
   * @returns classifier.list
   */
  async classifierByStorey() {
    // const classifier = this.component.get(this.component.OBC.Classifier);
    const classifier = this.classifier;
    // classifify by category
    await classifier.byEntity(this.model);
    // classify by storeys
    await classifier.byIfcRel(this.model, WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, "storeys");
    // classify by spatial structures
    await classifier.bySpatialStructure(this.model);

    return classifier.list;
  }

  /** visibility toggler
   * 
   * true = show (default)
   * false = hide
   */
  visibilityToggle(fragments = false, hide = false) {
    if (fragments) {
      this.hider.set(hide, fragments); // false means hide the elements
    } else {
      this.hider.set(hide); // false means hide the elements
    }
  }

  /** generates the storeys list
   * 
   * @param {object} data 
   */
  async storeysVisibilityToggle() {

    const ul = document.createElement("ul");
    ul.classList.add("list-group", "list-group-flush");

    const lists = await this.classifierByStorey();

    const storeys = lists.storeys;
    const spatialStructures = lists.spatialStructures;


    Object.keys(storeys).forEach(async (key) => {
      const frags = await this.model.getFragmentMap([spatialStructures[key].map]);

      const li = document.createElement("li");
      li.classList.add("list-group-item", "px-4", "py-3", "active");
      li.innerHTML = `${key}`;

      li.addEventListener("click", (e) => {
        if (li.classList.contains("active")) {
          li.classList.remove("active");

          this.visibilityToggle(spatialStructures[key].map, false);
        } else {
          li.classList.add("active");
          this.visibilityToggle(spatialStructures[key].map, true);
        }
      });

      ul.appendChild(li);
    });

    return ul;

    // console.log(ul);
    // const visibilityStoreysList = document.getElementById("visibility-storeys-content");
    // visibilityStoreysList.appendChild(ul);
  } //~ storeysVisibilityToggle

  /** prepares data for category list
   * 
   */
  async categoryVisibilityToggle() {
    const classifier = this.classifier;
    classifier.byEntity(this.model);
    const entityCategories = Object.keys(classifier.list.entities);

    const items = [];

    for (const i of entityCategories) {
      const found = classifier.find({ entities: [i] });
      items.push(
        {
          id: i,
          label: i,
          frags: found,
        }
      );
    }

    const sortedCaseInsensitive = [...items].sort((a, b) =>
      a.id.toLowerCase().localeCompare(b.id.toLowerCase())
    );

    const ul = this.categoryToggleList(sortedCaseInsensitive);
    const div = document.getElementById("visibility-ifc-content");
    div.innerHTML = "";
    div.appendChild(ul);
  } //~ categoryVisibilityToggle

  /** generates the ul for category list
   * 
   * @returns ul of elements
   */
  categoryToggleList(items, id = false) {
    // create list
    const ul = document.createElement("ul");
    ul.classList.add("list-group", "list-group-flush"); // defaults classes
    if (id) {
      ul.id = id;
    }

    var filteredItem = null;
    // remove ifcspace if exist in items
    const indexToRemove = items.findIndex(item => item.id.toLowerCase() === "ifcspace");
    if (indexToRemove !== -1) {
      filteredItem = items[indexToRemove];
      items.splice(indexToRemove, 1); // Removes 1 element at the found index
    }

    // loop items
    for (const item of items) {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "px-4", "py-3", "active");
      li.id = item.id;
      li.innerHTML = item.label;

      li.addEventListener("click", (e) => {
        if (li.classList.contains("active")) {
          li.classList.remove("active");
          this.visibilityToggle(item.frags, false);
        } else {
          li.classList.add("active");
          this.visibilityToggle(item.frags, true);
        }
      });

      ul.appendChild(li);
    }

    // manually add ifcspace if needed
    if (filteredItem) {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "px-4", "py-3");
      li.id = filteredItem.id;
      li.innerHTML = filteredItem.label;

      li.addEventListener("click", (e) => {
        if (li.classList.contains("active")) {
          li.classList.remove("active");
          this.visibilityToggle(filteredItem.frags, false);
        } else {
          li.classList.add("active");
          this.visibilityToggle(filteredItem.frags, true);
        }
      });

      ul.appendChild(li);
    }

    return ul;
  }
}