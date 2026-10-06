export function showInventory(player,say){say('Inventar: '+player.inventory.join(' · '))}
export function addItem(player,item){player.inventory.push(item)}