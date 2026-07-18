gsap.registerPlugin(Draggable);

if ( 'lottie' in window ) {
  lottie.loadAnimation({
    container: document.getElementById("eventLoader"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: eventLoadLottie,
  });  
}



function putEvent(url, cb = () => {}) {
  fetch(url + "/" + tali.constructParams(true).join("/") + "/fragment:true")
    .then((response) => response.text())
    .then((data) => {
      $("body").removeClass("loading-event");
      $(".event-popup").html(data);
      tali.initEventBookmarkButton();
      $("body")
        .removeClass("home-page map-page country-page")
        .addClass("event-page");
      tali.saveState("event-url-" + url);
      cb();
      $('.main-heading').remove();
    });
  $("body").addClass("loading-event");
}

// function prevEvent() {
//     $( "body" ).removeClass( "event-page-ready" );
//     gsap.to( ".event-popup-capsule", {
//         x: "180",
//         duration: 0.5,
//         onComplete() {
//             putEvent( $( ".event-prev-arrow" ).attr( "href" ), () => {
//                 // NIR: use this to move between event pages
//                 $( "body" ).addClass( "event-page-ready" );
//                 gsap.fromTo( ".event-popup-capsule", {
//                     x: "-180",
//                 }, {
//                     x: 0,
//                     duration: 0.5
//                 } );
//             } );
//         }
//     } );
// }

// function nextEvent() {
//     $( "body" ).removeClass( "event-page-ready" );
//     gsap.to( ".event-popup-capsule", {
//         x: "-180",
//         duration: 0.3,
//         onComplete() {
//             putEvent( $( ".event-next-arrow" ).attr( "href" ), () => {
//                 $( "body" ).addClass( "event-page-ready" );
//                 gsap.fromTo( ".event-popup-capsule", {
//                     x: "180",
//                 }, {
//                     x: 0,
//                     duration: 0.3
//                 } );
//             } );
//         }
//     } );
// }

function prevEvent() {
  function handleEventTransition() {
    const prevHref = $(".event-prev-arrow").attr("href");
    putEvent(prevHref, () => {
      $("body").addClass("event-page-ready");
      gsap.fromTo(
        ".event-popup-capsule",
        {
          x: "-180",
        },
        {
          x: 0,
          duration: 0.3,
        }
      );
    });
  }

  $("body").removeClass("event-page-ready");
  gsap.to(".event-popup-capsule", {
    x: "180",
    duration: 0.3,
    delay: 0.3, // Add a delay if needed
    onComplete: handleEventTransition, // Call the inner function here
  });
}

function nextEvent() {
  function handleEventTransition() {
    const nextHref = $(".event-next-arrow").attr("href");
    putEvent(nextHref, () => {
      $("body").addClass("event-page-ready");
      gsap.fromTo(
        ".event-popup-capsule",
        {
          x: "180",
        },
        {
          x: 0,
          duration: 0.3,
        }
      );
    });
  }
  $("body").removeClass("event-page-ready");
  gsap.to(".event-popup-capsule", {
    x: "-180",
    duration: 0.3,
    delay: 0.3,
    handleEventTransition, // Call the inner function here
  });
}

class Event {
  constructor(data, tl) {
    const defaults = {
      title: "",
      description: "",
      year: 0,
    };

    this.content = defaults;

    this.type = "event";

    this.isSettled = true;
    this.settleTimeout = null;
    this.settleCallStack = [];

    Object.assign(this.content, data);

    this.timeline = tl;

    this.createObjects();
  }

  onSettle(cb) {
    if (this.isSettled) {
      cb();
    } else {
      this.settleCallStack.push(cb);
    }
  }

  settle() {
    this.isSettled = true;
    while (this.settleCallStack.length) {
      this.settleCallStack.shift()();
    }
  }

  unsettle() {
    clearTimeout(this.settleTimeout);
    this.isSettled = false;
    this.settleTimeout = setTimeout(() => {
      this.settle();
    }, 250);
  }

  get year() {
    return parseInt(this.content.year) ?? 0;
  }

  set year(value) {
    this.content.year = value;
  }

  get country() {
    if ("country" in this.content) {
      return this.content.country;
    }
    return [];
  }

  set country(value) {
    if ("country" in this.content) {
      if (value === null) {
        this.content.country = [];
      } else if (Array.isArray(value)) {
        this.content.country = value;
      } else if (!this.content.includes(value)) {
        this.content.push(value);
      }
    }
  }

  get position() {
    if (!("point" in this)) {
      return new paper.Point(0, 0);
    }
    return this.point.position;
  }

  set position(value) {
    if ("point" in this) {
      this.point.position.set(value);
      if (this.point.position.x > tali.getTimelinesFromXPosition()) {
        this.point.locked = false;
        this.point.opacity = 1;
      } else {
        this.point.locked = true;
        // this.point.opacity = this.point.position.x / ( tali.getTimelinesFromXPosition() );
        this.point.opacity = 0.25;
      }
    }
  }

  isRelevant(props = {}) {
  // 1) טווח שנים (כמו שהיה)
    const inRange = ("noRange" in props ||
      tali.isWithinRange(this.year, "forDisplay" in props, this.timeline.name));

    // 2) טיפול מיוחד בתגית bookmarks (ווירטואלית)
    const includesBookmarksTag = tali.hasBookmarkFilter();
    const isBookmarked = includesBookmarksTag
      ? tali.isBookmarked(this.content.id)   
      : false;

    const dontFilterGlobal = this.timeline.isGlobal && ( (!("filterGlobal" in props)) || (!props.filterGlobal) );

    const passesFilters =
      ("noFilters" in props) ||
      dontFilterGlobal ||  // ציר אירועים בעולם לא מושפע מפילטרים
      tali.isWithinFilters(this.content.filters) ||
      (includesBookmarksTag && isBookmarked);

    const matchesCountry =
      ("noCountry" in props ||
        tali.currentCountry === null ||
        this.country.includes(tali.currentCountry) ||
        (this.country === "PS" && tali.currentCountry === "IL"));

    const matchesSearch = ("noSearch" in props || dontFilterGlobal || this.isSearchMatch());  // ציר אירועים בעולם לא מושפע מחיפוש

    return inRange && passesFilters && matchesCountry && matchesSearch;
  }

  getLabelDetails() {
    let countryLabel = "";
    if ("country" in this.content && this.content.country.length > 0) {
      countryLabel =
        this.content.country_name != null && this.content.country_name != ""
          ? this.content.country_name
          : getCountryName( this.content.country[ 0 ] );
    } else {
      countryLabel = this.content.country_name ?? "";
    }
    const yearLabel =
      this.content.year_name != null && this.content.year_name != ""
        ? this.content.year_name
        : ( this.content.accuracy ? window.approximateTemplate.replace( "%d", this.content.year ) : this.content.year );
    if (countryLabel) {
      return countryLabel + " · " + yearLabel;
    }
    return yearLabel;
  }

  destroyLabel() {
    if (!("$label" in this)) return;
    this.$label.find(".event-label-contents > span").css("opacity", "0");
    if (this.content.img) {
      gsap.to(this.$label.find(".event-label-thumbnail").get(0), {
        scale: 0,
        duration: 0.25,
      });
    }
    gsap.to(this.$label.find(".event-label-contents").get(0), {
      width: 56,
      duration: 0.25,
    });
    gsap.to(this.$label.find(".event-label-contents").get(0), {
      scale: 0,
      delay: 0.3,
      duration: 0.2,
    });
    gsap.to(this.$label.get(0), {
      scale: 0,
      delay: 0.5,
      duration: 0.25,
      onComplete: () => {
        if ("$label" in this) {
          this.$label.remove();
          delete this.$label;
        }
      },
    });
  }

  createLabel() {
    tali.destroyLabels();
    const $label = $(document.getElementById("timeline_label_template").content)
      .find(".event-label")
      .clone();
    $label.find(".event-label-title").html(this.content.title);
    $label.find(".event-label-details").html(this.getLabelDetails());
    if (this.content.img) {
      $label.find(".event-label-thumbnail").attr("src", this.content.img);
      $label.addClass("has-thumbnail");
      gsap.fromTo(
        $label.find(".event-label-thumbnail").get(0),
        {
          scale: 0,
        },
        {
          scale: 1,
          delay: 0.35,
          duration: 0.25,
        }
      );
    }
    $label.css({
      left: vp.x + this.position.x,
      top: vp.y + this.position.y,
    });
    $("#labels_depot").append($label);
    gsap.fromTo(
      $label.get(0),
      {
        scale: 0,
      },
      {
        scale: 1,
        duration: 0.25,
      }
    );
    $label.find(".event-label-contents > span").css("width", "fit-content");
    const targetWidth = Math.min(
      400,
      Math.max(
        120,
        ...$label
          .find(".event-label-contents > span")
          .toArray()
          .map(
            (el) =>
              $(el).width() +
              ($label.hasClass("has-thumbnail")
                ? 95
                : $label.hasClass("has-thumbnail")
                ? 95
                : 60)
          )
      )
    );
    $label.find(".event-label-contents > span").css("width", "");
    gsap.fromTo(
      $label.find(".event-label-contents").get(0),
      {
        scale: 0,
        transformOrigin: "center center",
      },
      {
        scale: 1,
        delay: 0.1,
        duration: 0.2,
      }
    );
    $label
      .find(".event-label-contents > span")
      .css("width", targetWidth + "px");
    setTimeout(function () {
      $label.find(".event-label-contents > span").css("opacity", "1");
    }, 300);
    gsap.fromTo(
      $label.find(".event-label-contents").get(0),
      {
        width: 56,
        transformOrigin: "center center",
      },
      {
        width: targetWidth,
        delay: 0.3,
        duration: 0.2,
      }
    );
    // setTimeout( () => {
    $label.on("mouseleave", (e) => {
      this.destroyLabel();
    });
    $label.on("click", (e) => {
      this.destroyLabel();
      this.timeline.enter();
      this.putEvent();
    });
    // }, 250 );
    tali.labelsDepot.push(this);
    this.$label = $label;
    return $label;
  }

  putEvent() {
    putEvent(this.content.url);
  }

  createObjects() {
    const circle = new paper.Shape.Circle([0, 0], 6);
    circle.fillColor = this.timeline.isGlobal ? "black" : "white";

    // const triggerCircle = new paper.Shape.Circle([0, 0], 16);
    // triggerCircle.fillColor = new paper.Color(1, 1, 1, 0.125);

    const point = new paper.Group({
      // children: [circle, triggerCircle],
      children: [circle],
      position: vp.origin,
      applyMatrix: false,
    });
    // nir:
    let enterTimeout1, enterTimeout2;

    point.onMouseEnter = () => {
      document.body.classList.add("hoverover");
      marker.snap(this.year);

      enterTimeout1 = setTimeout(() => {
        marker.goto(this.position.x);
      }, 1000 / 60);

      enterTimeout2 = setTimeout(() => {
        this.createLabel();
      }, 100);
    };

    point.onMouseLeave = () => {
      document.body.classList.remove("hoverover");
      marker.unsnap();

      // Clear the timeouts to prevent execution
      clearTimeout(enterTimeout1);
      clearTimeout(enterTimeout2);
    };

    this.point = point;
  }

  hideInOrigin() {
    if (this.year > tali.toYear) {
      this.position = [vp.x + vp.width, this.timeline.yPosition];
    } else if (this.year < tali.fromYear) {
      this.position = vp.origin;
    }
    this.hide(true);
    this.point.position = this.position;
  }

  hide(noTransition = false) {
    if (!this.point.visible) return;
    if (this.content.highlight) {
      this.destroyHighlight();
    }
    if (noTransition) {
      this.point.visible = false;
      return;
    }
    this.unsettle();
    gsap.to(this.point, {
      scaling: 0,
      duration: 0.25,
      onComplete: () => {
        this.point.visible = false;
      },
    });
  }

  show(noTransition = false) {
    if (this.point.visible && this.point.scaling.x > 0) return;
    this.unsettle();
    if (this.content.highlight) {
      this.onSettle(() => {
        this.createHighlight();
      });
    }
    if (noTransition) {
      this.point.visible = true;
      this.point.scaling = new paper.Point(1, 1);
      return;
    }
    const o = { scaling: 0 };
    gsap.to(o, {
      scaling: 1,
      duration: 0.25,
      onUpdate: () => {
        this.point.scaling = o.scaling;
      },
      onComplete: () => {
        this.point.scaling = 1;
      },
    });
    this.point.visible = true;
  }

  isHidden() {
    return this.point.visible;
  }

  cluster(cluster, noTransition = false) {
    this._cluster = cluster;
    this.hide(noTransition);
  }

  uncluster(noTransition = false, dontShowUnclusteredPoints = false) {
    if ("_cluster" in this) {
      this._cluster.events.splice(this._cluster.events.indexOf(this), 1);
      this._cluster.updateClusterSize();
      delete this._cluster;
    }
    if (dontShowUnclusteredPoints) return;
    this.show(noTransition);
  }

  isClustered() {
    if ("_cluster" in this) {
      return this._cluster;
    }
    return false;
  }

  createHighlight() {
    const that = this;
    if (this.highlight) return;
    if (!this.content.highlight || !this.content.img || !"point" in this)
      return;

    const image = new paper.Raster({
      source: this.content.img,
      size: [44, 44],
      smoothing: "medium",
      onLoad() {
        this.scaling = 44 / Math.min(this.width, this.height);
      },
    });

    const highlight = new paper.Group({
      children: [
        new paper.Shape.Circle({
          center: [0, 0],
          radius: 22,
        }),
        image,
        new paper.Shape.Circle({
          center: [0, 0],
          radius: 22,
          strokeColor: "white",
          strokeWidth: 4,
        }),
      ],
      applyMatrix: false,
      clipped: true,
      locked: true,
    });

    this.point.addChild(highlight);

    // const $highlight = $( document.getElementById( 'timeline_highlight_template' ).content ).find( ".event-highlight" ).clone();
    // $highlight.find( ".event-highlight-image" ).attr( "src", this.content.img );
    // $highlight.css( {
    //     left: vp.x + this.position.x,
    //     top: vp.y + this.position.y
    // } );
    // $( "#highlights_depot" ).append( $highlight );

    tali.highlightsDepot.push(this);
    highlight.scaling = 0;
    setTimeout(() => {
      this.onSettle(() => {
        gsap.fromTo(
          highlight,
          {
            scaling: 0,
          },
          {
            scaling: 1,
            duration: 0.5,
            ease: "bounce",
            onComplete: () => {
              this.point.children[0].scaling = 3.6;
              // console.log( this.point.children[ 0 ] );
            },
          }
        );
      });
    }, 500);
    this.highlight = highlight;
    return highlight;
  }

  destroyHighlight() {
    if (!("highlight" in this)) return;
    gsap.to(this.highlight, {
      scaling: 0,
      duration: 0.25,
      ease: "bounce",
      overwrite: "auto",
      // onInterrupt: () => {
      //     if ( 'highlight' in this ) {
      //         this.highlight.remove();
      //         delete this.highlight;
      //     }
      // },
      onComplete: () => {
        if ("highlight" in this) {
          this.highlight.remove();
          delete this.highlight;
          if (tali.highlightsDepot.indexOf(this)) {
            tali.highlightsDepot.splice(tali.highlightsDepot.indexOf(this), 1);
          }
          this.point.children[0].scaling = 1;
          // console.log("Destroyed on completed");
        }
      },
    });
  }

  arrive() {
    const path = this.timeline.backPath;
    const isGlobal = this.timeline.name == 'global';
    const point = this.point;
    const pathOffset = this.timeline.timelinePathOffset;
    const pathLength = this.timeline.timelinePathLength;
    point.visible = false;
    point.scaling = 1;
    const pt = point.clone();
    const o = { p: isGlobal ? 0 : -0.25 };
    const that = this;
    gsap.to(o, {
      p: tali.getTimelineOffset(this.year),
      duration: 2,
      ease: "sine.inOut",
      onUpdate() {
        that.unsettle();
        pt.position = path.getPointAt(pathOffset + o.p * pathLength);
        pt.visible = true;
      },
      onComplete() {
        pt.remove();
        point.position = path.getPointAt(
          pathOffset + tali.getTimelineOffset(that.year) * pathLength
        );
        point.visible = true;
        that.createHighlight();
      },
    });
  }

  leave() {
    const path = this.timeline.backPath;
    const isGlobal = this.timeline.name == 'global';
    const point = this.point;
    const pathOffset = this.timeline.timelinePathOffset;
    const pathLength = this.timeline.timelinePathLength;
    const that = this;
    point.visible = false;
    const pt = point.clone();
    const o = { p: tali.getTimelineOffset(this.year) };
    this.destroyHighlight();
    gsap.to(o, {
      p: isGlobal ? 0 : -0.25,
      duration: 2,
      ease: "sine.inOut",
      onUpdate() {
        that.unsettle();
        pt.position = path.getPointAt(pathOffset + o.p * pathLength);
        pt.visible = true;
      },
      onComplete() {
        pt.remove();
        point.position = path.getPointAt(pathOffset - 0.1 * pathLength);
      },
    });
  }

  isSearchMatch() {
    const searchInput = tali.searchInput
      .replaceAll("׳", "'")
      .replaceAll("״", '"');

    if (searchInput === '') return true;

    const searchWords = searchInput
      .split(",")
      .map(w => w.trim())
      .filter(w => w !== "");


    const countryNames = (this.content.country || [])
    .map(code => getCountryName(code)) 
    .join(" ");

    const text = (
      this.content.title +
      " " +
      this.content.intro +
      " " +
      this.content.hidden_tags +
      " " + 
      this.content.country_name + 
      " " +
      countryNames
    )
      .replaceAll("׳", "'")
      .replaceAll("״", '"');

    let wordMatches = 0;

    for (const word of searchWords) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // שיפור: בדיקה שהמילה מוקפת ב"רווחים" או סימנים שאינם אותיות/מספרים — כולל סיומות HTML
      const regex = new RegExp(`(?:^|\\s|["'“”„()<>])${escapedWord}(?:$|\\s|["'“”„()<>.,!?])`, 'iu');

      if (regex.test(text)) {
        wordMatches += 1;
      }
    }

    return wordMatches === searchWords.length;
  }
}

