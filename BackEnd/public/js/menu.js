const menuBtn = document.querySelector(".burguer-menu");
const menu = document.querySelector(".menu-list");

menuBtn.addEventListener('click', () =>{
  if (menu.style.display === 'flex'){
    menu.style.display = 'none';
    
  } else {
    menu.style.display = 'flex';
    menu
  }
});
