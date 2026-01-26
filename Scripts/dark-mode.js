// function getChildren(x) { return x.children.length > 0 ? [...x.children].map(y => getChildren(y)) : x }

function myFunction() {
   var element = document.getElementsByClassName("dark-toggle")[0];
   var head = document.getElementsByClassName("header")[0];
   var content = document.getElementsByClassName("content")[0];
   var sidebar = document.getElementsByClassName("sidebar")[0];

   // Set "Light Mode" Background Colors
   if(element.style.filter == "invert()") {
      element.style.filter = "none"

      element.style.backgroundColor = "#008cff"
      head.style.backgroundColor = "#008cff"
      content.style.backgroundColor = "#80ffdb"
      sidebar.style.backgroundColor = "#80ffdb"

      for (const child of head.children) {
         child.style.color = "#000000"
      }
      for (const child of content.children) {
         child.style.color = "#000000"
      }
      for (const child of sidebar.children) {
         child.style.color = "#000000"
      }

   // Set "Dark Mode" Background Colors
   } else {
      element.style.filter = "invert()"

      element.style.backgroundColor = "#ffffff"
      head.style.backgroundColor = "#222222"
      content.style.backgroundColor = "#444444"
      sidebar.style.backgroundColor = "#444444"
      
      for (const child of head.children) {
         child.style.color = "#9c9c9c"
      }
      for (const child of content.children) {
         child.style.color = "#9c9c9c"
      }
      for (const child of sidebar.children) {
         child.style.color = "#9c9c9c"
      }
   }
}