class Viewport {
  constructor(container = window) {
    this._vp = container;
    this._$vp = $(container);
    this.updateDimensions();
    this._$vp.on("resize", () => this.updateDimensions());
  }

  updateDimensions() {
    this._w = this._$vp.width();
    this._h = this._$vp.height();
  }

  get origin() {
    return new paper.Point(0, this.height / 2);
  }

  get x() {
    if (this._vp === window) {
      return 0;
    }
    return this._vp.getBoundingClientRect().x;
  }

  get y() {
    if (this._vp === window) {
      return 0;
    }
    return this._vp.getBoundingClientRect().y;
  }

  get width() {
    return this._w;
  }

  get height() {
    return this._h;
  }

  get $() {
    return this._$vp;
  }
}

class Cluster {
  constructor(timeline, events) {
    this.timeline = timeline;
    this.events = Array.from(events);
    this.type = "cluster";
    this.createObject();
  }

  get position() {
    if (!("point" in this)) {
      return new paper.Point(0, 0);
    }
    return this.point.position;
  }

  set position(value) {
    if ("point" in this) {
      this.point.position.set(value);
      if (this.point.position.x > tali.getTimelinesFromXPosition()) {
        this.point.locked = false;
        this.point.opacity = 1;
      } else {
        this.point.locked = true;
        // this.point.opacity = this.point.position.x / ( vp.width / 5 - 20 );
        this.point.opacity = 0.25;
      }
    }
  }

  destroy(dontShowUnclusteredPoints = false) {
    for (let i = 0; i < this.events.length; i++) {
      this.events[i].uncluster(
        dontShowUnclusteredPoints,
        dontShowUnclusteredPoints
      );
    }
    this.point.remove();
  }

  destroyMenu() {
    if (!("$menu" in this)) return;
    gsap.to(this.$menu.get(0), {
      height: 0,
      duration: 0.25,
      onComplete: () => {
        if ("$menu" in this) {
          this.$menu.remove();
          $(document).off("click.menuCloseClick");
          delete this.$menu;
        }
      },
    });
  }

  createMenu() {
    tali.destroyMenus();

    const $menu = $(
      document.getElementById("timeline_cluster_menu_template").content
    )
      .find(".cluster-menu-container")
      .clone();
    const $menuItem = $(
      document.getElementById("timeline_cluster_menu_item_template").content
    )
      .find(".cluster-menu-list-item")
      .clone();

    for (let i = 0; i < this.events.length; i++) {
      let $item = $menuItem.clone();
      $item
        .find(".cluster-menu-list-item-link")
        .attr("href", this.events[i].content.url)
        .attr("data-event", this.events[i].content.id)
        .on("click", (e) => {
          e.preventDefault();
          this.destroyMenu();
          putEvent(e.currentTarget.href);
          this.timeline.enter();
        });
      $item
        .find(".cluster-menu-list-item-title")
        .html(this.events[i].content.title);
      $item
        .find(".cluster-menu-list-item-details")
        .html(this.events[i].getLabelDetails());
      $menu.find(".cluster-menu-list").append($item);
    }

    if (this.point.position.y - $(".site-header").height() < 250) {
      $menu.addClass("from-top");
      $menu.css({
        left: vp.x + this.point.position.x,
        top: vp.y + this.point.position.y + 50,
      });
    } else {
      $menu.css({
        left: vp.x + this.point.position.x,
        bottom: vp.y + vp.height - this.point.position.y,
      });
    }

    const updateMenuScrollState = () => {
      if (
        $menu.find(".cluster-menu").scrollTop() >=
        $menu.find(".cluster-menu-list").height() -
          $menu.find(".cluster-menu").height()
      ) {
        $menu.removeClass("more").addClass("bottom");
      } else {
        $menu.removeClass("bottom").addClass("more");
      }
    };

    $("#menus_depot").append($menu);

    gsap.fromTo(
      $menu.get(0),
      {
        height: 0,
      },
      {
        height: () => Math.min(240, $menu.find(".cluster-menu-list").height()),
        duration: 0.25,
        onComplete() {
          if ($menu.height() < $menu.find(".cluster-menu-list").height()) {
            updateMenuScrollState();
            $menu.find(".cluster-menu").on("scroll", updateMenuScrollState);
          }
        },
      }
    );

    setTimeout(() => {
      $menu.find(".cluster-menu-more-button").on("click", (e) => {
        const st = $menu.find(".cluster-menu").scrollTop();
        const items = $menu.find(".cluster-menu-list-item");
        for (let i = 0; i < items.length; i++) {
          if (Math.floor(st + items.eq(i).position().top) > st) {
            $menu.find(".cluster-menu").animate(
              {
                scrollTop: st + items.eq(i).position().top,
              },
              250
            );
            break;
          }
        }
      });
      $menu.find(".cluster-menu-go-to-top-button").on("click", (e) => {
        $menu.find(".cluster-menu").animate(
          {
            scrollTop: 0,
          },
          250
        );
      });
      $(document).on("click.menuCloseClick", (e) => {
        if (!$(e.target).parents(".cluster-menu-container").length) {
          this.destroyMenu();
        }
      });
    }, 100);
    tali.menusDepot.push(this);
    this.$menu = $menu;
    return $menu;
  }

  updateClusterSize() {
    this.point.children[0].radius = Math.min(12 + this.events.length * 0.1, 72);
  }

  getClusterLabelText() {
    if (this.events.length < 50) {
      return this.events.length;
    }
    return "50+";
  }

  createObject() {
    let year = 0;
    this.events[0].hide();
    const cluster = this;

    const fillColor = this.timeline.isGlobal ? "black" : "white";
    const textColor = this.timeline.isGlobal ? "white" : "black";

    const allEventsOfSameYear =
      this.events.length > 1 &&
      this.events.reduce(
        (acc, eve) => acc && eve.year == this.events[0].year,
        true
      );

    for (let i = 0; i < this.events.length; i++) {
      year += this.events[i].year;
      this.events[i].cluster(this);
    }

    year /= this.events.length;

    const point = new paper.Group({
      children: [
        new paper.Shape.Circle({
          center: [0, 0],
          radius: 12,
          strokeColor: fillColor,
          strokeWidth: 2,
          fillColor: fillColor,
        }),
        new paper.PointText({
          point: [0, 4],
          content: this.getClusterLabelText(),
          fontFamily: "editor-sans-italic",
          fontSize: 12,
          leading: 12,
          fillColor: "white",
          blendMode: "exclusion",
          justification: "center",
        }),
      ],
      applyMatrix: false,
    });
    point.onMouseEnter = function () {
      document.body.classList.add("hoverover");
      this.children[0].fillColor = textColor;
      if (!allEventsOfSameYear && cluster.events.length >= 10) {
        this.children[1].content = "+";
      }
    };
    point.onMouseLeave = function () {
      document.body.classList.remove("hoverover");
      this.children[0].fillColor = fillColor;
      if (!allEventsOfSameYear && cluster.events.length >= 10) {
        this.children[1].content = cluster.getClusterLabelText();
      }
    };
    point.onClick = () => {
      if ("$menu" in this) {
        this.destroyMenu();
      } else if (!allEventsOfSameYear && this.events.length >= 10) {
        tali.setRange(
          this.events[0].year,
          this.events[this.events.length - 1].year
        );
      } else {
        this.createMenu();
      }
    };
    this.year = year;
    this.point = point;
    this.position = this.timeline.frontPath.getPointAt(
      this.timeline.timelinePathOffset +
        tali.getTimelineOffset(year) * this.timeline.timelinePathLength
    );
    this.updateClusterSize();
    return point;
  }

