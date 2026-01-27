// function getChildren(x) { return x.children.length > 0 ? [...x.children].map(y => getChildren(y)) : x }

function myFunction() {
   var text = document.querySelector(".page");
   var children = text.querySelectorAll("*");
   var toggle = text.getElementsByClassName("dark-toggle")[0];

   if (toggle.style.filter != "invert(1)"){
      toggle.style.backgroundColor = "#dddddd";
      toggle.style.filter = "invert(1)";
      text.style.backgroundColor = "#616161";
      children.forEach(descendant => {
         descendant.style.color = "#a5a5a5";
         if (descendant.classList.contains("header")) {
            descendant.style.backgroundColor = "#222222";
         } else if (descendant.classList.contains("sidebar")) {
            descendant.style.backgroundColor = "#222222";
         } else if (descendant.classList.contains("content")) {
            descendant.style.backgroundColor = "#333333";
         } else if (descendant.tagName == "HR") {
            descendant.style.borderColor = "#a5a5a5";
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

   

   // var element = document.getElementsByClassName("dark-toggle")[0];
   // var head = document.getElementsByClassName("header")[0];
   // var content = document.getElementsByClassName("content")[0];
   // var sidebar = document.getElementsByClassName("sidebar")[0];

   // // Set "Light Mode" Background Colors
   // console.log(element.style.filter)
   // if(element.style.filter == "invert(1)") {
   //    console.log("Default")
   //    element.style.filter = "none"

   //    element.style.backgroundColor = "#008cff"
   //    head.style.backgroundColor = "#008cff"
   //    content.style.backgroundColor = "#80ffdb"
   //    sidebar.style.backgroundColor = "#80ffdb"

   //    for (const child of head.children) {
   //       child.style.color = "#000000"
   //    }
   //    for (const child of content.children) {
   //       child.style.color = "#000000"
   //    }
   //    for (const child of sidebar.children) {
   //       child.style.color = "#000000"
   //    }

   // // Set "Dark Mode" Background Colors
   // } else {
   //    console.log("Dark")
   //    element.style.filter = "invert(1)"

   //    element.style.backgroundColor = "#ffffff"
   //    head.style.backgroundColor = "#222222"
   //    content.style.backgroundColor = "#333333"
   //    sidebar.style.backgroundColor = "#333333"
      
   //    for (const child of head.children) {
   //       child.style.color = "#9c9c9c"
   //    }
   //    for (const child of content.children) {
   //       child.style.color = "#9c9c9c"
   //    }
   //    for (const child of sidebar.children) {
   //       child.style.color = "#9c9c9c"
   //    }
   // }
}