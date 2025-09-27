 function _createForOfIteratorHelper(e,t){var n,r,o,a,i="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(i)return r=!(n=!0),{s:function(){i=i.call(e)},n:function(){var e=i.next();return n=e.done,e},e:function(e){r=!0,o=e},f:function(){try{n||null==i.return||i.return()}finally{if(r)throw o}}};if(Array.isArray(e)||(i=_unsupportedIterableToArray(e))||t&&e&&"number"==typeof e.length)return i&&(e=i),a=0,{s:t=function(){},n:function(){return a>=e.length?{done:!0}:{done:!1,value:e[a++]}},e:function(e){throw e},f:t};throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function _unsupportedIterableToArray(e,t){var n;if(e)return"string"==typeof e?_arrayLikeToArray(e,t):"Map"===(n="Object"===(n=Object.prototype.toString.call(e).slice(8,-1))&&e.constructor?e.constructor.name:n)||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_arrayLikeToArray(e,t):void 0}function _arrayLikeToArray(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}!function(){function t(e,t,n){return(1-n)*e+n*t}var n=document.getElementById("cursor"),r={pre:null,now:null},o=document.getElementsByTagName("*"),a=[];window.addEventListener("load",function(){var e,t=_createForOfIteratorHelper(o);try{for(t.s();!(e=t.n()).done;){var n=e.value;"pointer"==window.getComputedStyle(n).cursor&&a.push(n.outerHTML)}}catch(e){t.e(e)}finally{t.f()}var r=document.createElement("style");r.innerHTML='* { cursor: url("data:image/svg+xml, <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 8 8\\" width=\\"8px\\" height=\\"8px\\"><circle cx=\\"4\\" cy=\\"4\\" r=\\"4\\" opacity=\\".5\\"/></svg>") 4 4, auto !important; }',document.body.appendChild(r)}),document.addEventListener("mouseover",function(e){a.includes(e.target.outerHTML)&&n.classList.add("hover")}),document.addEventListener("mouseout",function(e){a.includes(e.target.outerHTML)&&n.classList.remove("hover")}),document.addEventListener("mousemove",function(e){r.now||(n.style.left=e.clientX-8+"px",n.style.top=e.clientY-8+"px"),r.now={x:e.clientX-8,y:e.clientY-8},n.classList.add("visible")}),document.addEventListener("mouseenter",function(){n.classList.add("visible"),r.pre=null}),document.addEventListener("mouseleave",function(){n.classList.remove("visible")}),document.addEventListener("mousedown",function(){n.classList.add("active")}),document.addEventListener("mouseup",function(){n.classList.remove("active")});requestAnimationFrame(function e(){r.pre?(r.pre={x:t(r.pre.x,r.now.x,.15),y:t(r.pre.y,r.now.y,.15)},n.style.left=r.pre.x+"px",n.style.top=r.pre.y+"px"):r.pre=r.now,requestAnimationFrame(e)})}();
 document.addEventListener('mousemove', (e) => {
     createStar(e.pageX, e.pageY);
 });

 function createStar(x, y) {
     const star = document.createElement('div');
     star.className = 'star';
     
     // 随机偏移量
     const tx = (Math.random() - 0.5) * 100;
     const ty = (Math.random() - 0.5) * 100;
     
     star.style.setProperty('--tx', `${tx}px`);
     star.style.setProperty('--ty', `${ty}px`);
     
     // 随机颜色
     const colors = ['#ff0', '#0ff', '#f0f', '#0f0'];
     star.style.background = `radial-gradient(#fff, ${
         colors[Math.floor(Math.random() * colors.length)]
     })`;
     
     star.style.left = x + 'px';
     star.style.top = y + 'px';
     
     document.body.appendChild(star);
     
     // 动画结束后移除元素
     setTimeout(() => {
         star.remove();
     }, 1000);
 }