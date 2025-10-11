const logo = document.querySelector(".logo-converter");
const staticImg = "imgs/MASTERP3-newlogo-sinfondo.png";
const gifImg = "gifs/MASTERP3-giflogo-sinfondo.gif";

logo.addEventListener("mouseover", () =>{
    logo.src = gifImg;
    logo.style.filter = "drop-shadow(0 2px 10px #ffffff)"
    logo.style.transform = "scale(1.1)";
});

logo.addEventListener("mouseout", () =>{
    logo.src = staticImg;
    logo.style.filter = "none"
    logo.style.transform = "scale(1.0)";
});