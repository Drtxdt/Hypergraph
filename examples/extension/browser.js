export function mount({root,config}){const node=root.querySelector('[data-reading-note]');if(node)node.textContent=config.text;return()=>{if(node)node.textContent='';};}
