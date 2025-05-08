// plansLoader
import * as THREE from "three";

export class PlansLoader {
  constructor(components, world, model) {
    this.components = components;
    this.world = world;
    this.model = model;

    // loads FragmentsManager
    this.fragments = this.components.get(this.components.OBC.FragmentsManager);

    this.plans = this.components.get(this.components.OBCF.Plans);

    // Colors
    this.whiteColor = new THREE.Color("white");
    // Store the original background color and minGloss value
    this.originalBackgroundColor = this.world.scene.three.background;
    this.originalMinGloss = this.world.renderer.postproduction.customEffects.minGloss;

    this.iconPlanEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.setupThickness(true);
      this.setupColors(true);
      this.plans.goTo(e.target.id);
    }
  }

  async enable() {
    this.plans.world = this.world;
    await this.plans.generate(this.model);

    // get storey icons
    document.querySelectorAll(".plan-icon").forEach(element => {
      element.style.color = "var(--bs-accordion-btn-color)";

      element.addEventListener("click", this.iconPlanEvent);
    });
  }

  disable() {
    // set up elements thickness
    this.setupThickness(false);
    // set up colors
    this.setupColors(false);

    // this.plans.enabled = false;
    this.plans.exitPlanView();

    // get storey icons
    document.querySelectorAll(".plan-icon").forEach(element => {
      element.removeEventListener("click", this.iconPlanEvent);
      element.style.color = "var(--bs-gray-400)";
    });
  }


  // set up colors
  setupColors(flag = false) {
    if (flag) {
      // Adjust the minGloss value for better visualization
      this.world.renderer.postproduction.customEffects.minGloss = 0.1;
      // Background color
      this.world.scene.three.background = this.whiteColor;
    } else {
      this.world.renderer.postproduction.customEffects.minGloss = this.originalMinGloss;
      this.world.scene.three.background = this.originalBackgroundColor;
    }
  }


  /** set up defaults for walls, doors, etc
   * 
   *  
   * https://github.com/ThatOpen/engine_components/blob/main/packages/front/src/fragments/Plans/example.ts#L293
   */
  async setupThickness(flag) {
    const classifier = this.components.get(this.components.OBC.Classifier);
    const edges = this.components.get(this.components.OBCF.ClipEdges);

    classifier.byModel(this.model.uuid, this.model);
    classifier.byEntity(this.model);

    // const modelItems = classifier.find({ models: [this.model.uuid] });

    const thickItems = classifier.find({
      entities: ["IFCWALLSTANDARDCASE", "IFCWALL"],
    });

    const thinItems = classifier.find({
      entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
    });

    /* MD
      Awesome! Now, to create a style called "thick" for the walls, we can do the following:
    */

    const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
    const blackLine = new THREE.LineBasicMaterial({ color: "black" });
    const blackOutline = new THREE.MeshBasicMaterial({
      color: "black",
      opacity: 0.5,
      side: 2,
      transparent: true,
    });

    edges.styles.create(
      "thick",
      new Set(),
      this.world,
      blackLine,
      grayFill,
      blackOutline,
    );

    for (const fragID in thickItems) {
      const foundFrag = this.fragments.list.get(fragID);

      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      edges.styles.list.thick.fragments[fragID] = new Set(thickItems[fragID]);
      edges.styles.list.thick.meshes.add(mesh);
    }

    /* MD
      Creating a style called "thin" for the rest follows the same pattern:
    */

    edges.styles.create("thin", new Set(), this.world);

    for (const fragID in thinItems) {
      const foundFrag = this.fragments.list.get(fragID);

      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      edges.styles.list.thin.fragments[fragID] = new Set(thinItems[fragID]);
      edges.styles.list.thin.meshes.add(mesh);
    }

    /* MD
      Finally, let's update the edges to apply these changes.
    */
    edges.update(true);
  }
}