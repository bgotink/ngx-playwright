(()=>{var E=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var M=Object.getOwnPropertyNames;var q=Object.prototype.hasOwnProperty;var _=(t,r)=>{for(var e in r)E(t,e,{get:r[e],enumerable:!0})},j=(t,r,e,n)=>{if(r&&typeof r=="object"||typeof r=="function")for(let i of M(r))!q.call(t,i)&&i!==e&&E(t,i,{get:()=>r[i],enumerable:!(n=L(r,i))||n.enumerable});return t};var U=t=>j(E({},"__esModule",{value:!0}),t);var Z={};_(Z,{query:()=>X,queryAll:()=>Y});var y={attribute:/\[\s*(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)\s*(?:(?<operator>\W?=)\s*(?<value>.+?)\s*(\s(?<caseSensitive>[iIsS]))?\s*)?\]/gu,id:/#(?<name>[-\w\P{ASCII}]+)/gu,class:/\.(?<name>[-\w\P{ASCII}]+)/gu,comma:/\s*,\s*/g,combinator:/\s*[\s>+~]\s*/g,"pseudo-element":/::(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,"pseudo-class":/:(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,universal:/(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?\*/gu,type:/(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)/gu},D=new Set(["combinator","comma"]),z=new Set(["not","is","where","has","matches","-moz-any","-webkit-any","nth-child","nth-last-child"]),P=/(?<index>[\dn+-]+)\s+of\s+(?<subtree>.+)/,B={"nth-child":P,"nth-last-child":P},V=t=>{switch(t){case"pseudo-element":case"pseudo-class":return new RegExp(y[t].source.replace("(?<argument>\xB6*)","(?<argument>.*)"),"gu");default:return y[t]}};function W(t,r){let e=0,n="";for(;r<t.length;r++){let i=t[r];switch(i){case"(":++e;break;case")":--e;break}if(n+=i,e===0)return n}return n}function G(t,r=y){if(!t)return[];let e=[t];for(let[i,s]of Object.entries(r))for(let o=0;o<e.length;o++){let c=e[o];if(typeof c!="string")continue;s.lastIndex=0;let a=s.exec(c);if(!a)continue;let f=a.index-1,h=[],C=a[0],A=c.slice(0,f+1);A&&h.push(A),h.push({...a.groups,type:i,content:C});let N=c.slice(f+C.length+1);N&&h.push(N),e.splice(o,1,...h)}let n=0;for(let i of e)switch(typeof i){case"string":throw new Error(`Unexpected sequence ${i} found at index ${n}`);case"object":n+=i.content.length,i.pos=[n-i.content.length,n],D.has(i.type)&&(i.content=i.content.trim()||" ");break}return e}var K=/(['"])([^\\\n]+?)\1/g,F=/\\./g;function H(t,r=y){if(t=t.trim(),t==="")return[];let e=[];t=t.replace(F,(s,o)=>(e.push({value:s,offset:o}),"\uE000".repeat(s.length))),t=t.replace(K,(s,o,c,a)=>(e.push({value:s,offset:a}),`${o}${"\uE001".repeat(c.length)}${o}`));{let s=0,o;for(;(o=t.indexOf("(",s))>-1;){let c=W(t,o);e.push({value:c,offset:o}),t=`${t.substring(0,o)}(${"\xB6".repeat(c.length-2)})${t.substring(o+c.length)}`,s=o+c.length}}let n=G(t,r),i=new Set;for(let s of e.reverse())for(let o of n){let{offset:c,value:a}=s;if(!(o.pos[0]<=c&&c+a.length<=o.pos[1]))continue;let{content:f}=o,h=c-o.pos[0];o.content=f.slice(0,h)+a+f.slice(h+a.length),o.content!==f&&i.add(o)}for(let s of i){let o=V(s.type);if(!o)throw new Error(`Unknown token type: ${s.type}`);o.lastIndex=0;let c=o.exec(s.content);if(!c)throw new Error(`Unable to parse content for ${s.type}: ${s.content}`);Object.assign(s,c.groups)}return n}function p(t,{list:r=!0}={}){if(r&&t.find(e=>e.type==="comma")){let e=[],n=[];for(let i=0;i<t.length;i++)if(t[i].type==="comma"){if(n.length===0)throw new Error("Incorrect comma at "+i);e.push(p(n,{list:!1})),n.length=0}else n.push(t[i]);if(n.length===0)throw new Error("Trailing comma");return e.push(p(n,{list:!1})),{type:"list",list:e}}for(let e=t.length-1;e>=0;e--){let n=t[e];if(n.type==="combinator"){let i=t.slice(0,e),s=t.slice(e+1);return{type:"complex",combinator:n.content,left:p(i),right:p(s)}}}switch(t.length){case 0:throw new Error("Could not build AST.");case 1:return t[0];default:return{type:"compound",list:[...t]}}}function*m(t,r){switch(t.type){case"list":for(let e of t.list)yield*m(e,t);break;case"complex":yield*m(t.left,t),yield*m(t.right,t);break;case"compound":yield*t.list.map(e=>[e,t]);break;default:yield[t,r]}}function x(t,{recursive:r=!0,list:e=!0}={}){let n=H(t);if(!n)return;let i=p(n,{list:e});if(!r)return i;for(let[s]of m(i)){if(s.type!=="pseudo-class"||!s.argument||!z.has(s.name))continue;let o=s.argument,c=B[s.name];if(c){let a=c.exec(o);if(!a)continue;Object.assign(s,a.groups),o=a.groups.subtree}o&&Object.assign(s,{subtree:x(o,{recursive:!0,list:!0})})}return i}var v=new Map;function d(t){let r=v.get(t)?.deref();return r||(r=x(t,{recursive:!1})||u(t),v.set(t,new WeakRef(r))),r}function J(t){return t.tagName==="SLOT"&&t.assignedNodes().length?t.assignedNodes():(t.shadowRoot??t).childNodes}function Q(t){return t.tagName==="SLOT"&&t.assignedNodes().length?t.assignedElements():(t.shadowRoot??t).children}function w(t){return t.assignedSlot?t.assignedSlot:t.parentElement?t.parentElement:t.parentNode?.host?t.parentNode.host:null}function*k(t){yield t;for(let r of Q(t))yield*k(r)}function g(t){return t.assignedSlot?t.assignedSlot.assignedElements():t.parentElement?Array.from(t.parentElement.children):null}function b(t){let r=g(t);return r&&r.filter(e=>e.tagName.toLowerCase()===t.tagName.toLowerCase())}function T(t){if(t.assignedSlot){let r=t.assignedSlot.assignedElements();return r[r.indexOf(t)-1]??null}return t.previousElementSibling}function O(t){let[r,e]=t.split(/\s+of\s+/,2),n;switch(r){case"even":n=i=>i%2===0;break;case"odd":n=i=>i%2!==0;break;default:{let[i,s]=r.includes("n")?r.split("n"):["0",r];i=i.trim(),s=s.trim();let o=1;i&&(o=i==="-"?-1:parseInt(i));let c=0;if(s)switch(s[0]){case"-":c=-1*parseInt(s.slice(1).trim());break;case"+":c=parseInt(s.slice(1).trim());break;default:c=parseInt(s);break}o===0?n=a=>a===c:n=a=>{let f=(a-c)/o;return Number.isInteger(f)&&f>=0}}}return{childAst:e&&d(e),indexMatches:n}}function l(t,r,e){switch(e.type){case"universal":return!0;case"attribute":return t.matches(e.content);case"class":return t.classList.contains(e.name);case"id":return t.id===e.name;case"type":return t.tagName.toLowerCase()===e.name.toLowerCase();case"compound":for(let n of e.list)if(!l(t,r,n))return!1;return!0;case"complex":switch(e.combinator){case">":{let n=w(t);return n!=null&&l(t,r,e.right)&&l(n,r,e.left)}case" ":{let n=w(t);if(n==null||!l(t,r,e.right))return!1;for(;n!=null;){if(l(n,r,e.left))return!0;n=w(n)}return!1}case"+":{let n=T(t);return n!=null&&l(t,r,e.right)&&l(n,r,e.left)}case"~":{let n=T(t);if(n==null||!l(t,r,e.right))return!1;for(;n;){if(l(n,r,e.left))return!0;n=T(n)}return!1}default:return R()}case"list":for(let n of e.list)if(l(t,r,n))return!0;return!1;case"pseudo-element":return u(e.content);case"pseudo-class":switch(e.name){case"root":return e.argument&&u(e.content),t===r.ownerDocument.documentElement;case"scope":return e.argument&&u(e.content),t===r;case"empty":e.argument&&u(e.content);for(let n of J(t))if(n.nodeType!==8)return!1;return!0;case"first-child":return e.argument&&u(e.content),t===g(t)?.at(0);case"last-child":return e.argument&&u(e.content),t===g(t)?.at(-1);case"only-child":return e.argument&&u(e.content),g(t)?.length===1;case"first-of-type":return e.argument&&u(e.content),t===b(t)?.at(0);case"last-of-type":return e.argument&&u(e.content),t===b(t)?.at(-1);case"only-of-type":return e.argument&&u(e.content),b(t)?.length===1;case"nth-of-type":case"nth-last-of-type":{e.argument||u(e.content);let n=b(t);if(n==null)return!1;let{childAst:i,indexMatches:s}=O(e.argument);return i&&u(e.content),e.name==="nth-of-type"?s(1+n.indexOf(t)):s(n.length-n.indexOf(t))}case"nth-child":case"nth-last-child":{e.argument||u(e.content);let n=g(t);if(n==null)return!1;let{childAst:i,indexMatches:s}=O(e.argument);return i&&(n=n.filter(o=>l(o,r,i))),e.name==="nth-child"?s(1+n.indexOf(t)):s(n.length-n.indexOf(t))}case"is":case"where":return e.argument||u(e.content),l(t,r,d(e.argument));case"not":return e.argument||u(e.content),!l(t,r,d(e.argument));case"has":return e.argument||u(e.content),S(`:scope ${e.argument}`,w(t)||t,t)!=null;case"host":case"host-context":return u(e.content);default:return t.matches(e.content)}}R()}function u(t){throw new Error(`Invalid selector: ${t}`)}function R(){throw new Error("This code should be unreachable")}function $(t,r){if(t==null&&(t=globalThis.document),t==null)throw new TypeError("Container parameter is required in environments without global document");let e="documentElement"in t?t.documentElement:t;return[e,r??e]}function S(t,r,e){[r,e]=$(r,e);let n=d(t);for(let i of k(r))if(l(i,e,n))return i;return null}function I(t,r,e){[r,e]=$(r,e);let n=d(t),i=[];for(let s of k(r))l(s,e,n)&&i.push(s);return i}function X(t,r){return S(r,t)}function Y(t,r){return I(r,t)}return U(Z);})()
