const productContainers = [...document.querySelectorAll('.product-container')];
const nxtBtn = [...document.querySelectorAll('.nxt-btn')];
const preBtn = [...document.querySelectorAll('.pre-btn')];

productContainers.forEach((item, i) => {
    // Measure on each click so the step still matches after a window resize.
    nxtBtn[i].addEventListener('click', () => {
        item.scrollLeft += item.getBoundingClientRect().width;
    })

    preBtn[i].addEventListener('click', () => {
        item.scrollLeft -= item.getBoundingClientRect().width;
    })
})