  hide() {
    this.point.visible = false;
  }

  show() {
    this.point.visible = true;
  }

  arrive() {
    const that = this;
    const path = this.timeline.backPath;
    const isGlobal = this.timeline.name == 'global';
    const pathOffset = this.timeline.timelinePathOffset;
    const pathLength = this.timeline.timelinePathLength;
    const point = this.point;
    point.visible = false;
    const pt = point.clone();
    const o = { p: isGlobal ? 0 : -0.25 };
    gsap.to(o, {
      p: tali.getTimelineOffset(this.year),
      duration: 2,
      ease: "sine.inOut",
      onUpdate() {
        pt.position = path.getPointAt(pathOffset + o.p * pathLength);
        pt.visible = true;
      },
      onComplete() {
        pt.remove();
        that.position = path.getPointAt(
          pathOffset + tali.getTimelineOffset(that.year) * pathLength
        );
        point.visible = true;
      },
    });
  }

  leave() {
    const that = this;
    const path = this.timeline.backPath;
    const isGlobal = this.timeline.name == 'global';
    const pathOffset = this.timeline.timelinePathOffset;
    const pathLength = this.timeline.timelinePathLength;
    const point = this.point;
    point.visible = false;
    const pt = point.clone();
    const o = { p: tali.getTimelineOffset(this.year) };
    gsap.to(o, {
      p: isGlobal ? 0 : -0.25,
      duration: 2,
      ease: "sine.inOut",
      onUpdate() {
        pt.position = path.getPointAt(pathOffset + o.p * pathLength);
        pt.visible = true;
        // pt.visible = true;
      },
      onComplete() {
        pt.remove();
        that.position = path.getPointAt(pathOffset + -0.1 * pathLength);
      },
    });
  }
}

class Timeline {
  constructor(name, title, yPosition, colors, isGlobal, eventsData) {
    this.name = name;
    this.title = title;
    this._yPosition = yPosition;
    this._colors = colors;
    this.isGlobal = isGlobal;
    this.clusters = [];
    this.startOffset = 0;

    Object.assign(this, this.createObjects(eventsData));
  }

  init() {
    this.hideAllEvents();
    this.startOffset = this.getStartOffset();
    $(window).on("resize", () => {
      this.startOffset = this.getStartOffset();
    });
  }

  getActiveObjects(props = {}) {
    const allObjects = this.events
      .filter((e) => e.isRelevant(props))
      .concat(this.clusters);
    allObjects.sort((a, b) => a.year - b.year);
    return allObjects;
  }

  getActiveEventObjects(props = {}) {
    const allObjects = this.getActiveObjects(props);
    const points = [];
    for (let i = 0; i < allObjects.length; i++) {
      points.push(allObjects[i].point);
    }
    return points;
  }

  getEventObjects() {
    const allObjects = this.events;
    const points = [];
    for (let i = 0; i < allObjects.length; i++) {
      points.push(allObjects[i].point);
    }
    return points;
  }

  get timelinePathOffset() {
    if (!"backPath" in this) {
      return 0;
    }
    if (this.isGlobal) {
      return 0;
    } else {
      return this.startOffset;
    }
  }

  get timelinePathLength() {
    if (!"backPath" in this) {
      return 0;
    }
    if (this.isGlobal) {
      return this.backPath.length - 180 - 130;
    } else {
      return this.backPath.length - 180 - this.startOffset - 130;
    }
  }

  get yPosition() {
    if (this.isGlobal) {
      return vp.height - 64;
    }
    return vp.height * this._yPosition;
  }

  get colors() {
    if (Array.isArray(this._colors)) {
      return new paper.Color(
        new paper.Gradient(this._colors),
        new paper.Point(0, vp.height / 2),
        new paper.Point(vp.width, vp.height / 2)
      );
    }
    return args._colors;
  }

  getStartOffset() {
    if (this.isGlobal) {
      return 0;
    }
    const x = tali.getTimelinesFromXPosition();
    const testerPath = new paper.Path([
      new paper.Point(x, 0),
      new paper.Point(x, vp.height),
    ]);
    // testerPath.strokeColor = 'black';
    const intersections = this.backPath.getIntersections(testerPath);
    testerPath.remove();
    if (intersections.length) {
      return intersections[0].offset;
    }
    return 0;
  }

  createPathSegments(path, isStraight, isFront = false) {
    path.removeSegments();
    if (isStraight) {
      path.add(new paper.Point(vp.width / 7, this.yPosition));
    } else {
      path.add(new paper.Point(-180, vp.height / 2));
      path.add(
        new paper.Segment(
          new paper.Point(0, vp.height / 2),
          new paper.Point(0, 0),
          new paper.Point(vp.width / 10, 0)
        )
      );
      path.add(
        new paper.Segment(
          new paper.Point(vp.width / 5, this.yPosition),
          new paper.Point(-vp.width / 10, 0),
          new paper.Point(0, 0)
        )
      );
    }
    path.add(
      new paper.Point(isFront ? vp.width - 130 : vp.width + 180, this.yPosition)
    );
  }

  recreatePaths() {
    this.createPathSegments(this.backPath, this.isGlobal);
    this.createPathSegments(this.frontPath, this.isGlobal, true);
    this.label.point.x = vp.width - 16;
    this.label.point.y = this.yPosition + 4;
  }

  createPath(args) {
    args = Object.assign(
      {
        strokeWidth: 1,
        blendMode: "normal",
        visible: true,
        isFront: false,
      },
      args
    );

    const path = new paper.Path({
      strokeCap: "round",
      strokeWidth: args.strokeWidth,
      blendMode: args.blendMode,
      visible: args.visible,
      applyMatrix: false,
    });

    path.strokeColor = "color" in args ? args.color : this.colors;

    this.createPathSegments(path, this.isGlobal, args.isFront);

    return path;
  }

  updateEventPositions() {
    let event,
      previousEvent,
      clusterEvents = [],
      clusters = [],
      relevantEventsNumber = 0;
    for (let i = 0; i < this.clusters.length; i++) {
      this.clusters[i].destroy(true);
    }
    this.clusters = [];
    for (let i = 0; i < this.events.length; i++) {
      event = this.events[i];
      if (!event.isRelevant({ forDisplay: true })) {
        event.hide();
        continue;
      }
      relevantEventsNumber += 1;
      // event.destroyHighlight();
      event.unsettle();
      event.position = this.frontPath.getPointAt(
        this.timelinePathOffset +
          tali.getTimelineOffset(event.year) * this.timelinePathLength
      );
      if (previousEvent) {
        if (
          clusterEvents.length < 100 &&
          Math.abs(
            this.frontPath.getOffsetOf(previousEvent.position) -
              this.frontPath.getOffsetOf(event.position)
          ) < tali.clusterPerimeter
        ) {
          if (event.content.highlight) {
            event.show(true);
            continue;
          }
          if (!clusterEvents.length && !previousEvent.content.highlight) {
            clusterEvents.push(previousEvent);
            previousEvent.hide();
          }
          clusterEvents.push(event);
          event.hide();
        } else {
          if (clusterEvents.length) {
            clusters.push(clusterEvents);
            clusterEvents = [];
          }
          if (event.isClustered()) {
            event.isClustered().destroy(true);
          }
          if (!previousEvent.isClustered()) {
            previousEvent.show(true);
          }
          event.show(true);
        }
      } else if (event.content.highlight) {
        event.show(true);
      }
      previousEvent = event;
    }
    if (relevantEventsNumber === 1) {
      previousEvent.show(true);
    }
    if (clusterEvents.length) {
      clusters.push(clusterEvents);
    }
    for (let i = 0; i < clusters.length; i++) {
      this.clusters.push(new Cluster(this, clusters[i]));
    }
  }

  hideAllEvents() {
    for (let i in this.events) {
      this.events[i].hide(true);
    }
    for (let j in this.clusters) {
      this.clusters[j].hide();
    }
  }

  updateObjectPositions() {
    this.recreatePaths();
    this.updateEventPositions();
  }

  createEvents(eventsData) {
    const events = [];
    eventsData.forEach((event) => {
      const e = new Event(event, this);
      events.push(e);
    });
    return events;
  }

  createObjects(eventsData) {
    const backPath = this.createPath({
      strokeWidth: this.isGlobal ? 88 : tali.backTimelineWidth,
      blendMode: "multiply",
      visible: false,
    });
    backPath.onMouseEnter = (e) => {
      $("body").addClass("timeline-hover");
    };
    backPath.onMouseLeave = (e) => {
      $("body").removeClass("timeline-hover");
    };
    backPath.onMouseDown = (e) => {
      $("body").addClass("timeline-grab");
    };
    backPath.onMouseUp = (e) => {
      $("body").removeClass("timeline-grab");
      tali.updateExistingPoints();
    };
    backPath.onMouseDrag = (e) => {
      if (
        tali.fromYear - e.delta.x > tali.minYear &&
        tali.toYear - e.delta.x < tali.maxYear
      ) {
        tali.setRange(tali.fromYear - e.delta.x, tali.toYear - e.delta.x, true);
        // tali.updateState();
      }
    };
    const frontPath = this.createPath({
      color: this.isGlobal
        ? new paper.Color(0.4375, 0.4375, 0.4375, 0.3)
        : "white",
      straight: this.isGlobal,
      visible: false,
      isFront: true,
    });
    const events = this.createEvents(eventsData);
    const title = this.title.split(" ").reduce((acc, word) => {
      if ((acc + word).split("\n").pop().length > 16) {
        acc += "\n";
      }
      acc += word + " ";
      return acc;
    }, "");
    const label = new paper.PointText({
      point: [vp.width - 16 + 120, this.yPosition + 4],
      visible: false,
      content: title,
      fillColor: "black",
      fontFamily: "editor-sans-italic",
      fontWeight: "normal",
      fontSize: 15,
      justification: "right",
    });
    return {
      backPath: backPath,
      frontPath: frontPath,
      events: events,
      label: label,
    };
  }

  enter() {
    if (tali.currentCountry == null) {
      $("body").addClass("timeline-event");
    } else {
      $("body").addClass("country-event");
    }
    const keys = Object.keys(tali.timelines);
    this.backPathOriginalPos = this.backPath.position.clone();
    gsap.to(this.backPath, {
      strokeWidth: () => Math.max((vp.width / 100) * 28, 480) * 0.75,
      scaling: 1.5,
      duration: 0.5,
    });
    if (this.name != "global") {
      gsap.to(this.backPath.position, {
        x: "-=180",
        y: () => {
          return "-=" + (this.yPosition - vp.height / 2) * 1.25;
        },
        duration: 1,
      });
    } else {
      gsap.to(this.backPath.position, {
        x: "-=180",
        y: () => {
          return "-=" + (this.yPosition - vp.height / 1.7) * 1.25;
        },
        duration: 1,
      });
    }
    for (let i = 0; i < keys.length; i++) {
      gsap.to(tali.timelines[keys[i]].label.point, {
        x: "+=120",
        ease: "power1.in",
        duration: 0.5,
        delay: i * 0.1,
        callbackScope: tali.timelines[keys[i]].label,
        onComplete() {
          this.visible = false;
        },
      });
      if (this !== tali.timelines[keys[i]]) {
        gsap.to(tali.timelines[keys[i]].backPath, {
          opacity: 0,
          scaling: 0.8,
          duration: 0.5,
        });
      }
      gsap.to(
        [
          tali.timelines[keys[i]].frontPath,
          ...tali.timelines[keys[i]].getActiveEventObjects(),
        ],
        {
          opacity: 0,
          locked: true,
          duration: 0.5,
        }
      );
    }

    tali.currentTimeline = this;
    marker.hide();
  }

