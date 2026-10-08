const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d'),stage=document.getElementById('stage');
let tool='pen',drawing=false,startX=0,startY=0,current=null,history=[],future=[],baseImage=null;

function showCanvas(){document.getElementById('empty').style.display='none';canvas.style.display='block'}
function snapshot(){history.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(history.length>20)history.shift();future=[]}
function restore(img){ctx.putImageData(img,0,0)}
function setTool(t){tool=t;document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===t))}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));

function loadImage(src){
  const img=new Image();
  img.onload=()=>{
    canvas.width=img.naturalWidth;
    canvas.height=img.naturalHeight;
    canvas.style.width='auto';
    canvas.style.height='auto';
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,0,0);
    baseImage=ctx.getImageData(0,0,canvas.width,canvas.height);
    history=[];future=[];snapshot();showCanvas();
  };
  img.src=src;
}

async function captureScreen(){
  try{
    const stream=await navigator.mediaDevices.getDisplayMedia({video:{cursor:'always'},audio:false});
    const video=document.createElement('video');video.srcObject=stream;await video.play();
    await new Promise(r=>setTimeout(r,250));
    const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;
    c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    stream.getTracks().forEach(t=>t.stop());
    loadImage(c.toDataURL('image/png'));
  }catch(e){console.warn(e)}
}
document.getElementById('capture').onclick=captureScreen;
document.getElementById('capture2').onclick=captureScreen;
document.getElementById('openImage').onclick=()=>document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange=e=>{const f=e.target.files[0];if(f)loadImage(URL.createObjectURL(f))};

function pos(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
}
function style(){
  ctx.strokeStyle=document.getElementById('color').value;
  ctx.fillStyle=document.getElementById('color').value;
  ctx.lineWidth=+document.getElementById('size').value*(canvas.width/rangeBase());
  ctx.lineCap='round';ctx.lineJoin='round';
}
function rangeBase(){return Math.max(1,Math.min(canvas.width,canvas.height)/1000)}

canvas.addEventListener('pointerdown',e=>{
  if(!canvas.width)return;
  const p=pos(e);startX=p.x;startY=p.y;current=p;drawing=true;
  if(tool==='pen'||tool==='highlighter'){
    snapshot();style();
    if(tool==='highlighter'){ctx.globalAlpha=.28;ctx.lineWidth=Math.max(12,document.getElementById('size').value*3*rangeBase())}
    ctx.beginPath();ctx.moveTo(p.x,p.y);
  }
});
canvas.addEventListener('pointermove',e=>{
  if(!drawing)return;
  current=pos(e);
  if(tool==='pen'||tool==='highlighter'){ctx.lineTo(current.x,current.y);ctx.stroke()}
});
canvas.addEventListener('pointerup',e=>{
  if(!drawing)return;drawing=false;ctx.globalAlpha=1;
  if(tool==='rect'||tool==='circle'||tool==='arrow'){
    restore(history[history.length-1]);style();
    const x=startX,y=startY,w=current.x-startX,h=current.y-startY;
    if(tool==='rect')ctx.strokeRect(x,y,w,h);
    if(tool==='circle'){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2);ctx.stroke()}
    if(tool==='arrow'){
      const a=Math.atan2(h,w),head=18*rangeBase();
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(current.x,current.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(current.x,current.y);ctx.lineTo(current.x-head*Math.cos(a-.5),current.y-head*Math.sin(a-.5));ctx.moveTo(current.x,current.y);ctx.lineTo(current.x-head*Math.cos(a+.5),current.y-head*Math.sin(a+.5));ctx.stroke();
    }
  }
});
canvas.addEventListener('pointerleave',()=>{drawing=false;ctx.globalAlpha=1});

canvas.addEventListener('dblclick',e=>{
  if(tool!=='text')return;
  const p=pos(e),input=document.createElement('input');
  input.style.position='fixed';input.style.left=e.clientX+'px';input.style.top=e.clientY+'px';input.style.zIndex=99;input.style.padding='8px';input.placeholder='Digite e pressione Enter';
  document.body.appendChild(input);input.focus();
  const finish=()=>{const v=input.value.trim();if(v){snapshot();style();ctx.font=Math.max(18,+document.getElementById('size').value*5*rangeBase())+'px sans-serif';ctx.fillText(v,p.x,p.y)}input.remove()};
  input.addEventListener('keydown',ev=>{if(ev.key==='Enter')finish();if(ev.key==='Escape')input.remove()});input.addEventListener('blur',finish);
});

document.getElementById('undo').onclick=()=>{if(history.length>1){future.push(history.pop());restore(history[history.length-1])}};
document.getElementById('redo').onclick=()=>{if(future.length){const img=future.pop();history.push(img);restore(img)}};
document.getElementById('clear').onclick=()=>{if(!canvas.width)return;if(confirm('Remover todas as anotações e voltar à imagem original?')){ctx.putImageData(baseImage,0,0);snapshot()}};
document.getElementById('download').onclick=()=>{if(!canvas.width)return;const a=document.createElement('a');a.download='annotated-screen.png';a.href=canvas.toDataURL('image/png');a.click()};
