// On page load, set 'darkmode' to system settings
document.addEventListener('DOMContentLoaded', (event) => {
   if (localStorage.getItem('darkmode') == null) {
      localStorage.setItem('darkmode', window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false);
   }
   darkModeToggle()
});

// 
function darkModeToggle(change = false) {
   console.log("Function Called")
   var text = document.querySelector(".page");
   var children = text.querySelectorAll("*");
   var toggle = text.getElementsByClassName("dark-toggle")[0];

   if (change == true) {
      if (localStorage.getItem('darkmode') == "true") {
         localStorage.setItem('darkmode', "false")
      } else {
         localStorage.setItem('darkmode', "true")
      }
   }

   if (localStorage.getItem('darkmode') == "true"){
      console.log("DARK")
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
   } else if (localStorage.getItem('darkmode') == "false") {
      console.log("LIGHT")
      toggle.style.backgroundColor = "#008cff";
      toggle.style.filter = "none";
      text.style.backgroundColor = "#000000";
      children.forEach(descendant => {
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
   console.log(localStorage.getItem('darkmode'))
}