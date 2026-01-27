// function getChildren(x) { return x.children.length > 0 ? [...x.children].map(y => getChildren(y)) : x }

function darkModeToggle() {
   var text = document.querySelector(".page");
   var children = text.querySelectorAll("*");
   var toggle = text.getElementsByClassName("dark-toggle")[0];

   if (toggle.style.filter != "invert(1)"){
      toggle.style.backgroundColor = "#dddddd";
      toggle.style.filter = "invert(1)";
      text.style.backgroundColor = "#616161";
      children.forEach(descendant => {
         descendant.style.color = "#b1b1b1";
         if (descendant.classList.contains("header")) {
            descendant.style.backgroundColor = "#222222";
         } else if (descendant.classList.contains("sidebar")) {
            descendant.style.backgroundColor = "#222222";
         } else if (descendant.classList.contains("content")) {
            descendant.style.backgroundColor = "#333333";
         } else if (descendant.tagName == "HR") {
            descendant.style.borderColor = "#b1b1b1";
         }
      });
   } else {
      toggle.style.backgroundColor = "#008cff";
      toggle.style.filter = "none";
      text.style.backgroundColor = "#000000";
      children.forEach(descendant => {
         console.log(descendant.tagName)
         descendant.style.color = "#000000";
         if (descendant.classList.contains("header")) {
            descendant.style.backgroundColor = "#008cff";
         } else if (descendant.classList.contains("sidebar")) {
            descendant.style.backgroundColor = "#80ffdb";
         } else if (descendant.classList.contains("content")) {
            descendant.style.backgroundColor = "#80ffdb";
         } else if (descendant.tagName == "HR") {
            descendant.style.borderColor = "black";
         }
      });
   }
}