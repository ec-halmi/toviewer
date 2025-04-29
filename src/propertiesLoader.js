// propertiesLoader

export class PropertiesLoader {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.model = this.world.model;

    // main box
    const infoBoxId = "element-details-box";
    this.infoBoxElem = document.getElementById(infoBoxId);
    // content box
    const infoBodyId = "element-card-body";
    this.infoBoxBody = document.getElementById(infoBodyId);
    // info card
    this.infoCard = document.getElementById("element-card");

    this.btnListeners();
    this.enableDragDiv();
  }

  btnListeners() {
    const closeBtn = document.getElementById("element-details-box-close");
    closeBtn.onclick = e => {
      e.preventDefault();
      this.infoBoxElem.style.display = "none";
      this.infoBoxBody.innerHTML = "";
    };

    const minimiseBtn = document.getElementById("element-details-box-minimise");
    minimiseBtn.onclick = e => {
      e.preventDefault();
      this.infoBoxBody.classList.toggle("active");

      if (this.infoBoxBody.classList.contains("active")) {
        this.infoBoxBody.style.display = "none";
      } else {
        this.infoBoxBody.style.display = "block";
      }
    };
  }

  display(data) {
    this.infoBoxElem.style.display = "block";

    // reset position of card
    this.infoCard.style.left = "unset";
    this.infoCard.style.top = "unset";
  }

  // closeInfoEvent(event) {
  // }

  /** implement drag and drop for card
   * 
   * dont implement on the main div as its position=absoulute. this way we can easily reset the position of the card.
   * 
   */
  enableDragDiv() {
    const card = this.infoCard;
    const dragHandle = document.getElementById("element-card");

    let offsetX = 0, offsetY = 0;
    let isDragging = false;

    // Start dragging
    dragHandle.addEventListener('mousedown', function (e) {
      isDragging = true;
      offsetX = e.clientX - card.offsetLeft;
      offsetY = e.clientY - card.offsetTop;
      card.style.cursor = 'grabbing';
    });

    // Move
    document.addEventListener('mousemove', function (e) {
      if (isDragging) {
        card.style.left = `${e.clientX - offsetX}px`;
        card.style.top = `${e.clientY - offsetY}px`;
      }
    });

    // Stop dragging
    document.addEventListener('mouseup', function () {
      isDragging = false;
      card.style.cursor = 'grab';
    });
  }
}