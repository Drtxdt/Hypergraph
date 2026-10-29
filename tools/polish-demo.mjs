import fs from 'node:fs/promises';
const descriptions={welcome:'从一页记录开始：清晰的字阶、舒适的正文，以及代码与公式的完整表达。',showcase:'流程图、数据图表、乐谱与脚注，让复杂想法拥有合适的表达方式。',components:'从提示与折叠，到多标签内容与媒体，一组可以自由组合的写作组件。','field-notes':'在日常生活中发现新的连接，把观察、想法和片刻灵感留下来。',systems:'把复杂留给系统，把简单留给读者：结构化配置与可独立扩展的主题。'};
for(const [name,description] of Object.entries(descriptions)){
 const file='demo/source/_posts/'+name+'.md';
 let text=await fs.readFile(file,'utf8');
 if(!/^description:/m.test(text))text=text.replace(/(title:[^\n]*\n)/,(_,title)=>title+'description: '+description+'\n');
 await fs.writeFile(file,text);
}
