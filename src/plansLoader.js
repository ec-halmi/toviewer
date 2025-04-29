// plansLoader
import * as THREE from "three";

export class PlansLoader {
  constructor(components, world, model) {
    this.components = components;
    this.world = world;
    this.model = model;
    console.log("lists", model.lists);

    // loads FragmentsManager
    this.fragments = this.components.get(this.components.OBC.FragmentsManager);

    this.plans = this.components.get(this.components.OBCF.Plans);

    // Colors
    this.whiteColor = new THREE.Color("white");
    // Store the original background color and minGloss value
    this.originalBackgroundColor = this.world.scene.three.background;
    this.originalMinGloss = this.world.renderer.postproduction.customEffects.minGloss;
  }

  async enable(expressId = 0) {
    this.plans.world = this.world;
    await this.plans.generate(this.model);

    // set up elements thickness
    this.setupThickness(true);
    // set up colors
    this.setupColors(true);

    for (const plan of this.plans.list) {
      // console.log(plan);
    }

    this.plans.goTo("0j0D7YhXr2YgyLFnxk0DSN");
  }

  disable() {
    // set up elements thickness
    this.setupThickness(false);
    // set up colors
    this.setupColors(false);

    this.plans.exitPlanView();
    this.plans.enabled = false;
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
  async setupThickness() {
    const classifier = this.components.get(this.components.OBC.Classifier);
    const edges = this.components.get(this.components.OBCF.ClipEdges);

    classifier.byModel(this.model.uuid, this.model);
    classifier.byEntity(this.model);

    const modelItems = classifier.find({ models: [this.model.uuid] });

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