//le manda una peticion pa que no webonie
import fetch from "node-fetch";
//lo mantiene vivo pues
setInterval(() =>{
    fetch("https://masterp3.onrender.com").then(() =>
    console.log("Manteniendo Render despierto💚")
    );
}, 5 * 50 * 1000);