function shiftIntoView(elm) {
    var image = elm.firstElementChild
    var parent = elm.parentElement

    image.style.marginLeft = '0px';

    var elmLeft = image.getBoundingClientRect().x
    var bodyLeft = parent.getBoundingClientRect().x
    var elmRight = image.getBoundingClientRect().x + image.getBoundingClientRect().width
    var bodyRight = parent.getBoundingClientRect().x + parent.getBoundingClientRect().width

    console.log(elmLeft, bodyLeft, elmRight, bodyRight)


    if (elmLeft <= bodyLeft) {
        image.style.marginLeft = bodyLeft - elmLeft + 20 + 'px';
    } else if (elmRight >= bodyRight) {
        image.style.marginLeft = -elmRight + bodyRight - 20 + 'px';
    }
}
