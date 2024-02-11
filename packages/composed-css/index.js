var b={attribute:/\[\s*(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)\s*(?:(?<operator>\W?=)\s*(?<value>.+?)\s*(\s(?<caseSensitive>[iIsS]))?\s*)?\]/gu,id:/#(?<name>[-\w\P{ASCII}]+)/gu,class:/\.(?<name>[-\w\P{ASCII}]+)/gu,comma:/\s*,\s*/g,combinator:/\s*[\s>+~]\s*/g,"pseudo-element":/::(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,"pseudo-class":/:(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,universal:/(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?\*/gu,type:/(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)/gu},v=new Set(["combinator","comma"]),R=new Set(["not","is","where","has","matches","-moz-any","-webkit-any","nth-child","nth-last-child"]),N=/(?<index>[\dn+-]+)\s+of\s+(?<subtree>.+)/,$={"nth-child":N,"nth-last-child":N},M=t=>{switch(t){case"pseudo-element":case"pseudo-class":return new RegExp(b[t].source.replace("(?<argument>\xB6*)","(?<argument>.*)"),"gu");default:return b[t]}};function _(t,r){let e=0,n="";for(;r<t.length;r++){let s=t[r];switch(s){case"(":++e;break;case")":--e;break}if(n+=s,e===0)return n}return n}function L(t,r=b){if(!t)return[];let e=[t];for(let[s,i]of Object.entries(r))for(let o=0;o<e.length;o++){let c=e[o];if(typeof c!="string")continue;i.lastIndex=0;let u=i.exec(c);if(!u)continue;let h=u.index-1,l=[],x=u[0],A=c.slice(0,h+1);A&&l.push(A),l.push({...u.groups,type:s,content:x});let C=c.slice(h+x.length+1);C&&l.push(C),e.splice(o,1,...l)}let n=0;for(let s of e)switch(typeof s){case"string":throw new Error(`Unexpected sequence ${s} found at index ${n}`);case"object":n+=s.content.length,s.pos=[n-s.content.length,n],v.has(s.type)&&(s.content=s.content.trim()||" ");break}return e}var U=/(['"])([^\\\n]+?)\1/g,j=/\\./g;function D(t,r=b){if(t=t.trim(),t==="")return[];let e=[];t=t.replace(j,(i,o)=>(e.push({value:i,offset:o}),"\uE000".repeat(i.length))),t=t.replace(U,(i,o,c,u)=>(e.push({value:i,offset:u}),`${o}${"\uE001".repeat(c.length)}${o}`));{let i=0,o;for(;(o=t.indexOf("(",i))>-1;){let c=_(t,o);e.push({value:c,offset:o}),t=`${t.substring(0,o)}(${"\xB6".repeat(c.length-2)})${t.substring(o+c.length)}`,i=o+c.length}}let n=L(t,r),s=new Set;for(let i of e.reverse())for(let o of n){let{offset:c,value:u}=i;if(!(o.pos[0]<=c&&c+u.length<=o.pos[1]))continue;let{content:h}=o,l=c-o.pos[0];o.content=h.slice(0,l)+u+h.slice(l+u.length),o.content!==h&&s.add(o)}for(let i of s){let o=M(i.type);if(!o)throw new Error(`Unknown token type: ${i.type}`);o.lastIndex=0;let c=o.exec(i.content);if(!c)throw new Error(`Unable to parse content for ${i.type}: ${i.content}`);Object.assign(i,c.groups)}return n}function g(t,{list:r=!0}={}){if(r&&t.find(e=>e.type==="comma")){let e=[],n=[];for(let s=0;s<t.length;s++)if(t[s].type==="comma"){if(n.length===0)throw new Error("Incorrect comma at "+s);e.push(g(n,{list:!1})),n.length=0}else n.push(t[s]);if(n.length===0)throw new Error("Trailing comma");return e.push(g(n,{list:!1})),{type:"list",list:e}}for(let e=t.length-1;e>=0;e--){let n=t[e];if(n.type==="combinator"){let s=t.slice(0,e),i=t.slice(e+1);return{type:"complex",combinator:n.content,left:g(s),right:g(i)}}}switch(t.length){case 0:throw new Error("Could not build AST.");case 1:return t[0];default:return{type:"compound",list:[...t]}}}function*m(t,r){switch(t.type){case"list":for(let e of t.list)yield*m(e,t);break;case"complex":yield*m(t.left,t),yield*m(t.right,t);break;case"compound":yield*t.list.map(e=>[e,t]);break;default:yield[t,r]}}function E(t,{recursive:r=!0,list:e=!0}={}){let n=D(t);if(!n)return;let s=g(n,{list:e});if(!r)return s;for(let[i]of m(s)){if(i.type!=="pseudo-class"||!i.argument||!R.has(i.name))continue;let o=i.argument,c=$[i.name];if(c){let u=c.exec(o);if(!u)continue;Object.assign(i,u.groups),o=u.groups.subtree}o&&Object.assign(i,{subtree:E(o,{recursive:!0,list:!0})})}return s}var T=new Map;function d(t){let r=T.get(t)?.deref();return r||(r=E(t,{recursive:!1})||a(t),T.set(t,new WeakRef(r))),r}function z(t){return t.tagName==="SLOT"&&t.assignedNodes().length?t.assignedNodes():Array.from((t.shadowRoot??t).childNodes)}function q(t){return t.tagName==="SLOT"&&t.assignedNodes().length?t.assignedElements():Array.from((t.shadowRoot??t).children)}function*k(t){yield t;for(let r of q(t))yield*k(r)}function w(t){return t.assignedSlot?t.assignedSlot:t.parentElement?t.parentElement:t.parentNode?.host?t.parentNode.host:null}function p(t){return t.assignedSlot?t.assignedSlot.assignedElements():t.parentElement?Array.from(t.parentElement.children):null}function y(t){let r=p(t);return r&&Array.from(r).filter(e=>e.tagName.toLowerCase()===t.tagName.toLowerCase())}function I(t){if(t.assignedSlot){let r=t.assignedSlot.assignedElements();return r[r.indexOf(t)-1]??null}return t.previousElementSibling}function O(t){let[r,e]=t.split(/\s+of\s*/,2),n;switch(r){case"even":n=s=>s%2===0;break;case"odd":n=s=>s%2!==0;break;default:{let[s,i]=r.includes("n")?r.split("n"):["0",r];s=s.trim(),i=i.trim();let o=1;s&&(o=s==="-"?-1:parseInt(s));let c=0;if(i)switch(i[0]){case"-":c=-1*parseInt(i.slice(1).trim());break;case"+":c=parseInt(i.slice(1).trim());break;default:c=parseInt(i);break}console.log({aNumber:o,bNumber:c}),o===0?n=u=>u===c:n=u=>(u=u-c,u%o===0&&u/o>=0)}}return{childAst:e&&d(e),indexMatches:n}}function f(t,r,e){switch(e.type){case"universal":return!0;case"attribute":return t.matches(e.content);case"class":return t.classList.contains(e.name);case"id":return t.id===e.name;case"type":return t.tagName.toLowerCase()===e.name.toLowerCase();case"list":for(let n of e.list)if(f(t,r,n))return!0;return!1;case"compound":for(let n of e.list)if(!f(t,r,n))return!1;return!0;case"pseudo-element":return a(e.content);case"pseudo-class":switch(e.name){case"root":return e.argument&&a(e.content),t===r.ownerDocument.documentElement;case"scope":return e.argument&&a(e.content),t===r;case"empty":return e.argument&&a(e.content),z(t).every(n=>n.nodeType===Node.COMMENT_NODE);case"first-child":return e.argument&&a(e.content),t===p(t)?.at(0);case"last-child":return e.argument&&a(e.content),t===p(t)?.at(-1);case"only-child":return e.argument&&a(e.content),p(t)?.length===1;case"first-of-type":return e.argument&&a(e.content),t===y(t)?.at(0);case"last-of-type":return e.argument&&a(e.content),t===y(t)?.at(-1);case"only-of-type":return e.argument&&a(e.content),y(t)?.length===1;case"nth-of-type":case"nth-last-of-type":{e.argument||a(e.content);let n=y(t);if(n==null)return!1;let{childAst:s,indexMatches:i}=O(e.argument);return s&&a(e.content),e.name==="nth-of-type"?i(1+n.indexOf(t)):i(n.length-n.indexOf(t))}case"nth-child":case"nth-last-child":{e.argument||a(e.content);let n=p(t);if(n==null)return!1;let{childAst:s,indexMatches:i}=O(e.argument);return s&&(n=Array.from(n).filter(o=>f(o,r,s))),e.name==="nth-child"?i(1+n.indexOf(t)):i(n.length-n.indexOf(t))}case"is":case"where":return e.argument||a(e.content),f(t,r,d(e.argument));case"has":return e.argument||a(e.content),B(`:scope ${e.argument}`,w(t)||t,t)!=null;case"not":return e.argument||a(e.content),!f(t,r,d(e.argument));case"host":case"host-context":return a(e.content);default:return t.matches(e.content)}case"complex":switch(e.combinator){case">":{let n=w(t);return n!=null&&f(t,r,e.right)&&f(n,r,e.left)}case" ":{let n=w(t);if(n==null||!f(t,r,e.right))return!1;for(;n!=null;){if(f(n,r,e.left))return!0;n=w(n)}return!1}case"+":{let n=I(t);return n!=null&&f(t,r,e.right)&&f(n,r,e.left)}case"~":{let n=I(t);if(n==null||!f(t,r,e.right))return!1;for(;n;){if(f(n,r,e.left))return!0;n=I(n)}return!1}}return P()}P()}function a(t){throw new Error(`Invalid selector: ${t}`)}function P(){throw new Error("This code should be unreachable")}function S(t){return"documentElement"in t?t.documentElement:t}function B(t,r=document,e=S(r)){let n=d(t);for(let s of k(S(r)))if(f(s,e,n))return s;return null}function V(t,r=document,e=S(r)){let n=d(t),s=[];for(let i of k(S(r)))f(i,e,n)&&s.push(i);return s}export{B as querySelector,V as querySelectorAll};
