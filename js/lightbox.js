document.addEventListener("DOMContentLoaded", function () {
  var overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  var media = null;
  document.body.appendChild(overlay);

  document.querySelectorAll(".blog-figure img").forEach(function (el) {
    el.style.cursor = "zoom-in";
    el.addEventListener("click", function () {
      clear();
      var img = document.createElement("img");
      img.src = el.src;
      overlay.appendChild(img);
      media = img;
      overlay.classList.add("is-active");
    });
  });

  document.querySelectorAll(".blog-figure video").forEach(function (el) {
    el.style.cursor = "zoom-in";
    el.addEventListener("click", function () {
      clear();
      var video = document.createElement("video");
      video.src = el.src;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cursor = "pointer";
      video.addEventListener("click", function (e) {
        e.stopPropagation();
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
      overlay.appendChild(video);
      media = video;
      overlay.classList.add("is-active");
    });
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      clear();
      overlay.classList.remove("is-active");
    }
  });

  function clear() {
    if (media) {
      if (media.tagName === "VIDEO") media.pause();
      media.remove();
      media = null;
    }
  }
});
