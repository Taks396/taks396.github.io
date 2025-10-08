function hideSections(excludeID) {
    var dropdowns = document.getElementsByClassName("sectioncontent");
    for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show') && excludeID !== openDropdown.id) {
            openDropdown.classList.remove('show');
        }
    }
}

function subListSections(id) {
    document.getElementById(id).classList.toggle("show");
    hideSections(id);
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        hideSections();
    }
}