import { Engine } from './engine.js?v=20261006-1';
import { GAME_DATA } from './data.js?v=20261006-1';
import { createPlayer, addXP, resetAfterDeath } from './systems/character.js?v=20261006-1';
import { attack } from './systems/combat.js?v=20261006-1';
import { showInventory } from './systems/inventory.js?v=20261006-1';
import { interact } from './systems/quests.js?v=20261006-1';
import { createWorld } from './systems/world.js?v=20261006-1';
import { createRenderer } from './rendering/renderer.js?v=20261006-1';

(() => {
const canvas=document.getElementById('world');
const hpEl=document.getElementById('hp'),hpText=document.getElementById('hpText'),xpEl=document.getElementById('xp'),xpText=document.getElementById('xpText'),levelEl=document.getElementById('level'),goldEl=document.getElementById('gold'),logEl=document.getElementById('log');
const player=createPlayer(GAME_DATA), world=createWorld(GAME_DATA,player);
const state={player,world};
let W=innerWidth,H=innerHeight,last=performance.now(),keys=new Set(),jx=0,jy=0,rx=0,ry=0;
const renderer=createRenderer(canvas,state);
function resize(){const s=renderer.resize();W=s.W;H=s.H} addEventListener('resize',resize);resize();
const say=t=>logEl.textContent=t;
const near=(a,b,d=80)=>Engine.distance(a,b)<d;
function updateUI(){for(const k of ['str','end','dex','int','wis'])document.getElementById(k).textContent=player[k];hpEl.style.width=(player.hp/player.maxHp*100)+'%';hpText.textContent=Math.ceil(player.hp)+' / '+player.maxHp;xpEl.style.width=(player.xp/player.next*100)+'%';xpText.textContent=player.xp+' / '+player.next;levelEl.textContent=player.level;goldEl.textContent=player.gold}
const gainXP=n=>addXP(player,n,say,updateUI);
const doAttack=()=>{attack({player,enemy:world.enemy,addXP:gainXP,say});updateUI()};
const doInteract=()=>{interact({player,elder:world.elder,wolf:world.wolf,chest:world.chest,near,addXP:gainXP,say});updateUI()};
document.getElementById('attack').addEventListener('pointerdown',e=>{e.preventDefault();doAttack()});
document.getElementById('attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();doAttack()});
document.getElementById('interactBtn').addEventListener('pointerdown',e=>{e.preventDefault();doInteract()});
document.getElementById('inventoryBtn').addEventListener('pointerdown',e=>{e.preventDefault();showInventory(player,say)});
Engine.bindFloatingJoystick(document.getElementById('moveTouchZone'),document.getElementById('moveStick'),document.getElementById('moveKnob'),(x,y)=>{jx=x;jy=y},38);
Engine.bindFloatingJoystick(document.getElementById('actionTouchZone'),document.getElementById('actionStick'),document.getElementById('actionKnob'),(x,y)=>{rx=x;ry=y},38);
const joy=document.getElementById('joy'),knob=document.getElementById('knob');Engine.bindJoystick(joy,knob,(x,y)=>{jx=x;jy=y},34);
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){const x=e.clientX-W/2+world.cam.x,y=e.clientY-H/2+world.cam.y;if(world.enemy.alive&&Math.hypot(x-world.enemy.x,y-world.enemy.y)<75){player.angle=Math.atan2(y-player.y,x-player.x);doAttack()}}});
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;keys.add(e.key.toLowerCase());if(e.key===' '){e.preventDefault();doAttack()}if(e.key.toLowerCase()==='e')doInteract();if(e.key.toLowerCase()==='i')showInventory(player,say)});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup'))dy-=1;if(keys.has('s')||keys.has('arrowdown'))dy+=1;if(keys.has('a')||keys.has('arrowleft'))dx-=1;if(keys.has('d')||keys.has('arrowright'))dx+=1;dx+=jx;dy+=jy;const l=Math.hypot(dx,dy);if(l>.05){dx/=l;dy/=l;player.angle=Math.atan2(dy,dx);const speed=190;player.x=Engine.clamp(player.x+dx*speed*dt,40,world.map.w-40);player.y=Engine.clamp(player.y+dy*speed*dt,40,world.map.h-40)}
player.attack=Math.max(0,player.attack-dt);const e=world.enemy;
if(Math.hypot(rx,ry)>.25){player.angle=Math.atan2(ry,rx);if(e.alive&&Engine.distance(e,player)<125&&player.attack<=0)doAttack()}
if(e.alive){const d=Engine.distance(player,e);if(d<360){const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*30*dt;e.y+=Math.sin(a)*30*dt;if(d<62&&e.attack<=0){e.attack=.9;player.hp=Math.max(0,player.hp-8);say('Der Goblin trifft dich.');if(player.hp<=0)resetAfterDeath(player,GAME_DATA.world.playerStart,say,updateUI);else updateUI()}}}else{e.respawn-=dt;if(e.respawn<=0){e.alive=true;e.hp=e.maxHp;e.x=2200;e.y=1250;say('Ein neuer Waldgoblin erscheint.')}}
world.cam.x+=(player.x-world.cam.x)*Math.min(1,dt*7);world.cam.y+=(player.y-world.cam.y)*Math.min(1,dt*7);renderer.draw();requestAnimationFrame(loop)}
updateUI();say('Sprich mit dem Ältesten. Erkunde danach den Wald.');requestAnimationFrame(loop);
})();