  leave() {
    // if($('body').hasClass('country-event')) {
    //     $('body').addClass('map-page')
    // }
    const keys = Object.keys(tali.timelines);
    gsap.to(this.backPath, {
      strokeWidth: tali.backTimelineWidth,
      scaling: 1,
      duration: 0.5,
    });
    gsap.to(this.backPath.position, {
      x: this.backPathOriginalPos.x,
      y: this.backPathOriginalPos.y,
      duration: 0.5,
    });
    for (let i = 0; i < keys.length; i++) {
      tali.timelines[keys[i]].label.visible = true;
      gsap.to(tali.timelines[keys[i]].label.point, {
        x: vp.width - 16,
        ease: "power1.in",
        duration: 0.5,
        delay: i * 0.1,
      });
      if (this !== tali.timelines[keys[i]]) {
        gsap.to(tali.timelines[keys[i]].backPath, {
          opacity: 1,
          scaling: 1,
          duration: 0.5,
        });
      }
      gsap.to(
        [
          tali.timelines[keys[i]].frontPath,
          ...tali.timelines[keys[i]].getActiveEventObjects(),
        ],
        {
          opacity: 1,
          locked: false,
          duration: 0.5,
        }
      );
    }

    tali.currentTimeline = null;
    marker.show();
  }
}

class Marker {
  constructor() {
    this.snapValue = null;
  }

  init() {
    const marker = new paper.Path.Line({
      from: [vp.width / 2, 170],
      to: [vp.width / 2, vp.height],
      strokeColor: "black",
      locked: true,
      opacity: 0,
    });

    const markerLabel = new paper.Group({
      children: [
        new paper.Shape.Rectangle({
          point: [0, 0],
          size: [40, 16],
          radius: 8,
          fillColor: "black",
        }),
        new paper.PointText({
          point: [20, 12],
          content: "1924",
          fontFamily: "editor-sans-italic",
          fontSize: 12,
          leading: 12,
          fillColor: "white",
          blendMode: "exclusion",
          justification: "center",
        }),
      ],
      opacity: 0,
      position: [vp.width / 2, vp.height - 32],
      applyMatrix: false,
    });

    marker.bringToFront();
    markerLabel.bringToFront();

    this.marker = marker;
    this.label = markerLabel;

    if ($("body").hasClass("home-page") && $("body").hasClass("country-page")) {
      gsap.to([marker, markerLabel], {
        opacity: 1,
        duration: 0.5,
        delay: 5,
      });
    }


    paper.view.onMouseMove = (e) => {
      if (this.snapValue) return;
      this.goto(e.point.x);
    };

    $(document).on("mouseenter", ".years-range-select", (e) => {
      if (
        !$("body").hasClass("home-page") &&
        !$("body").hasClass("country-page")
      )
        return;
      this.hide();
    });

    $(document).on("mouseleave", ".years-range-select", (e) => {
      if (
        !$("body").hasClass("home-page") &&
        !$("body").hasClass("country-page")
      )
        return;
      this.show();
    });
  }

  updatePositions() {
    if ("marker" in this && "label" in this) {
      this.marker.segments[this.marker.segments.length - 1].point.y = vp.height;
      this.label.position.y = vp.height - 32;
    }
  }

  goto(x) {
    gsap.to([this.marker.position, this.label.position], {
      x: x,
      duration: 0.25,
      overwrite: "auto",
      onUpdate: () => {
        this.updateMarkerLabel();
      },
    });
  }

  updateMarkerLabel() {
    this.label.children[1].content = this.snapValue
      ? this.snapValue
      : Math.floor(
          ((this.label.position.x - 48) / (vp.width - 96)) * tali.range
        ) + tali.fromYear;
  }

  snap(year) {
    this.snapValue = year;
  }

  unsnap() {
    this.snapValue = null;
  }

  hide() {
    gsap.to([this.marker, this.label], {
      opacity: 0,
      duration: 0.5,
    });
  }

  show() {
    gsap.to([this.marker, this.label], {
      opacity: 1,
      duration: 0.5,
    });
    this.marker.bringToFront();
    this.label.bringToFront();
  }

  
}

const marker = new Marker();

class App {
  constructor() {
    this.labelsDepot = [];
    this.menusDepot = [];
    this.highlightsDepot = [];

    this.fromYearEl = document.getElementById("from_year");
    this.toYearEl = document.getElementById("to_year");

    this.searchFormFromYearEl = document.getElementById("search_form_from");
    this.searchFormToYearEl = document.getElementById("search_form_to");

    this.cacheYearProperties();
    this.updateAllYearFields();

    this.fromYearEl.addEventListener("input", () => this.cacheYearProperties());
    this.toYearEl.addEventListener("input", () => this.cacheYearProperties());

    this.minYear = parseInt(this.fromYearEl.min);
    this.maxYear = parseInt(this.fromYearEl.max);

    this.clusterPerimeter = 40;

    this.minTlWidth = 14;

    this.timelines = {};

    this.currentTimeline = null;

    this.filters = [];
    this.populateFilters();
    this.updateBookmarksMenu()
    this._collapsed = true;

    this.currentCountry = null;

    this.searchInput = $("#search").val();

    this.updateStateTimeout = null;

    this.originalMainHeading = $('.main-heading').clone();
  }

  get maxTlWidth() {
    return vp.height * 0.8 * 0.245;
  }

  updateUrl(fromYear, toYear, filters = [], searchText = "") {
    let queryString = filters.length > 0 ? `filters:${filters.join("-")}` : "";
    let searchString = searchText
      ? `search:${searchText.split(/\s+/).join("-")}`
      : "";

    let newUrl = `${selfUrl}/from:${fromYear}/to:${toYear}`;
    if (queryString) newUrl += `/${queryString}`;
    if (searchString) newUrl += `/${searchString}`;

    // window.history.replaceState(null, '', newUrl);
    this.saveState();
  }

  populateFilters() {
    const that = this;
    $('.header-tag input[type="checkbox"]:checked').each(function () {
      that.filters.push($(this).attr("name"));
    });
    this.updateUnlistedCheckedTagsIndicator();
  }

  updateAllYearFields() {
    this.fromYearEl.value = this.fromYear;
    this.toYearEl.value = this.toYear;
    this.searchFormFromYearEl.value = this.fromYear;
    this.searchFormToYearEl.value = this.toYear;
    this.searchFormFromYearEl.max = this.toYear - 1;
    this.searchFormToYearEl.min = this.fromYear + 1;
  }

  cacheYearProperties() {
    this._fromYear = parseInt(this.fromYearEl.value);
    this._toYear = parseInt(this.toYearEl.value);
  }

  initParticles() {
    if (!taliConfig.enableParticles) return;

    if (typeof particlesDataUrl !== "undefined")
      particlesJS.load("particles-js", particlesDataUrl);

    gsap.to("#particles-js", {
      opacity: 1,
      duration: 5,
    });
  }

  getTimelinesFromXPosition() {
    return vp.width / 6;
  }

  setRange(minYear = null, maxYear = null, noTransition = false, dontDestroyMenus = false) {
    if ( !dontDestroyMenus ) tali.destroyMenus();

    const $yearsRangeSelect = $(".years-range-select");
    const that = this;

    if (!minYear) {
      minYear = this.fromYear;
    }

    if (!maxYear) {
      maxYear = this.toYear;
    }

    if ("taliMap" in window) {
      taliMap.filterMarkers();
    }

    if (maxYear - minYear < 10) {
      var averageYear = Math.round((minYear + maxYear) / 2);
      maxYear = averageYear + 5;
      minYear = averageYear - 5;
    }

    if (maxYear > this.maxYear) {
      maxYear = this.maxYear;
    }

    if (maxYear < this.minYear) {
      maxYear = minYear + 10;
    }

    if (minYear < this.minYear) {
      minYear = this.minYear;
    }

    if (minYear > this.maxYear) {
      minYear = maxYear - 10;
    }

    if (noTransition) {
      this.fromYear = minYear;
      this.toYear = maxYear;
      $yearsRangeSelect.css({
        "--from": this.fromYear,
        "--to": this.toYear,
      });
      this.updateExistingPoints();
      this.updateEraLabels();
      this.checkEventsOutsideRange( true );
      this.updateState();
      return;
    }

    gsap.to(this, {
      fromYear: minYear,
      toYear: maxYear,
      duration: 0.5,
      onUpdate: () => {
        $yearsRangeSelect.css({
          "--from": this.fromYear,
          "--to": this.toYear,
        });
        this.updateExistingPoints();
        this.checkEventsOutsideRange();
      },
      onComplete: () => {
        $yearsRangeSelect.css({
          "--from": this.fromYear,
          "--to": this.toYear,
        });
        this.updateExistingPoints();
        this.updateEraLabels();
        this.checkEventsOutsideRange();
        this.saveState();
      },
    });
  }

  openSearchMenu() {
    $("body").addClass("search-menu-open expand-search-menu search-menu-width");
    $(".search-btn").attr("aria-expanded", "true");
  
    $("body").addClass("opacity-search-menu");
  
    const tryFocus = () => {
      const input = document.querySelector('.search-text-input');
      if (!input) return;
  
      input.focus();
  
      // נבדוק אם באמת התמקד
      if (document.activeElement !== input) {
        requestAnimationFrame(tryFocus); // ננסה שוב בלולאה
      } else {
        console.log('Focus succeeded');
      }
    };
  
    setTimeout(() => {
      requestAnimationFrame(tryFocus);
    }, 500); // חכה קצת ל־CSS transition
  }

  closeSearchMenu() {
    $("body").removeClass("opacity-search-menu");
    $("body").removeClass("expand-search-menu");

    // עדכון aria-expanded ל־false
    $(".search-btn").attr("aria-expanded", "false");

    setTimeout(function () {
      $("body").removeClass("search-menu-open");
    }, 250);

    setTimeout(function () {
      $("body").removeClass("search-menu-width");
    }, 500);
  }

