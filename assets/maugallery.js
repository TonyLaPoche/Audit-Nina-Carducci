(function ($) {
  $.fn.mauGallery = function (options) {
    const settings = $.extend({}, $.fn.mauGallery.defaults, options); // Utilisation de const pour les options
    const tagsCollection = [];

    return this.each(function () {
      const $gallery = $(this); // Mise en cache de l'élément galerie

      $.fn.mauGallery.methods.createRowWrapper($gallery);

      if (settings.lightBox) {
        $.fn.mauGallery.methods.createLightBox($gallery, settings.lightboxId, settings.navigation);
      }

      $.fn.mauGallery.listeners(settings);

      $gallery.children(".gallery-item").each(function () {
        const $item = $(this); // Mise en cache de l'élément item

        $.fn.mauGallery.methods.responsiveImageItem($item);
        $.fn.mauGallery.methods.moveItemInRowWrapper($item);
        $.fn.mauGallery.methods.wrapItemInColumn($item, settings.columns);

        const theTag = $item.data("gallery-tag");
        if (settings.showTags && theTag !== undefined && tagsCollection.indexOf(theTag) === -1) {
          tagsCollection.push(theTag);
        }
      });

      if (settings.showTags) {
        $.fn.mauGallery.methods.showItemTags($gallery, settings.tagsPosition, tagsCollection);
      }

      $gallery.fadeIn(500);
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true,
  };

  $.fn.mauGallery.listeners = function (options) {
    $(".gallery-item").on("click", function () {
      const $item = $(this); // Mise en cache de l'élément item
      if (options.lightBox && $item.prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($item, options.lightboxId);
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () => $.fn.mauGallery.methods.changeImage("prev", options.lightboxId));
    $(".gallery").on("click", ".mg-next", () => $.fn.mauGallery.methods.changeImage("next", options.lightboxId));
  };

  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    wrapItemInColumn(element, columns) {
      if (typeof columns === "number") {
        element.wrap(`<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`);
      } else if (typeof columns === "object") {
        let columnClasses = "";
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(`Columns should be defined as numbers or objects. ${typeof columns} is not supported.`);
      }
    },

    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },

    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },

    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`).find(".lightboxImage").attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },

    changeImage(direction, lightboxId) {
      let activeImage = null;
      $("img.gallery-item").each(function () {
        if ($(this).attr("src") === $(`#${lightboxId} .lightboxImage`).attr("src")) {
          activeImage = $(this);
        }
      });

      const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      const imagesCollection = [];

      $(".item-column").each(function () {
        const img = $(this).children("img");
        if (activeTag === "all" || img.data("gallery-tag") === activeTag) {
          imagesCollection.push(img);
        }
      });

      const currentIndex = imagesCollection.indexOf(activeImage);
      let newIndex = currentIndex + (direction === "next" ? 1 : -1);

      if (newIndex < 0) newIndex = imagesCollection.length - 1;
      if (newIndex >= imagesCollection.length) newIndex = 0;

      const nextImage = imagesCollection[newIndex];
      $(`#${lightboxId} .lightboxImage`).attr("src", nextImage.attr("src"));
    },

    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`
        <div class="modal fade" id="${lightboxId || "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body">
                ${navigation ? '<div class="mg-prev"><</div>' : '<span style="display:none;"></span>'}
                <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                ${navigation ? '<div class="mg-next">></div>' : '<span style="display:none;"></span>'}
              </div>
            </div>
          </div>
        </div>`);
    },

    showItemTags(gallery, position, tags) {
      let tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>';
      tags.forEach((value) => {
        tagItems += `<li class="nav-item active"><span class="nav-link" data-images-toggle="${value}">${value}</span></li>`;
      });

      const tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },

    filterByTag() {
      const $this = $(this); // Mise en cache de l'élément clicqué
      if ($this.hasClass("active-tag")) {
        return;
      }

      $(".active-tag").removeClass("active active-tag");
      $this.addClass("active-tag");

      const tag = $this.data("images-toggle");

      $(".gallery-item").each(function () {
        const $itemColumn = $(this).parents(".item-column"); // Mise en cache de la colonne parente
        $itemColumn.hide();

        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          $itemColumn.show(300);
        }
      });
    },
  };
})(jQuery);
