import fetch from "node-fetch";

setInterval(() =>{
    fetch("https://masterp3.onrender.com").then(() =>
    console.log("Manteniendo Render despierto 💚")
    );
}, 5 * 50 * 1000);