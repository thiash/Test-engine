import { Engine } from './engine.js';
import { GAME_DATA } from './data.js';

(() => {
const canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const hpEl=document.getElementById('hp'),hpText=document.getElementById('hpText'),xpEl=document.getElementById('xp'),xpText=document.getElementById('xpText'),levelEl=document.getElementById('level'),goldEl=document.getElementById('gold'),logEl=document.getElementById('log');
let W=0,H=0,dpr=1,last=performance.now(),keys=new Set(),jx=0,jy=0,joyId=null,rx=0,ry=0,actionJoyId=null;
const map={w:GAME_DATA.world.width,h:GAME_DATA.world.height},cam={...GAME_DATA.world.playerStart};
const player={x:1800,y:1300,r:18,hp:100,maxHp:100,xp:0,next:100,level:1,gold:25,angle:0,attack:0,hit:0,
 str:12,end:12,dex:10,int:8,wis:8,inventory:['Heiltrank','Wolfsfell'],equipment:{weapon:'Rostiger Dolch',armor:'Leinenwams'},quest:'none',potions:1};
const enemy={x:2200,y:1250,r:25,hp:GAME_DATA.enemy.maxHp,maxHp:GAME_DATA.enemy.maxHp,alive:true,respawn:0,attack:0,hit:0};
const elder={x:1250,y:1180},wolf={x:2550,y:820,alive:true},chest={x:2920,y:570,opened:false};
const trees=[],rocks=[],grass=[],flowers=[];
function rand(seed){let x=Math.sin(seed*999.13)*43758.5453;return x-Math.floor(x)}
for(let i=0;i<260;i++){let x=120+rand(i)*3360,y=120+rand(i*3.7)*2160;if(Math.hypot(x-player.x,y-player.y)>280)trees.push({x,y,s:.75+rand(i+8)*.65})}
for(let i=0;i<150;i++)rocks.push({x:rand(i+300)*map.w,y:rand(i+500)*map.h,s:.5+rand(i+90)*.7});
for(let i=0;i<650;i++)grass.push({x:rand(i+800)*map.w,y:rand(i+900)*map.h});
for(let i=0;i<180;i++)flowers.push({x:rand(i+1100)*map.w,y:rand(i+1200)*map.h,c:i%3});
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)} addEventListener('resize',resize);resize();
function say(t){logEl.textContent=t}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function sx(x){return x-cam.x+W/2} function sy(y){return y-cam.y+H/2}
function near(a,b,d=80){return Math.hypot(a.x-b.x,a.y-b.y)<d}
function updateUI(){document.getElementById('str').textContent=player.str;document.getElementById('end').textContent=player.end;document.getElementById('dex').textContent=player.dex;document.getElementById('int').textContent=player.int;document.getElementById('wis').textContent=player.wis;hpEl.style.width=(player.hp/player.maxHp*100)+'%';hpText.textContent=Math.ceil(player.hp)+' / '+player.maxHp;xpEl.style.width=(player.xp/player.next*100)+'%';xpText.textContent=player.xp+' / '+player.next;levelEl.textContent=player.level;goldEl.textContent=player.gold}
function drawGround(){
 ctx.fillStyle='#31472f';ctx.fillRect(0,0,W,H);const left=cam.x-W/2,top=cam.y-H/2;
 for(let y=Math.floor(top/80)*80;y<top+H+80;y+=80)for(let x=Math.floor(left/80)*80;x<left+W+80;x+=80){ctx.fillStyle=(Math.sin(x*.013)+Math.cos(y*.017))>0?'#385235':'#344d32';ctx.fillRect(sx(x),sy(y),81,81)}
 ctx.strokeStyle='#806f52';ctx.lineWidth=80;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx(200),sy(1700));ctx.bezierCurveTo(sx(900),sy(1550),sx(1250),sy(1100),sx(1850),sy(1300));ctx.bezierCurveTo(sx(2450),sy(1500),sx(2900),sy(900),sx(3450),sy(700));ctx.stroke();
 ctx.strokeStyle='#a28a61';ctx.lineWidth=62;ctx.stroke();
 ctx.fillStyle='#254e63';ctx.beginPath();ctx.ellipse(sx(520),sy(520),380,230,-.25,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#4d8092';ctx.lineWidth=3;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(sx(270),sy(390+i*48));ctx.quadraticCurveTo(sx(500),sy(370+i*48),sx(730),sy(410+i*48));ctx.stroke()}
}
function drawNature(){
 for(const g of grass){let x=sx(g.x),y=sy(g.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;ctx.strokeStyle='#59754b';ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x-3,y-3);ctx.moveTo(x,y+4);ctx.lineTo(x+3,y-4);ctx.stroke()}
 for(const f of flowers){let x=sx(f.x),y=sy(f.y);if(x<-8||x>W+8||y<-8||y>H+8)continue;ctx.fillStyle=['#e5b7bd','#e7cf82','#aebbdc'][f.c];ctx.beginPath();ctx.arc(x,y,2.4,0,Math.PI*2);ctx.fill()}
 for(const r of rocks){let x=sx(r.x),y=sy(r.y),s=r.s;if(x<-50||x>W+50||y<-50||y>H+50)continue;ctx.fillStyle='#59615c';ctx.beginPath();ctx.ellipse(x,y,18*s,11*s,-.2,0,Math.PI*2);ctx.fill()}
 for(const t of trees){let x=sx(t.x),y=sy(t.y),s=t.s;if(x<-70||x>W+70||y<-100||y>H+100)continue;ctx.fillStyle='#1f2a1f';ctx.beginPath();ctx.ellipse(x,y+28*s,28*s,10*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#63472f';ctx.fillRect(x-7*s,y+2*s,14*s,42*s);ctx.fillStyle='#203d25';ctx.beginPath();ctx.arc(x,y-12*s,31*s,0,Math.PI*2);ctx.arc(x-18*s,y+2*s,24*s,0,Math.PI*2);ctx.arc(x+19*s,y+1*s,23*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3d6a38';ctx.beginPath();ctx.arc(x-9*s,y-35*s,13*s,0,Math.PI*2);ctx.arc(x+16*s,y-18*s,12*s,0,Math.PI*2);ctx.fill()}
}
function shadow(x,y,rx,ry){ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function drawNPC(n,label,color='#d7b36a'){let x=sx(n.x),y=sy(n.y);shadow(x,y+14,17,7);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7b36a';ctx.beginPath();ctx.arc(x,y-15,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y-28)}
function drawChest(){let x=sx(chest.x),y=sy(chest.y);ctx.fillStyle='#17120d';ctx.fillRect(x-24,y-10,48,28);ctx.fillStyle=chest.opened?'#6d6250':'#9b6b32';ctx.fillRect(x-21,y-7,42,23);ctx.fillStyle='#d7b36a';ctx.fillRect(x-4,y+1,8,10);ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#eee';ctx.fillText(chest.opened?'Leer':'Truhe',x,y-20)}
function drawCharacter(){let x=sx(player.x),y=sy(player.y);shadow(x,y+15,19,8);ctx.save();ctx.translate(x,y);ctx.rotate(player.angle);ctx.fillStyle='#344a6b';ctx.beginPath();ctx.moveTo(-13,17);ctx.lineTo(-11,-1);ctx.lineTo(0,-12);ctx.lineTo(11,-1);ctx.lineTo(13,17);ctx.closePath();ctx.fill();ctx.fillStyle='#b8835d';ctx.beginPath();ctx.arc(0,-10,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b1d18';ctx.beginPath();ctx.arc(0,-14,9,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#d5c08a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10,3);ctx.lineTo(23,-11);ctx.stroke();if(player.attack>0){ctx.strokeStyle='#ead9a2';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,42,-.9,.6);ctx.stroke()}ctx.restore()}
function drawEnemy(){if(!enemy.alive)return;let x=sx(enemy.x),y=sy(enemy.y);shadow(x,y+20,25,9);ctx.fillStyle='#502a2d';ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7b3d40';ctx.beginPath();ctx.arc(x,y-5,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c7a26a';ctx.beginPath();ctx.moveTo(x-15,y-20);ctx.lineTo(x-8,y-34);ctx.lineTo(x-1,y-21);ctx.moveTo(x+15,y-20);ctx.lineTo(x+8,y-34);ctx.lineTo(x+1,y-21);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-8,y-5,3,0,6.28);ctx.arc(x+8,y-5,3,0,6.28);ctx.fill();ctx.fillStyle='#181b1e';ctx.fillRect(x-25,y-43,50,6);ctx.fillStyle='#c95454';ctx.fillRect(x-24,y-42,48*(enemy.hp/enemy.maxHp),4);ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('Waldgoblin',x,y-50)}
function addXP(n){player.xp+=n;while(player.xp>=player.next){player.xp-=player.next;player.level++;player.next=Math.round(player.next*1.25);player.maxHp+=15;player.hp=player.maxHp;player.str++;player.end++;say('Stufenaufstieg! Stufe '+player.level+' · Stärke und Ausdauer +1');}updateUI()}
function interact(){
 if(near(player,elder,90)){if(player.quest==='none'){player.quest='wood';say('Ältester: „Im Wald verschwinden Holzfäller. Finde ihre Spur und besiege den Goblin-Häuptling.“');}else if(player.quest==='done'){player.gold+=30;addXP(40);player.quest='rewarded';say('Der Älteste belohnt dich: +30 Gold · +40 EP.');}else say('Ältester: „Der Goblin-Häuptling wartet nordöstlich im Wald.“');return}
 if(player.quest==='wood'&&near(player,wolf,100)){player.quest='done';addXP(35);say('Du findest die Spur der Holzfäller. Der Älteste wartet auf deine Rückkehr.');return}
 if(near(player,chest,85)&&!chest.opened){chest.opened=true;player.inventory.push('Bernsteinamulett');player.gold+=20;say('Truhe geöffnet: Bernsteinamulett · +20 Gold');return}
 if(near(player,chest,85)&&chest.opened){say('Die Truhe ist leer.');return}
 say('Nichts Besonderes geschieht.'); 
}
function attack(){
 if(player.attack>0)return;
 let target=enemy.alive?enemy:null;let d=target?Math.hypot(target.x-player.x,target.y-player.y):9999;
 if(target&&d<=110){player.attack=.28;target.hit=.18;target.hp-=Math.max(18,player.str+player.dex);if(target.hp<=0){target.alive=false;target.respawn=4;player.gold+=8;player.inventory.push('Wolfsfell');addXP(50);say('Waldgoblin besiegt! +50 EP · +8 Gold · Wolfsfell');}else say('Treffer! Der Goblin hat noch '+target.hp+' LP.');updateUI();return}
 say('Kein Gegner in Reichweite.')
}
document.getElementById('attack').addEventListener('pointerdown',e=>{e.preventDefault();attack()});
function bindTouchJoy(el,knobEl,setter){Engine.bindJoystick(el,knobEl,setter,38)}
document.getElementById('attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();attack()});
document.getElementById('interactBtn').addEventListener('pointerdown',e=>{e.preventDefault();interact()});
document.getElementById('inventoryBtn').addEventListener('pointerdown',e=>{e.preventDefault();say('Inventar: '+player.inventory.join(' · '))});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){let x=e.clientX-W/2+cam.x,y=e.clientY-H/2+cam.y;if(enemy.alive&&Math.hypot(x-enemy.x,y-enemy.y)<75){player.angle=Math.atan2(y-player.y,x-player.x);attack()}}});
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;keys.add(e.key.toLowerCase());if(e.key===' '){e.preventDefault();attack()}if(e.key.toLowerCase()==='e'){interact()}if(e.key.toLowerCase()==='i'){say('Inventar: '+player.inventory.join(' · '))}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const joy=document.getElementById('joy'),knob=document.getElementById('knob');
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy),m=34;if(l>m){dx=dx/l*m;dy=dy/l*m}jx=dx/m;jy=dy/m;knob.style.transform='translate('+dx+'px,'+dy+'px)'}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});joy.addEventListener('pointerup',e=>{if(e.pointerId===joyId){joyId=null;jx=jy=0;knob.style.transform='translate(0,0)'}});
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup'))dy-=1;if(keys.has('s')||keys.has('arrowdown'))dy+=1;if(keys.has('a')||keys.has('arrowleft'))dx-=1;if(keys.has('d')||keys.has('arrowright'))dx+=1;dx+=jx;dy+=jy;let l=Math.hypot(dx,dy);if(l>.05){dx/=l;dy/=l;player.angle=Math.atan2(dy,dx);let speed=190;player.x=clamp(player.x+dx*speed*dt,40,map.w-40);player.y=clamp(player.y+dy*speed*dt,40,map.h-40)}
 player.attack=Math.max(0,player.attack-dt);if(Math.hypot(rx,ry)>.25){player.angle=Math.atan2(ry,rx);if(enemy.alive&&Math.hypot(enemy.x-player.x,enemy.y-player.y)<125&&player.attack<=0)attack()}if(enemy.alive){let d=Math.hypot(player.x-enemy.x,player.y-enemy.y);if(d<360){let a=Math.atan2(player.y-enemy.y,player.x-enemy.x);enemy.x+=Math.cos(a)*30*dt;enemy.y+=Math.sin(a)*30*dt;if(d<62&&enemy.attack<=0){enemy.attack=.9;player.hp=Math.max(0,player.hp-8);say('Der Goblin trifft dich.');updateUI();if(player.hp<=0){player.hp=player.maxHp;player.x=1800;player.y=1300;player.gold=Math.max(0,player.gold-5);say('Du wurdest besiegt. -5 Gold. Du kehrst ins Dorf zurück.');updateUI()}}}}else{enemy.respawn-=dt;if(enemy.respawn<=0){enemy.alive=true;enemy.hp=enemy.maxHp;enemy.x=2200;enemy.y=1250;say('Ein neuer Waldgoblin erscheint.')}}
 cam.x+=(player.x-cam.x)*Math.min(1,dt*7);cam.y+=(player.y-cam.y)*Math.min(1,dt*7);ctx.clearRect(0,0,W,H);drawGround();drawNature();drawNPC(elder,'Ältester');drawChest();drawEnemy();drawCharacter();requestAnimationFrame(loop)}
updateUI();say('Sprich mit dem Ältesten (E nahe ihm). Erkunde danach den Wald.');requestAnimationFrame(loop);
})();
