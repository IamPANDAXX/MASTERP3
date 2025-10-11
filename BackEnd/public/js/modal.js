//funciones o llamadas generales de los modalsvermas
const openboton = document.querySelectorAll(".boton-pasos");
const closeboton = document.querySelectorAll(".boton-cerrar");

openboton.forEach(btn => {
    btn.addEventListener("click", () =>{
        const modalId = btn.getAttribute("data-modal");
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.style.display = "block";
        modal.style.animation = "popIn 0.7s ease";
    });

closeboton.forEach(btn => {
    btn.addEventListener("click", () =>{
        const modal = btn.closest(".modal");
        if (!modal) return;

        modal.style.animation = "popOut 0.7s ease forwards";

        setTimeout(() =>{
            modal.style.display = "none";
            modal.style.animation = "popIn 0.7s ease"
        }, 700);
    });
});

window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")){
        e.target.style.display = "none";
    }
});
    
});