  trapFocus(container) {
    const focusableEls = container
      .find('a, button, input, textarea, [tabindex]:not([tabindex="-1"])')
      .filter(":visible");
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    $(document).on("keydown.focusTrap", function (e) {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }

      if (e.key === "Escape") {
        $("#close-about-menu").trigger("click");
      }
    });
  }

  releaseFocusTrap() {
    $(document).off("keydown.focusTrap");
  }

  /// Bookmarks ///
  getBookmarks() {
    return JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
  }

  initEventBookmarkButton() {
  const $btn = $(".event-bookmark-btn");
  if (!$btn.length) return;

  // helpers קטנים לנרמול
  const toSlug = (v) => String(v || "").replace(/^\//, "").replace(/^events\//, "");
  const toFull = (v) => {
    let s = String(v || "").replace(/^\//, "");
    return s.startsWith("events/") ? s : `events/${s}`;
  };

  // ה-id שמגיע מהכפתור יכול להיות עם/בלי "events/"
  const rawId  = $btn.data("id") || "";
  const slugId = toSlug(rawId);      // לשימוש עם isBookmarked (שמצפה ל-slug)
  const fullId = toFull(rawId);      // לשמירה/מחיקה בלוקאל-סטורג'

  const event = {
    id: fullId,                      // נשמור תמיד בפורמט המלא
    title: $btn.data("title"),
    year: $btn.data("year"),
    country: $btn.data("country"),
  };

  // בדיקת מצב נוכחי – שולחים SLUG!
  const marked = this.isBookmarked(slugId);
  $btn.toggleClass("bookmarked", marked);

  // טוגל בלחיצה
  $btn.off("click").on("click", () => {
    if (this.isBookmarked(slugId)) { // בדיקה לפי SLUG
      this.removeBookmark(fullId);   // מחיקה לפי FULL
    } else {
      this.addBookmark(event);       // הוספה עם FULL
    }
    // ריענונים
    this.initEventBookmarkButton();
    this.updateBookmarksMenu?.();
  });
}

  saveBookmarks(bookmarks) {
    localStorage.setItem("bookmarkedEvents", JSON.stringify(bookmarks));
  }

  hasBookmarkFilter() {
    return this.filters.includes("bookmarks");
  }

  isBookmarked(id) {
    return this.getBookmarks().some(b => b.id === "events/" + id);
  }

  addBookmark(event) {
    console.log("📌 Bookmark added:", event);
    const bookmarks = this.getBookmarks();
    if (!bookmarks.find(b => b.id === event.id)) {
      bookmarks.push({
        id: event.id,
        title: event.title,
        year: event.year,
        country: event.country
      });
      this.saveBookmarks(bookmarks);
    }
  }

  removeBookmark(id) {
    console.log("❌ Bookmark removed:", id);
    const bookmarks = this.getBookmarks().filter(b => b.id !== id);
    this.saveBookmarks(bookmarks);
  }

  updateBookmarksMenu() {
    const t = window.translations || {};
    const $menu = $(".bookmarks-menu");
    $menu.empty();

    const bookmarks = this.getBookmarks();

    const validBookmarks = bookmarks.filter(b => b && b.id && b.title);
    $("body")
      .removeClass("has-any-bookmarks no-bookmarks")
      .addClass(validBookmarks.length > 0 ? "has-any-bookmarks" : "no-bookmarks");

    if (validBookmarks.length === 0) {
      $menu.append(`<li class="bookmarks-menu-empty">${t.bookmarks_empty || "לא נשמרו אירועים"}</li>`);
      return;
    }

    validBookmarks.forEach((event) => {
      const $item = $(`
        <li class="bookmarked-event">
          <a href="${event.id}" class="event-link">
            <div class="bookmark-title">${event.title}</div>
            <div class="bookmark-country-year">${event.country}, ${event.year}</div>
          </a>
          <button class="remove-bookmark" data-id="${event.id}" aria-label="${t.remove_bookmark || 'הסר סימניה'}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75 7C6.75 5.89543 7.64543 5 8.75 5H15.25C16.3546 5 17.25 5.89543 17.25 7V19.5L12 15L6.75 19.5V7Z" fill="#353433"/>
            </svg>
            

          </button>

        </li>
      `);
      $menu.append($item);
    });

    // מאזין להסרה
    $menu.find(".remove-bookmark").on("click", (e) => {
      e.preventDefault();
      const id = $(e.currentTarget).data("id");

      this.removeBookmark(id);

      // כמה נשארו אחרי ההסרה?
      const remaining = this.getBookmarks();           // ← שים סוגריים!
      // לחלופין, בלי תלות ב־this:
      // const remaining = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");

      if (remaining.length === 1) {
        $(".remove-bookmark-hover")
          .removeClass("show-remove-bookmark-hover")
      } 

      this.updateBookmarksMenu();

      // דיבאג אם צריך:
      // console.log('remaining bookmarks:', remaining);
    });
  }


  /// End Bookmarks ///

  initInputs() {
    const that = this;

    const $yearsRangeSelect = $(".years-range-select");

    const $searchInput = $(".search-text-input");
    const $submitButton = $(".search-submit-input");

    $submitButton.prop("disabled", true).addClass("disabled");

    $( ".mobile-form" ).on( "submit", e => {
      e.preventDefault();
      $.post( {
        url: rootUrl + "/add_mailing_list_contact.json",
        data: $( e.currentTarget ).serialize(),
        dataType: 'json',
        success( data ) {
          if ( data.success ) {
            $( ".mobile-form" ).addClass( "submitted" );
          } else {
            $( ".mobile-form" ).removeClass( "submitting" );
            if ( data.error ) {
              $( ".mobile-form" ).addClass( "error" );
              $( ".mobile-form-error" ).html( `<p>${data.error}</p>` );
            }
          }
        },
        error( error ) {
          console.error( error.statusText );
          $( ".mobile-form" ).removeClass( "submitting" ).addClass( "error" );
        }
      })
      $( ".mobile-form" ).addClass( "submitting" );
    } );

    $searchInput.on("input keyup", function () {
      const inputValue = $(this).val().trim();
      const inputLength = inputValue.length;
      if (inputLength === 0 || inputLength === 1) {
        $submitButton
          .prop("disabled", true)
          .removeClass("enabled")
          .addClass("disabled");
      } else {
        $submitButton
          .prop("disabled", false)
          .removeClass("disabled")
          .addClass("enabled");
      }
    });

    $yearsRangeSelect.css({
      "--from": this.fromYear,
      "--to": this.toYear,
    });

    $(document).on(
      "change",
      "#years-form input[name='from'], .years-filter-field input[name='from']",
      (e) => {
        this.fromYear = parseInt(e.currentTarget.value);
        this.setRange(null, null, true, true);
      }
    );

    $(document).on(
      "change",
      "#years-form input[name='to'], .years-filter-field input[name='to']",
      (e) => {
        this.toYear = parseInt(e.currentTarget.value);
        this.setRange(null, null, true, true);
      }
    );

    Draggable.create(".from-year-draggable-button", {
      type: "left",
      bounds: ".years-range-select-bounds.from-bounds",
      onDragStart() {
        $(this.target).addClass("dragging");
      },
      onDrag(e) {
        const from = Math.floor(
          (this.x / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        if (e.altKey) {
          const to = Math.min(
            that.toYear - (from - that.fromYear),
            that.maxYear
          );
          that.setRange(from, to, true);
        } else {
          that.setRange(from, that.toYear, true);
        }
        that.updateState();
      },
      onDragEnd() {
        const from = Math.floor(
          (this.x / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        $(this.target).removeClass("dragging").css("left", "");
        that.setRange(from, that.toYear, true);
        that.updateState();
      },
    });

    Draggable.create(".to-year-draggable-button", {
      type: "left",
      bounds: ".years-range-select-bounds.to-bounds",
      onDragStart() {
        $(this.target).addClass("dragging");
      },
      onDrag(e) {
        const to = Math.floor(
          ((this.x - 52) / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        if (e.altKey) {
          const from = Math.max(
            that.minYear,
            that.fromYear - (to - that.toYear)
          );
          that.setRange(from, to, true);
        } else {
          that.setRange(that.fromYear, to, true);
        }
        that.updateState();
      },
      onDragEnd() {
        const to = Math.floor(
          ((this.x - 52) / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        $(this.target).removeClass("dragging").css("left", "");
        that.setRange(that.fromYear, to, true);
        that.updateState();
      },
    });

    Draggable.create(".years-range-indicator", {
      type: "left",
      bounds: ".years-range-select",
      zIndexBoost: false,
      onDragStart() {
        gsap.set(this.target, {
          width: $(this.target).width(),
        });
      },
      onDrag() {
        const from = Math.floor(
          (this.x / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        const to = Math.floor(
          ((this.x + $(this.target).width() - 96) / (vp.width - 96)) *
            tali.totalYears +
            tali.minYear
        );
        that.setRange(from, to, true);
        // that.updateState();
      },
      onDragEnd() {
        const from = Math.floor(
          (this.x / (vp.width - 96)) * tali.totalYears + tali.minYear
        );
        const to = Math.floor(
          ((this.x + $(this.target).width() - 96) / (vp.width - 96)) *
            tali.totalYears +
            tali.minYear
        );
        $(this.target).css({ width: "", left: "" });
        that.setRange(from, to, true);
        // that.updateState();
      },
    });

    $(document).on('keydown', '.from-year-draggable-button, .to-year-draggable-button', function (e) {
        let step = e.shiftKey ? 10 : 1;
        if ( e.altKey ) {
          step *= 10;
        }
        const isFrom = $(this).hasClass('from-year-draggable-button');
        let current = isFrom ? that.fromYear : that.toYear;
        const min = that.minYear;
        const max = that.maxYear;
      
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          current = Math.max(min, current - step);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          current = Math.min(max, current + step);
        } else {
          return;
        }
      
        e.preventDefault();
      
        if (isFrom) {
          if (current > that.toYear) current = that.toYear;
          that.setRange(current, that.toYear, true);
        } else {
          if (current < that.fromYear) current = that.fromYear;
          that.setRange(that.fromYear, current, true);
        }
      
        // עדכון ערכי ARIA
        $(this)
          .attr('aria-valuenow', current)
          .attr('aria-valuetext', isFrom ? `${this.dataset.valuetextTemplate} ${current}` : `${this.dataset.valuetextTemplate} ${current}`);
      
      });
      

    $(".header-tag input").on("input", (e) => {
      const nameAttr = $(e.currentTarget).attr("name");
      if (nameAttr) {
        const index = that.filters.indexOf(nameAttr);
        if (index === -1) {
          that.filters.push(nameAttr);
        } else {
          that.filters.splice(index, 1);
        }
      }

      // window.history.replaceState( {}, null, that.constructUrl() );
      that.saveState();
      that.updateExistingPoints();
      that.showClearBtn();
      if ("taliMap" in window) {
        taliMap.filterMarkers();
      }

      this.updateUnlistedCheckedTagsIndicator();
    });

    $(document).on("wheel", "#main_timeline", (e) => {
      e.stopPropagation();

      let from = Math.max(
        that.minYear,
        that.fromYear - parseInt(e.originalEvent.deltaY)
      );
      let to = Math.min(
        this.toYear + parseInt(e.originalEvent.deltaY),
        that.maxYear
      );
      if (from > to) {
        from = parseInt((from + to) / 2);
        to = from;
        from -= 1;
        to += 1;
      }
      that.setRange(from, to);
      that.updateState();
    });

    $(".header-search-tags-form").on("submit search", (e) => {
      e.preventDefault();

      const searchText = $(e.target).parent().find(".search-text-input").val();
      that.searchInput = searchText;

      that.saveState();
      that.updateExistingPoints();
      if ("taliMap" in window) {
        taliMap.filterMarkers();
      }

      that.checkEventsOutsideRange();

      if (searchText === "") {
        $submitButton
          .prop("disabled", true)
          .removeClass("enabled")
          .addClass("disabled");
      }
      this.showClearBtn();
      this.updateSearchInputIndicator();
    });

      $(".show-all-results-btn").on("click", (e) => {
      let allRelevantEvents = this.getAllRelevantEvents({ noRange: true });

      // אם יש חיפוש פעיל, נסנן אירועים גלובליים שלא תואמים לחיפוש כדי שלא יטו את חישוב הטווח
      if (tali.searchInput !== "") {
        allRelevantEvents = allRelevantEvents.filter(
          (ev) => !ev.timeline.isGlobal || ev.isSearchMatch()
        );
      }

      if (allRelevantEvents.length > 0) {
        const years = allRelevantEvents
          .map((event) => event.year)
          .filter((year) => typeof year === "number" && !isNaN(year));
        let fromYear = Math.min(...years);
        let toYear = Math.max(...years);

        if (fromYear > this.minYear + 50) {
          fromYear -= 50;
        } else {
          fromYear = this.minYear;
        }

        this.setRange(fromYear, toYear);
        this.closeSearchMenu();
        $("body").removeClass("show-search-result-message");
      }
    });

    $(document).on("click", ".expand-header-tags-btn, .search-btn", (e) => {
      this.openSearchMenu();
    });

    $(document).on("click", ".close-search-menu-btn", (e) => {
      this.closeSearchMenu();
    });

    $(document).on("click", (e) => {
      if ($("body").hasClass("search-menu-open")) {
        const $target = $(e.target);
        if (!$target.closest(".header-search-tags-form, .search-btn").length) {
          this.closeSearchMenu();
        }
      }
    });

    this.updateEraLabels();
    this.updateSearchInputIndicator();
    this.showClearBtn();

    if (this.searchInput && this.searchInput.trim() !== "") {
      this.checkEventsOutsideRange();
    }

    $("#clearSearch").on("click", (e) => {
      this.clearSearch();
    });

    $("#clearAllSearch").on("click", (e) => {
      this.clearSearch();
      this.filters = [];
      $(".header-tag input").prop("checked", false);
      this.updateUnlistedCheckedTagsIndicator();
      that.saveState();
      that.updateExistingPoints();
      if ("taliMap" in window) {
        taliMap.filterMarkers();
      }
    });

    $(document).on("click", ".open-lightbox", function () {
      const imgSrc = $(this).data("src");
      $("body").addClass("show-lightbox");
      $("#lightbox-img")
        .attr("src", imgSrc)
        .on("load", function () {
          $("#lightbox").addClass("show");
        });
    });

    $(document).on("click", ".close-lightbox", function () {
      $("body").removeClass("show-lightbox");
      $("#lightbox").removeClass("show");
      setTimeout(() => {
        $("#lightbox-img").attr("src", "");
      }, 500);
    });

    const timelineStart = parseInt($("#years-form input").attr("min"), 10);
    const timelineEnd = parseInt($("#years-form input").attr("max"), 10);
    const timelineRange = timelineEnd - timelineStart;

    $(".front-eras .era-name").each(function () {
      const startYear = parseInt($(this).data("start"), 10);

      // Calculate start percentage
      const startPercentage =
        ((startYear - timelineStart) / timelineRange) * 100;

      // Apply CSS for positioning
      $(this).css({
        position: "absolute",
        left: `${startPercentage}%`,
      });
    });

    $(document).on("click", "#hamburger", function () {
      document.activeElement?.blur();
      that.expandAboutMenu( this );
      that.saveState();
      setTimeout( () => {
        $(".about-menu-main a" ).first().focus();
      }, 250);
    });
    

    $(document).on("click", "#close-about-menu, .about-menu-bg-close", function () {
      that.collapseAboutMenu( this );
      that.saveState();
      $( "#hamburger" ).first().focus();
    });
    
    document.querySelectorAll(".stagger").forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.1}s`;
    });

    $(".faq-btn").on("click", function () {
        const $btn = $(this);
        const $faqDropdown = $btn.closest(".faq-dropdown");
        const $faqAnswer = $faqDropdown.find(".faq-answer");
        const $answerHeight = $faqDropdown.find(".faq-answer-height").outerHeight(true);
        const isOpen = $faqDropdown.hasClass("expanded-dropdown");
      
        // סגור את כל השאלות
        $(".faq-answer").css("max-height", "0px").attr("aria-hidden", "true");
        $(".faq-btn").attr("aria-expanded", "false");
        $(".faq-dropdown").removeClass("expanded-dropdown");
      
        if (!isOpen) {
          // פתח את הנבחרת
          $faqAnswer
            .css("max-height", $answerHeight + "px")
            .attr("aria-hidden", "false");
      
          $btn.attr("aria-expanded", "true");
          $faqDropdown.addClass("expanded-dropdown");
        }
      });
      

    $(".contact-form").on("submit", (e) => {
      e.preventDefault();
      $.post({
        url: e.currentTarget.action,
        data: $(e.currentTarget).serialize(),
        dataType: "json",
        success(data) {
          if (data.success) {
            $(".contact-form").addClass("hide");
            $(".contact-form-success").addClass("visible");
          } else {
            $(".contact-form-alerts").empty().addClass("active");
            if ("alerts" in data) {
              data.alerts.forEach((alert) => {
                $(".contact-form-alerts").append(`<p>${alert}</p>`);
              });
            }
          }
        },
      });
    });

    $(document).on("input", ".contact-form-textarea", (e) => {
      this.autoExpand(e.currentTarget);
    });

    $(".about-menu-item-link").on("click", function (e) {
      e.preventDefault();
      let slug = $(this).data("slug");
      $(".about-child-page, .about-menu-main, .pedagogy-links-menu").removeAttr(
        "aria-current"
      );
      if (slug == "pedagogy") {
        $(".pedagogy-links-menu")
          .addClass("show-pedagogy-links")
          .attr("aria-current", "page");
        setTimeout( () => {
          $( ".pedagogy-link" ).first().focus();
        }, 250 );
      } else if (slug == "instructions") {
        that.collapseAboutMenu();
        that.showOnboarding();
      } else {
        $(".pedagogy-links-menu").removeClass("show-pedagogy-links");
        $(".about-menu-page").removeClass("show-about-page");
        $(".about-child-page-" + slug)
          .addClass("show-about-page")
          .attr("aria-current", "page");
          that.releaseFocusTrap();
          that.trapFocus($($(".about-child-page-" + slug)));
          setTimeout( () => {
            $( `.about-child-page-${slug} .about-child-page-title` ).get( 0 )?.focus();
          }, 250 );
      }
      that.saveState();
    });

    $(".back-about-menu-btn").on("click", function () {
        $(".about-child-page").removeAttr("aria-current");
        $(".pedagogy-links-menu")
            .removeClass("show-pedagogy-links")
            .removeAttr("aria-current");
        $(".about-menu-page").removeClass("show-about-page");
        $(".about-menu-main")
            .addClass("show-about-page")
            .attr("aria-current", "page");
        // setTimeout(function(){
            that.releaseFocusTrap();
            $('.about-menu-main').find('a, button, input, [tabindex]:not([tabindex="-1"])').filter(':visible').first().focus();
            that.trapFocus($(".about-menu-main"));
            
            console.log(document.activeElement);
        // },1000)
        that.saveState();
        
    });

    var isLtr = document.documentElement.dir === "ltr";
    var $carousel = $(".onboarding-slides").flickity({
      cellAlign: isLtr ? "left" : "right",
      contain: true,
      rightToLeft: !isLtr,
      prevNextButtons: false,
      friction: 0.5,
      adaptiveHeight: true,
    });

    $(document).on("click", ".onboarding-forward-btn", function () {
      $carousel.flickity("next");
    });

    $(document).on("click", ".onboarding-back-btn", function () {
      $carousel.flickity("previous");
    });
    if (
      $("body").hasClass("home-page") &&
      !$("body").hasClass("show-about-menu") && 
      ( !window.localStorage?.getItem( 'skipOnboarding' ) || window.localStorage?.getItem( 'skipOnboarding' ) < Date.now() - ( 1000 * 60 * 60 * 24 * 14 ) )
    ) {
      setTimeout(function () {
        that.showOnboarding();
      }, 2000);
    }
    $(document).on("click", "#removeOnboarding, .skip-onboarding", function () {
      that.hideOnboarding();
      window.localStorage.setItem( 'skipOnboarding', Date.now() );
    });

    if ( 'lottie' in window ) {
      const menuIcon = lottie.loadAnimation({
        container: document.getElementById("menu-icon"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: menuIconLottie,
      });  
  
      menuIcon.addEventListener("DOMLoaded", function () {
        menuIcon.goToAndStop(0, true); // Set the first frame as default
      });
  
      document
        .getElementById("menu-icon")
        .addEventListener("mouseenter", function () {
          menuIcon.setDirection(1); // Play forward
          menuIcon.play();
        });
  
      document
        .getElementById("menu-icon")
        .addEventListener("mouseleave", function () {
          menuIcon.setDirection(-1); // Play in reverse
          menuIcon.play();
        });  
    }

    $( document ).on( "focus", ".events-trigger-link", e => {
      this.generateEventsMenu();
      $( ".events-index-timelines-list a" ).first().get( 0 ).focus();
    } );

    $( document ).on( "click", "a[href='#event_select']", e => {
      this.generateEventsMenu();
      $( ".events-index-timelines-list a" ).first().get( 0 ).focus();
    } );

    $( document ).on( "focus", ".events-index-list-item-link", e => {
      $( ".events-trigger-link" ).attr( "tabindex", "-1" );
    } );

    $( document ).on( "blur", "a, button, input", e => {
      if ( $( document.activeElement ).parents( ".events-index" ).length === 0 ) {
        $( ".events-trigger-link" ).attr( "tabindex", "0" );
      }
    } );

    $(document).on("click", ".bookmarks-btn", (e) => {
      $("body").toggleClass("show-bookmarks-menu");
    });

    

    $(document).ready(function () {
      $('.ai-assistant').on('click', function () {
        $(this).blur();
      });
      let hoverEnabled = false;
    
      const fps = 60; // פריימים לשנייה
      const frame = (sec) => Math.round(fps * sec); // פונקציית עזר
    
      const animation = lottie.loadAnimation({
        container: document.getElementById('lottie-logo'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: rootUrl + '/assets/data/' + (document.documentElement.dir === 'ltr' ? 'English_Logo.json' : 'tali-logo.json')
      });

      $(document).on("mouseover", ".remove-bookmark", function (e) {
        const $btn = $(this);
        const offset = $btn.offset(); // מיקום על המסך
        const left = offset.left + 20;
        const top = offset.top;
        $(".remove-bookmark-hover").addClass('show-remove-bookmark-hover');
        $(".remove-bookmark-hover")
          .css({
            top: `${top}px`,
            left: `${left}px`,
            display: "block",
          })
          .data("target-id", $btn.data("id")); // נשתמש בזה במידת הצורך
      });
      $(document).on("mouseout", ".remove-bookmark", () => {
        $(".remove-bookmark-hover").removeClass('show-remove-bookmark-hover');
      });
      animation.addEventListener('DOMLoaded', function () {
        animation.setSpeed(1.8);
        const introStart = frame(0);
        const introEnd = frame(4);        // שניות 0–4
    
        const hoverInStart = frame(4);
        const hoverInEnd = frame(7);    // שניות 4–5.5
    
        const hoverOutStart = frame(7);
        const hoverOutEnd = frame(4);     // שניות 5.5–7
    
        // נשמור סטים של פריימים
        animation.firstLoadFrames = [introStart, introEnd];
        animation.hoverInFrames = [hoverInStart, hoverInEnd];
        animation.hoverOutFrames = [hoverOutStart, hoverOutEnd]; // הובר אאוט → הפוך
    
        // הפעלה ראשונית
        animation.playSegments(animation.firstLoadFrames, true);
    
        // אחרי שהיא מסתיימת, נאפשר hover
        animation.addEventListener('complete', function () {
          if (!hoverEnabled) {
            hoverEnabled = true;
    
            $('#lottie-logo').hover(
              function () {
                animation.playSegments(animation.hoverInFrames, true);
              },
              function () {
                animation.playSegments(animation.hoverOutFrames, true);
              }
            );
          }
        });
      });

      let videosPaused = false;

      $('.video-toggle-all').on('click', function () {
        const $allVideos = $('video.slide-video');
    
        if (videosPaused) {
          $allVideos.each((i, video) => video.play());
          $('.video-toggle-all').text('⏸ ' + this.dataset.textPause ).attr('aria-label', this.dataset.labelPause );
        } else {
          $allVideos.each((i, video) => video.pause());
          $('.video-toggle-all').text( this.dataset.textPlay ).attr('aria-label', this.dataset.labelPlay );
        }
    
        videosPaused = !videosPaused;
      });
      
    });
    
  }

  showOnboarding() {

    $('.skip-link, .page-content, header, .about-menu-bg, .events-index, #years-form').attr('inert', '').attr('aria-hidden', 'true');

    $( "body" ).addClass( "show-onboarding" );

    setTimeout( () => {
      $( ".onboarding-title" ).get( 0 )?.focus();
    }, 50 );

  }

  hideOnboarding() {

    $('.skip-link, .page-content, header, .about-menu-bg, .events-index, #years-form').removeAttr('inert').removeAttr('aria-hidden');

    $( "body" ).removeClass( "show-onboarding" );

  }

  expandAboutMenu( el = document.body ) {

    $("body").addClass("show-about-menu");
    $("#hamburger").attr("aria-expanded", "true");
    $(".about-menu-main").attr("aria-current", "page");

    // ודא שהאודות גלוי ונגיש
    $('.about-menu-main').removeAttr('inert').attr('aria-hidden', 'false');

    $('.skip-link, .page-content, header, .onboarding, .events-index, #years-form').attr('inert', '').attr('aria-hidden', 'true');

  }

  collapseAboutMenu( el = document.body ) {
    if ( document.activeElement ) {
      document.activeElement.blur();
    }

    $("body").removeClass("show-about-menu");
    $(".pedagogy-links-menu").removeClass("show-pedagogy-links");
  
    $(".about-child-page, .about-menu-main, .pedagogy-links-menu").removeAttr("aria-current");
    $("#hamburger").attr("aria-expanded", "false");
  
    // ביטול הסתרת שאר העמוד
    $('.skip-link, .page-content, header, .onboarding, .events-index, #years-form').removeAttr('inert').attr('aria-hidden', 'false');
  
    // הסתרת תפריט האודות מקוראי מסך
    $('.about-menu-main').attr('inert', '').attr('aria-hidden', 'true');
  
    // this.releaseFocusTrap(); // עדיין טוב כגיבוי

  }

  fixCanvasResolution(canvas, ratio) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  generateEventsMenu() {
    const tlTemplate = $( "#events_index_list_timeline_template" ).get(0).content.querySelector( ".events-index-list-timeline" );
    const eventTemplate = $( "#events_index_list_item_template" ).get(0).content.querySelector( ".events-index-list-item" );
    const $el = $( ".events-index-timelines-list" );
    $el.empty();
    if ( !$( "body" ).hasClass( "home-page" ) && !$( "body" ).hasClass( "country-page" ) ) {
      $.tabNext();
      return;
    }
    for ( const tl of Object.values( this.timelines ) ) {
      const tlElement = tlTemplate.cloneNode( true );
      $( tlElement ).find( "h2" ).html( tl.title );
      for ( const event of tl.events.filter( event => event.isRelevant() ) ) {
        const eventElement = eventTemplate.cloneNode( true );
        $( eventElement ).find( ".events-index-list-item-link" ).attr( "href", event.content.url  );
        $( eventElement ).find( ".events-index-list-item-title" ).html( event.content.title );
        $( eventElement ).find( ".events-index-list-item-place" ).html( event.content.country_name );
        $( eventElement ).find( ".events-index-list-item-year" ).html( event.content.year );
        $( tlElement ).find( ".events-index-list-timeline-events-list" ).append( eventElement );
      }
      $el.append( tlElement );
    }
  }


  autoExpand(textarea) {
    textarea.style.height = "40px";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  clearSearch() {
    const $submitButton = $(".search-submit-input");
    $(".search-text-input").val("");
    $submitButton
      .prop("disabled", false)
      .removeClass("disabled")
      .addClass("enabled");
    $(".search-submit-input").click();
  }

  showClearBtn() {
    if (this.searchInput.trim() !== "" || this.filters.length > 0) {
      $("body").addClass("show-clear-btn");
    } else {
      $("body").removeClass("show-clear-btn");
    }
  }

  updateSearchInputIndicator() {
    if (this.searchInput !== "") {
      $("body").removeClass("no-search-input");
      $("body").addClass("show-search-input");
      $("#searchInputIndicator").text(
        this.searchInput.length > 8
          ? this.searchInput.slice(0, 8) + "..."
          : this.searchInput
      );
    } else {
      $("body").addClass("no-search-input");
      $("body").removeClass("show-search-input");
    }
  }

  checkEventsOutsideRange( dontCloseSearchMenu = false ) {
    const relevantEventsInRange = this.getAllRelevantEvents( { filterGlobal: true } );
    const allRelevantEvents = this.getAllRelevantEvents({ noRange: true, filterGlobal: true } );
    const hasSearchInput = this.searchInput != "";

    console.log( relevantEventsInRange, allRelevantEvents );
  
    if (allRelevantEvents.length === 0 && hasSearchInput) {
      $("body").addClass("no-search-results");
      $("body").removeClass("show-search-result-message");
    } else if (
      allRelevantEvents.length > relevantEventsInRange.length &&
      hasSearchInput
    ) {
      $("body").removeClass("no-search-results");
      $("body").addClass("show-search-result-message");
    } else {
      $("body").removeClass("show-search-result-message no-search-results");
      if ( !dontCloseSearchMenu ) this.closeSearchMenu();
    }
  }

  updateEraLabels() {
    const $indicator = $(".years-range-indicator");
    const indicatorOffset = $indicator.offset();
    const indicatorLeft = indicatorOffset.left;
    const indicatorRight = indicatorLeft + $indicator.outerWidth();

    $(".era-name").each(function () {
      const $era = $(this);
      const eraOffset = $era.offset();
      const eraLeft = eraOffset.left;
      const eraRight = eraLeft + $era.outerWidth();

      // Check if either edge of the .era-name is within the indicator range
      if (
        (eraLeft >= indicatorLeft && eraLeft <= indicatorRight) ||
        (eraRight >= indicatorLeft && eraRight <= indicatorRight)
      ) {
        $era.addClass("show-era-name");
      } else {
        $era.removeClass("show-era-name"); // Optionally remove if outside the range
      }
    });
  }

  constructParams(includeCountry = false) {
    const params = [`from:${this.fromYear}`, `to:${this.toYear}`];
    if (this.filters.length) {
      params.push(`filters:${this.filters.join(",")}`);
    }
    if (this.searchInput) {
      params.push(`search:${encodeURIComponent(this.searchInput)}`);
    }
    if (includeCountry && this.currentCountry) {
      params.push(`country:${this.currentCountry}`);
    }
    return params;
  }

  constructUrl(page = null, lang = null) {
    if ( !lang ) {
      lang = window.currentLang;
    }
    const params = this.constructParams();
    if (page) {
      if (page.indexOf("about") === 0) {
        var pageSlug = page.split("-")[1];
        if (pageSlug === "about") {
          return `${langUrls[lang].home}/about`;
        } else {
          return `${langUrls[lang].home}/about/${pageSlug}`;
        }
      }
      if (page.indexOf("country-") === 0) {
        var countryCode = page.split("-")[1];
        return `${langUrls[lang].map}/${countryCode}/${params.join("/")}`;
      }
      if (page === "map") {
        return `${langUrls[lang].map}/${params.join("/")}`;
      }
      if (page.indexOf("event-url-") === 0) {
        // NIR: take page and remove 'event-url-' from it - and this is your URL
        var eventUrl = page.replace("event-url-", "");
        return `${eventUrl}`;
      }
    } else {
      if (
        $(".about-child-page, .pedagogy-links-menu").filter("[aria-current]")
          .length
      ) {
        return (
          `${langUrls[lang].home}/about/` +
          $(".about-child-page, .pedagogy-links-menu")
            .filter("[aria-current]")
            .attr("id")
        );
      } else if ($(".about-menu-main").filter("[aria-current]").length) {
        return `${langUrls[lang].home}/about`;
      }
      return `${langUrls[lang].home}/${params.join("/")}`;
    }
  }

  saveState(page = null) {
    const that = this;
    history.pushState(
      {
        bodyClasses: $("body").attr("class"),
        fromYear: this.fromYear,
        toYear: this.toYear,
        filters: this.filters,
        country: this.currentCountry,
        searchInput: this.searchInput,
        eventContent: $(".event-popup").html(),
        eventTimeline: this.currentTimeline?.name,
      },
      null,
      this.constructUrl(page)
    );
    $( ".language-switcher-link" ).each( function() {
      this.setAttribute( "href", that.constructUrl( page, this.getAttribute( "hreflang" ) ) ); // update language switcher links
    } );
    // this.updateExistingPoints();
  }

  determinePage() {
    if (
      $(".about-menu-main, .about-child-page, .pedagogy-links-menu").filter(
        "[aria-current]"
      ).length
    ) {
      return (
        "about-" +
        $(".about-menu-page, .about-child-page, .pedagogy-links-menu")
          .filter("[aria-current]")
          .attr("id")
      );
    } else if (this.currentCountry) {
      return `page-${this.currentCountry}`;
    } else if ($("body").hasClass("map-page")) {
      return "map";
    } else if ($("body").hasClass("event-page")) {
      return "event-url-" + location.href;
    } else {
      return "";
    }
  }

  updateState(page = null) {
    clearTimeout(this.updateStateTimeout);

    this.updateStateTimeout = setTimeout(() => {
      history.replaceState(
        {
          bodyClasses: $("body").attr("class"),
          fromYear: this.fromYear,
          toYear: this.toYear,
          filters: this.filters,
          country: this.currentCountry,
          searchInput: this.searchInput,
          eventContent: $(".event-popup").html(),
          eventTimeline: this.currentTimeline?.name,
        },
        null,
        this.constructUrl(this.determinePage())
      );
    }, 300);
  }

  updateExistingPoints() {
    if (this.timelinesCollapsed() || this.currentTimeline) return;
    const tls = Object.keys(this.timelines);
    tls.forEach((tlName) => {
      const tl = this.timelines[tlName];
      if (tlName !== "global") tl.backPath.strokeWidth = this.backTimelineWidth;
      tl.updateObjectPositions();
    });
    marker.updatePositions();
  }

  init(timelines, events) {
    this.timelineData = Object.assign({}, timelines);
    this.eventData = events;

    this.initParticles();

    paper.setup("main_timeline");
    // paper.settings.hitTolerance = 10;
    this.backTimelinePaths = new paper.Group();
    this.frontTimelinePaths = new paper.Group();
    this.timelineEvents = new paper.Group();
    this.timelineLabels = new paper.Group();
    const tls = Object.keys(this.timelineData);

    tls.forEach((tlName) => {
      const data = this.timelineData[tlName];
      const eventData = this.eventData.filter((e) => e.timeline === tlName);
      const tl = new Timeline(
        tlName,
        data.title,
        data.yPosition,
        data.color,
        data.isGlobal,
        eventData
      );
      tl.init();
      this.backTimelinePaths.addChild(tl.backPath);
      this.frontTimelinePaths.addChild(tl.frontPath);
      if (tl.events.length) {
        this.timelineEvents.addChild(...tl.getEventObjects());
      }
      this.timelineLabels.addChild(tl.label);
      this.timelines[tlName] = tl;
      
    });

    marker.init();
    this.initInputs();

    // NIR: goes into popstate
    if ($("body").hasClass("home-page")) {
      this.expandTimelines(() => {
        marker.show();
        $(document).trigger("timelines-expanded");
      });
    }

    if ($('body').hasClass('show-about-menu')) {
      this.expandAboutMenu();
      if ( $( ".about-child-page[aria-current]" ).length ) {
        setTimeout( () => {
          $( ".about-child-page[aria-current] .about-child-page-title" ).get( 0 )?.focus();
        }, 50 );
      } else if ( $( ".show-pedagogy-links" ).length ) {
        setTimeout( () => {
          $( ".show-pedagogy-links .pedagogy-link" ).first().focus();
        }, 50 );
      } else {
        setTimeout( () => {
          $( ".about-menu-item-link" ).first().focus();
        }, 50 );
      }
    }

    $( document ).on( "click", ".language-switcher-btn", e => {
      if ( e.currentTarget.getAttribute( "aria-expanded" ) === "true" ) {
        e.currentTarget.setAttribute( "aria-expanded", "false" );
      } else {
        e.currentTarget.setAttribute( "aria-expanded", "true" );
      }
    } );

    // NIR: goes into popstate if in event page
    if ($("body").hasClass("event-page")) {

      this.expandTimelinesQuietly(() => {
        const tlName = $(".event-popup-main").data("timeline");
        $("body").addClass("event-page-ready");
        this.initEventBookmarkButton(); 
        if (tlName in this.timelines) {
          this.timelines[tlName].enter();
          this.updateState();
        }
      });
    } else {
      $("body").addClass("event-page-ready");
    }

    paper.view.onResize = function () {
      tali.updateExistingPoints();
    };

    // NIR: this also goes to the popstate function - go to country page from event page
    
    $(document).on("click", "body.event-page .exit-close-up-btn", (e) => {
      
      this.handleExit();
    });

    $(document).on("click", ".event-prev-arrow", (e) => {
      e.preventDefault();
      prevEvent();
    });

    $(document).on("click", ".event-next-arrow", (e) => {
      e.preventDefault();
      nextEvent();
    });

    if ($("body").hasClass("event-page")) {
      $(document).on("keydown", (e) => {
        switch (e.key) {
          case "Escape": // Check if the pressed key is 'Escape'
            this.handleExit();
            break;
          case "ArrowLeft": // Check if the pressed key is 'ArrowLeft'
            e.preventDefault();
            prevEvent();
            break;
          case "ArrowRight": // Check if the pressed key is 'ArrowRight'
            e.preventDefault();
            nextEvent();
            break;
        }
      });
    }

    $(window).on("popstate", (e) => {
      if ("state" in e.originalEvent) {
        const state = e.originalEvent.state;
        this.fromYear = state.fromYear;
        this.toYear = state.toYear;
        this.filters = state.filters;
        this.country = state.country;
        this.searchInput = state.searchInput;
        this.updateAndRender(state);
      }
    });

    this.updateState();
  }

  

  handleExit() {
    this.exitTimeline();
    if (this.currentCountry == null) {
      $("body")
        .removeClass("event-page country-event timeline-event")
        .addClass("home-page");
    } else {
      $("body")
        .removeClass("event-page country-event timeline-event")
        .addClass("country-page");
    }
    if ($('.main-heading').length === 0) {
      $('.page-content').prepend(this.originalMainHeading.clone());
    }
    setTimeout(() => {
      $(".event-popup").empty();

    }, 1000);
    this.saveState();
  }

  updateAndRender(state) {
    var currentPageClasses = $("body").attr("class").split(/\s+/);
    var bodyClasses = state.bodyClasses;
    var nextPageClasses = bodyClasses.split(/\s+/);
    var filters = state.filters;
    var nextPath = window.location.pathname;

    $(".header-tag input").each(function () {
      const inputId = $(this).attr("id");
      if (filters.includes(inputId)) {
        $(this).prop("checked", true);
      } else {
        $(this).prop("checked", false);
      }
    });
    this.updateUnlistedCheckedTagsIndicator();
    $("body").attr("class", bodyClasses);

    if (
      currentPageClasses.includes("home-page") &&
      nextPageClasses.includes("event-page")
    ) {
      $(".event-popup").html(state.eventContent);
      this.timelines[state.eventTimeline].enter();
    }

    if (
      currentPageClasses.includes("home-page") &&
      nextPageClasses.includes("map-page")
    ) {
      taliMap.bigGlobe();
      this.collapseTimelines();
    }

    if (
      currentPageClasses.includes("map-page") &&
      nextPageClasses.includes("country-page")
    ) {
      taliMap.zoomCountry(state.country);
    }

    if (
      currentPageClasses.includes("map-page") &&
      nextPageClasses.includes("home-page")
    ) {
      taliMap.smallGlobe();
      this.expandTimelines();
    }

    if (
      currentPageClasses.includes("country-page") &&
      nextPageClasses.includes("event-page")
    ) {
      $(".event-popup").html(state.eventContent);
      this.timelines[state.eventTimeline].enter();
    }

    if (
      currentPageClasses.includes("country-page") &&
      nextPageClasses.includes("map-page")
    ) {
      taliMap.zoomOut();
    }

    if (
      currentPageClasses.includes("event-page") &&
      nextPageClasses.includes("home-page")
    ) {
      this.exitTimeline();
      setTimeout(() => {
        $(".event-popup").empty();
      }, 1000);
    }

    if (
      currentPageClasses.includes("event-page") &&
      nextPageClasses.includes("country-page")
    ) {
      this.exitTimeline();
      setTimeout(() => {
        $(".event-popup").empty();
      }, 1000);
    }

    if (
      currentPageClasses.includes("event-page") &&
      nextPageClasses.includes("event-page")
    ) {
      $("body").removeClass("event-page-ready");
      gsap.to(".event-popup-capsule", {
        x: "-180",
        duration: 0.5,
        onComplete() {
          $(".event-popup").html(state.eventContent);
          $("body").addClass("event-page-ready");
          gsap.fromTo(
            ".event-popup-capsule",
            {
              x: "180",
            },
            {
              x: 0,
              duration: 0.5,
            }
          );
        },
      });
    }

    if (nextPath.startsWith("/about")) {
      let parts = nextPath.split("/");

      if (parts.length > 2) {
        let section = parts[2];
        console.log(section);
        $(
          ".about-child-page, .about-menu-main, .pedagogy-links-menu"
        ).removeAttr("aria-current");
        if (section == "pedagogy") {
          $(".pedagogy-links-menu").addClass("show-pedagogy-links");
        } else {
          $(".pedagogy-links-menu").removeClass("show-pedagogy-links");
          $(".about-menu-page").removeClass("show-about-page");
          $(".about-child-page-" + section)
            .addClass("show-about-page")
            .attr("aria-current", "page");
        }
      } else {
        $(".about-child-page").removeAttr("aria-current");
        $(".pedagogy-links-menu")
          .removeClass("show-pedagogy-links")
          .removeAttr("aria-current");
        $(".about-menu-page").removeClass("show-about-page");
        $(".about-menu-main")
          .addClass("show-about-page")
          .attr("aria-current", "page");
      }
    } else {
      $("body").removeClass("show-about-menu");
      $(".pedagogy-links-menu").removeClass("show-pedagogy-links");
      $(".about-child-page, .about-menu-main, .pedagogy-links-menu").removeAttr(
        "aria-current"
      );
    }

    this.updateExistingPoints();
  }

  get range() {
    return Math.abs(this.toYear - this.fromYear);
  }

  get totalYears() {
    return this.maxYear - this.minYear;
  }

  get fromYear() {
    return this._fromYear;
  }

  set fromYear(value) {
    this._fromYear = parseInt(value);
    this.updateAllYearFields();
  }

  get toYear() {
    return this._toYear;
  }

  set toYear(value) {
    this._toYear = parseInt(value);
    this.updateAllYearFields();
  }

  get backTimelineWidth() {
    return Math.min(
      (1 - (this.toYear - this.fromYear) / (this.totalYears + 24)) *
        (vp.height / 5) +
        this.minTlWidth,
      this.maxTlWidth
    );
  }

  getAllRelevantEvents(props = {}) {
    const events = [];
    for (const tl of Object.values(this.timelines)) {
      for (const ev of tl.events) {
        if (ev.isRelevant(props)) {
          events.push(ev);
        }
      }
    }
    return events;
  }

  isWithinRange(year, forDisplay = false, timelineName = '' ) {
    const minusGap = forDisplay && timelineName != 'global' ? (this.toYear - this.fromYear) / 4 : 0;
    return year >= this.fromYear - minusGap && year <= this.toYear;
  }

  isWithinFilters(filters) {
    return (
      !Array.isArray(filters) ||
      this.filters.length === 0 ||
      this.filters.filter((filter) => filters.includes(filter)).length > 0
    );
  }

  getTimelineOffset(year) {
    return (year - this.fromYear) / this.range;
  }

  enterTimeline(name) {
    if (this.currentTimeline) return;
    this.currentTimeline =
      typeof name === "string" ? this.timelines[name] : name;
    this.currentTimeline.enter();
  }

  exitTimeline() {
    if (this.currentTimeline) {
      this.currentTimeline.leave();
    }
    this.currentTimeline = null;
  }

  inTimeline() {
    return this.currentTimeline;
  }

  timelinesCollapsed() {
    return this._collapsed;
  }

  destroyLabels() {
    while (this.labelsDepot.length) {
      this.labelsDepot.pop().destroyLabel();
    }
  }

  destroyHighlights() {
    while (this.highlightsDepot.length) {
      this.highlightsDepot.pop().destroyHighlight();
    }
  }

  destroyMenus() {
    while (this.menusDepot.length) {
      this.menusDepot.pop().destroyMenu();
    }
  }

  collapseTimelines(cb = () => {}) {
    this.destroyLabels();
    this.destroyMenus();
    marker.hide();
    let maximumTimeoutDuration = 0;
    const tls = Object.keys(this.timelineData);
    this._collapsed = true;
    tls.forEach((tlName, idx) => {
      const tl = this.timelines[tlName];
      const activeObjects = tl.getActiveObjects();

      gsap.to(tl.label.point, {
        x: "+=120",
        ease: "power1.in",
        duration: 0.5,
        delay: idx * 0.25,
        onComplete() {
          tl.label.visible = false;
        },
      });

      if (activeObjects.length) {
        const realActiveObjects = activeObjects.filter(
          (o) =>
            o.type === "cluster" || (o.type === "event" && !o.isClustered())
        );
        const clusteredObjects = activeObjects.filter(
          (o) => o.type !== "cluster" && o.isClustered()
        );
        for (let j = 0; j < clusteredObjects.length; j++) {
          clusteredObjects[j].hide();
        }
        for (let i = 0; i < realActiveObjects.length; i++) {
          // if ( activeObjects[ i ].type == 'cluster' || ( activeObjects[ i ].type === 'event' && !activeObjects[ i ].isClustered() ) ) {
          maximumTimeoutDuration = Math.max(
            idx * 250 + i * 10,
            maximumTimeoutDuration
          );
          setTimeout(() => {
            realActiveObjects[i].leave();
          }, idx * 250 + i * 10);
          // } else if ( activeObjects[ i ].type === 'event' && !activeObjects[ i ].isClustered() ) {
          // activeObjects[ i ].hide();
          // }
        }
      }
      setTimeout(() => undrawPath(tl.frontPath), idx * 250 + 250);
      setTimeout(() => undrawPath(tl.backPath), idx * 250 + 500);
      maximumTimeoutDuration = Math.max(
        idx * 250 + 500,
        maximumTimeoutDuration
      );
    });

    setTimeout(() => {
      cb();
    }, maximumTimeoutDuration + 1000);
  }

  collapseTimelinesQuickly(cb = () => {}) {
    this.destroyLabels();
    this.destroyMenus();
    marker.hide();
    let maximumTimeoutDuration = 0;
    const tls = Object.keys(this.timelineData);
    this._collapsed = true;
    tls.forEach((tlName, idx) => {
      const tl = this.timelines[tlName];
      const activeObjects = tl.getActiveObjects();

      gsap.to(tl.label.point, {
        x: "+=120",
        ease: "power1.in",
        duration: 0.5,
        onComplete() {
          tl.label.visible = false;
        },
      });

      if (activeObjects.length) {
        const realActiveObjects = activeObjects.filter(
          (o) =>
            o.type === "cluster" || (o.type === "event" && !o.isClustered())
        );
        const clusteredObjects = activeObjects.filter(
          (o) => o.type !== "cluster" && o.isClustered()
        );
        for (let j = 0; j < clusteredObjects.length; j++) {
          clusteredObjects[j].hide(true);
        }
        for (let i = 0; i < realActiveObjects.length; i++) {
          maximumTimeoutDuration = Math.max(idx * 50, maximumTimeoutDuration);
          realActiveObjects[i].hide();
        }
      }
      setTimeout(() => undrawPath(tl.frontPath, 0.75), idx * 50);
      setTimeout(() => undrawPath(tl.backPath, 0.75), idx * 50 + 50);
    });

    setTimeout(() => {
      cb();
    }, maximumTimeoutDuration + 1000);
  }

  expandTimelinesQuietly(cb = () => {}) {
    const tls = Object.keys(this.timelineData);
    this._collapsed = false;
    this.updateExistingPoints();
    tls.forEach((tlName, idx) => {
      const tl = this.timelines[tlName];
      // const activeObjects = tl.getActiveObjects();
      tl.backPath.visible = true;
      tl.frontPath.visible = true;
      // if ( activeObjects.length ) {
      //     for ( let i = activeObjects.length - 1; i >= 0; i-- ) {
      //         activeObjects[ i ].show( true );
      //     }
      // }
      tl.label.point.x = vp.width - 16;
      tl.label.visible = true;
    });
    cb();
  }

  expandTimelines(cb = () => {}) {
    const tls = Object.keys(this.timelineData);
    this._collapsed = false;
    this.updateExistingPoints();
    let maximumTimeoutDuration = 0;
    tls.forEach((tlName, idx) => {
      const tl = this.timelines[tlName];
      const activeObjects = tl.getActiveObjects();

      setTimeout(() => drawPath(tl.backPath), idx * 250);
      setTimeout(() => drawPath(tl.frontPath), idx * 250 + 250);

      maximumTimeoutDuration = Math.max(
        idx * 250 + 250,
        maximumTimeoutDuration
      );

      if (activeObjects.length) {
        const realActiveObjects = activeObjects.filter(
          (o) =>
            o.type === "cluster" || (o.type === "event" && !o.isClustered())
        );
        for (let i = realActiveObjects.length - 1; i >= 0; i--) {
          realActiveObjects[i].hide();
          // if ( activeObjects[ i ].type == 'cluster' || ( activeObjects[ i ].type === 'event' && !activeObjects[ i ].isClustered() ) ) {
          maximumTimeoutDuration = Math.max(
            500 + idx * 250 + (realActiveObjects.length - i) * 10,
            maximumTimeoutDuration
          );
          setTimeout(() => {
            realActiveObjects[i].arrive();
          }, 500 + idx * 250 + (realActiveObjects.length - i) * 10);
          // }
        }
      }

      tl.label.point.x = vp.width + 120;
      tl.label.visible = true;

      gsap.to(tl.label.point, {
        x: vp.width - 16,
        ease: "power1.in",
        duration: 0.5,
        delay: idx * 0.25,
      });
    });
    setTimeout(() => {
      marker.show();
    }, 1000);
    setTimeout(() => {
      cb();
    }, maximumTimeoutDuration + 2000);
  }

  arriveAllEvents(cb = () => {}) {
    if (this.timelinesCollapsed()) return;
    const tls = Object.keys(this.timelineData);
    this.updateExistingPoints();
    let maximumTimeoutDuration = 0;
    tls.forEach((tlName, idx) => {
      const tl = this.timelines[tlName];
      const activeObjects = tl.getActiveObjects();

      maximumTimeoutDuration = Math.max(
        idx * 250 + 250,
        maximumTimeoutDuration
      );

      if (activeObjects.length) {
        for (let i = activeObjects.length - 1; i >= 0; i--) {
          activeObjects[i].hide();
          if (
            activeObjects[i].type == "cluster" ||
            (activeObjects[i].type === "event" &&
              !activeObjects[i].isClustered())
          ) {
            maximumTimeoutDuration = Math.max(
              500 + idx * 250 + i * 10,
              maximumTimeoutDuration
            );
            setTimeout(() => {
              activeObjects[i].arrive();
            }, 500 + idx * 250 + i * 10);
          }
        }
      }
    });
    setTimeout(() => {
      cb();
    }, maximumTimeoutDuration + 2000);
  }

  updateUnlistedCheckedTagsIndicator() {
    const count = $(".header-tag.unlisted-tag").filter(function () {
      return $(this).find('input[type="checkbox"]:checked').length > 0;
    }).length;
    const indicator = $(".unlisted-checked-tags-indicator");
    indicator.text(count + "+");

    if (count > 0) {
      $(".extra-tags").text(count + "+");
      indicator.addClass("show-unlisted-checked-tags-indicator");
    } else {
      $(".extra-tags").text( window.translations.more_tags);
      indicator.removeClass("show-unlisted-checked-tags-indicator");
    }
  }
}

window.vp = new Viewport();
window.tali = new App();

function drawPath(path, duration = 2) {
  let c = null;
  path.visible = false;
  const o = { p: 0 };
  gsap.to(o, {
    p: 1,
    duration: duration,
    ease: "sine.in",
    onUpdate() {
      if (c) c.remove();
      c = path.clone();
      c.splitAt(c.length * o.p)?.remove();
      c.visible = true;
    },
    onComplete() {
      if (c) c.remove();
      path.visible = true;
    },
  });
}

function undrawPath(path, duration = 2) {
  let c = null;
  path.visible = false;
  const o = { p: 1 };
  gsap.to(o, {
    p: 0,
    duration: duration,
    ease: "sine.in",
    onUpdate() {
      if (c) c.remove();
      c = path.clone();
      c.splitAt(c.length * o.p)?.remove();
      c.visible = true;
    },
    onComplete() {
      if (c) c.remove();
      path.visible = false;
    },
  });
}

$(document).ready(function () {
  historicEventsMap.events.sort((a, b) => a.year - b.year);
  tali.init(historicEventsMap.timelines, historicEventsMap.events);
});
