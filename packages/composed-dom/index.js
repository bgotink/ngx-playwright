// ../../node_modules/parsel-js/dist/parsel.js
var TOKENS = {
  attribute: /\[\s*(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)\s*(?:(?<operator>\W?=)\s*(?<value>.+?)\s*(\s(?<caseSensitive>[iIsS]))?\s*)?\]/gu,
  id: /#(?<name>[-\w\P{ASCII}]+)/gu,
  class: /\.(?<name>[-\w\P{ASCII}]+)/gu,
  comma: /\s*,\s*/g,
  combinator: /\s*[\s>+~]\s*/g,
  "pseudo-element": /::(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,
  "pseudo-class": /:(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,
  universal: /(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?\*/gu,
  type: /(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)/gu
  // this must be last
};
var TRIM_TOKENS = /* @__PURE__ */ new Set(["combinator", "comma"]);
var RECURSIVE_PSEUDO_CLASSES = /* @__PURE__ */ new Set([
  "not",
  "is",
  "where",
  "has",
  "matches",
  "-moz-any",
  "-webkit-any",
  "nth-child",
  "nth-last-child"
]);
var nthChildRegExp = /(?<index>[\dn+-]+)\s+of\s+(?<subtree>.+)/;
var RECURSIVE_PSEUDO_CLASSES_ARGS = {
  "nth-child": nthChildRegExp,
  "nth-last-child": nthChildRegExp
};
var getArgumentPatternByType = (type) => {
  switch (type) {
    case "pseudo-element":
    case "pseudo-class":
      return new RegExp(TOKENS[type].source.replace("(?<argument>\xB6*)", "(?<argument>.*)"), "gu");
    default:
      return TOKENS[type];
  }
};
function gobbleParens(text, offset) {
  let nesting = 0;
  let result = "";
  for (; offset < text.length; offset++) {
    const char = text[offset];
    switch (char) {
      case "(":
        ++nesting;
        break;
      case ")":
        --nesting;
        break;
    }
    result += char;
    if (nesting === 0) {
      return result;
    }
  }
  return result;
}
function tokenizeBy(text, grammar = TOKENS) {
  if (!text) {
    return [];
  }
  const tokens = [text];
  for (const [type, pattern] of Object.entries(grammar)) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (typeof token !== "string") {
        continue;
      }
      pattern.lastIndex = 0;
      const match = pattern.exec(token);
      if (!match) {
        continue;
      }
      const from = match.index - 1;
      const args = [];
      const content = match[0];
      const before = token.slice(0, from + 1);
      if (before) {
        args.push(before);
      }
      args.push({
        ...match.groups,
        type,
        content
      });
      const after = token.slice(from + content.length + 1);
      if (after) {
        args.push(after);
      }
      tokens.splice(i, 1, ...args);
    }
  }
  let offset = 0;
  for (const token of tokens) {
    switch (typeof token) {
      case "string":
        throw new Error(`Unexpected sequence ${token} found at index ${offset}`);
      case "object":
        offset += token.content.length;
        token.pos = [offset - token.content.length, offset];
        if (TRIM_TOKENS.has(token.type)) {
          token.content = token.content.trim() || " ";
        }
        break;
    }
  }
  return tokens;
}
var STRING_PATTERN = /(['"])([^\\\n]+?)\1/g;
var ESCAPE_PATTERN = /\\./g;
function tokenize(selector, grammar = TOKENS) {
  selector = selector.trim();
  if (selector === "") {
    return [];
  }
  const replacements = [];
  selector = selector.replace(ESCAPE_PATTERN, (value, offset) => {
    replacements.push({ value, offset });
    return "\uE000".repeat(value.length);
  });
  selector = selector.replace(STRING_PATTERN, (value, quote, content, offset) => {
    replacements.push({ value, offset });
    return `${quote}${"\uE001".repeat(content.length)}${quote}`;
  });
  {
    let pos = 0;
    let offset;
    while ((offset = selector.indexOf("(", pos)) > -1) {
      const value = gobbleParens(selector, offset);
      replacements.push({ value, offset });
      selector = `${selector.substring(0, offset)}(${"\xB6".repeat(value.length - 2)})${selector.substring(offset + value.length)}`;
      pos = offset + value.length;
    }
  }
  const tokens = tokenizeBy(selector, grammar);
  const changedTokens = /* @__PURE__ */ new Set();
  for (const replacement of replacements.reverse()) {
    for (const token of tokens) {
      const { offset, value } = replacement;
      if (!(token.pos[0] <= offset && offset + value.length <= token.pos[1])) {
        continue;
      }
      const { content } = token;
      const tokenOffset = offset - token.pos[0];
      token.content = content.slice(0, tokenOffset) + value + content.slice(tokenOffset + value.length);
      if (token.content !== content) {
        changedTokens.add(token);
      }
    }
  }
  for (const token of changedTokens) {
    const pattern = getArgumentPatternByType(token.type);
    if (!pattern) {
      throw new Error(`Unknown token type: ${token.type}`);
    }
    pattern.lastIndex = 0;
    const match = pattern.exec(token.content);
    if (!match) {
      throw new Error(`Unable to parse content for ${token.type}: ${token.content}`);
    }
    Object.assign(token, match.groups);
  }
  return tokens;
}
function nestTokens(tokens, { list = true } = {}) {
  if (list && tokens.find((t) => t.type === "comma")) {
    const selectors = [];
    const temp = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === "comma") {
        if (temp.length === 0) {
          throw new Error("Incorrect comma at " + i);
        }
        selectors.push(nestTokens(temp, { list: false }));
        temp.length = 0;
      } else {
        temp.push(tokens[i]);
      }
    }
    if (temp.length === 0) {
      throw new Error("Trailing comma");
    } else {
      selectors.push(nestTokens(temp, { list: false }));
    }
    return { type: "list", list: selectors };
  }
  for (let i = tokens.length - 1; i >= 0; i--) {
    let token = tokens[i];
    if (token.type === "combinator") {
      let left = tokens.slice(0, i);
      let right = tokens.slice(i + 1);
      return {
        type: "complex",
        combinator: token.content,
        left: nestTokens(left),
        right: nestTokens(right)
      };
    }
  }
  switch (tokens.length) {
    case 0:
      throw new Error("Could not build AST.");
    case 1:
      return tokens[0];
    default:
      return {
        type: "compound",
        list: [...tokens]
        // clone to avoid pointers messing up the AST
      };
  }
}
function* flatten(node, parent) {
  switch (node.type) {
    case "list":
      for (let child of node.list) {
        yield* flatten(child, node);
      }
      break;
    case "complex":
      yield* flatten(node.left, node);
      yield* flatten(node.right, node);
      break;
    case "compound":
      yield* node.list.map((token) => [token, node]);
      break;
    default:
      yield [node, parent];
  }
}
function parse(selector, { recursive = true, list = true } = {}) {
  const tokens = tokenize(selector);
  if (!tokens) {
    return;
  }
  const ast = nestTokens(tokens, { list });
  if (!recursive) {
    return ast;
  }
  for (const [token] of flatten(ast)) {
    if (token.type !== "pseudo-class" || !token.argument) {
      continue;
    }
    if (!RECURSIVE_PSEUDO_CLASSES.has(token.name)) {
      continue;
    }
    let argument = token.argument;
    const childArg = RECURSIVE_PSEUDO_CLASSES_ARGS[token.name];
    if (childArg) {
      const match = childArg.exec(argument);
      if (!match) {
        continue;
      }
      Object.assign(token, match.groups);
      argument = match.groups["subtree"];
    }
    if (!argument) {
      continue;
    }
    Object.assign(token, {
      subtree: parse(argument, {
        recursive: true,
        list: true
      })
    });
  }
  return ast;
}

// src/query-selector.js
var parseCache = /* @__PURE__ */ new Map();
function parse2(selector) {
  let ast = parseCache.get(selector)?.deref();
  if (!ast) {
    ast = parse(selector, { recursive: false }) || invalidSelector(selector);
    parseCache.set(selector, new WeakRef(ast));
  }
  return ast;
}
function getChildNodes(element) {
  if (element.tagName === "SLOT" && /** @type {HTMLSlotElement} */
  element.assignedNodes().length) {
    return (
      /** @type {HTMLSlotElement} */
      element.assignedNodes()
    );
  }
  return (element.shadowRoot ?? element).childNodes;
}
function getChildren(element) {
  if (element.tagName === "SLOT" && /** @type {HTMLSlotElement} */
  element.assignedNodes().length) {
    return (
      /** @type {HTMLSlotElement} */
      element.assignedElements()
    );
  }
  return (element.shadowRoot ?? element).children;
}
function getParent(element) {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }
  if (element.parentElement) {
    return element.parentElement;
  }
  if (
    /** @type {ShadowRoot | null} */
    element.parentNode?.host
  ) {
    return (
      /** @type {ShadowRoot} */
      element.parentNode.host
    );
  }
  return null;
}
function* walkComposedTree(element) {
  yield element;
  for (const child of getChildren(element)) {
    yield* walkComposedTree(child);
  }
}
function getSiblings(element) {
  if (element.assignedSlot) {
    return element.assignedSlot.assignedElements();
  }
  return element.parentElement ? Array.from(element.parentElement.children) : null;
}
function getSiblingsOfType(element) {
  const siblings = getSiblings(element);
  if (!siblings) {
    return siblings;
  }
  return siblings.filter(
    (sibling) => sibling.tagName.toLowerCase() === element.tagName.toLowerCase()
  );
}
function getPreviousSibling(element) {
  if (element.assignedSlot) {
    const siblings = element.assignedSlot.assignedElements();
    return siblings[siblings.indexOf(element) - 1] ?? null;
  }
  return element.previousElementSibling;
}
function parseNth(nth) {
  const [anb, selector] = (
    /** @type {[string, string | undefined]} */
    nth.split(/\s+of\s+/, 2)
  );
  let indexMatches;
  switch (anb) {
    case "even":
      indexMatches = (i) => i % 2 === 0;
      break;
    case "odd":
      indexMatches = (i) => i % 2 !== 0;
      break;
    default: {
      let [aString, bString] = anb.includes("n") ? (
        /** @type {[string, string]} */
        anb.split("n")
      ) : ["0", anb];
      aString = aString.trim();
      bString = bString.trim();
      let a = 1;
      if (aString) {
        a = aString === "-" ? -1 : parseInt(aString);
      }
      let b = 0;
      if (bString) {
        switch (bString[0]) {
          case "-":
            b = -1 * parseInt(bString.slice(1).trim());
            break;
          case "+":
            b = parseInt(bString.slice(1).trim());
            break;
          default:
            b = parseInt(bString);
            break;
        }
      }
      if (a === 0) {
        indexMatches = (i) => i === b;
      } else {
        indexMatches = (i) => {
          const n = (i - b) / a;
          return Number.isInteger(n) && n >= 0;
        };
      }
    }
  }
  return {
    childAst: selector && parse2(selector),
    indexMatches
  };
}
function matchesSelector(element, scope, ast) {
  switch (ast.type) {
    // First, the simple selectors, e.g. `.lorem`, `#ipsum`
    case "universal":
      return true;
    case "attribute":
      return element.matches(ast.content);
    case "class":
      return element.classList.contains(ast.name);
    case "id":
      return element.id === ast.name;
    case "type":
      return element.tagName.toLowerCase() === ast.name.toLowerCase();
    // Compound selectors, e.g. `.lorem#ipsum`
    case "compound":
      for (const child of ast.list) {
        if (!matchesSelector(element, scope, child)) {
          return false;
        }
      }
      return true;
    // Complex selectors, e.g. `.lorem > #ipsum`
    case "complex":
      switch (ast.combinator) {
        case ">": {
          const parent = getParent(element);
          return parent != null && matchesSelector(element, scope, ast.right) && matchesSelector(parent, scope, ast.left);
        }
        case " ": {
          let ancestor = getParent(element);
          if (ancestor == null || !matchesSelector(element, scope, ast.right)) {
            return false;
          }
          while (ancestor != null) {
            if (matchesSelector(ancestor, scope, ast.left)) {
              return true;
            }
            ancestor = getParent(ancestor);
          }
          return false;
        }
        case "+": {
          const previousSibling = getPreviousSibling(element);
          return previousSibling != null && matchesSelector(element, scope, ast.right) && matchesSelector(previousSibling, scope, ast.left);
        }
        case "~": {
          let previousSibling = getPreviousSibling(element);
          if (previousSibling == null || !matchesSelector(element, scope, ast.right)) {
            return false;
          }
          while (previousSibling) {
            if (matchesSelector(previousSibling, scope, ast.left)) {
              return true;
            }
            previousSibling = getPreviousSibling(previousSibling);
          }
          return false;
        }
        default:
          return unreachable();
      }
    // List of selectors, e.g. `.lorem, #ipsum`
    case "list":
      for (const child of ast.list) {
        if (matchesSelector(element, scope, child)) {
          return true;
        }
      }
      return false;
    // Pseudo-elements are not supported.
    // There are only two types of pseudo-elements that actually yield elements:
    // - `::slotted()` is superfluous because you can simply use the `>` combinator
    // - `::part()` doesn't seem like it's useful? idk
    //
    // See https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements
    case "pseudo-element":
      return invalidSelector(ast.content);
    // Now the hard part: pseudo-classes...
    // Add a custom implementation for all pseudo-classes that depend on the DOM
    // tree itself and for pseudo-classes that contain sub-selectors, use the
    // native Element#matches() for all other pseudos.
    case "pseudo-class":
      switch (ast.name) {
        case "root":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === scope.ownerDocument.documentElement;
        case "scope":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === scope;
        case "empty":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          for (const child of getChildNodes(element)) {
            if (child.nodeType !== 8) {
              return false;
            }
          }
          return true;
        case "first-child":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === getSiblings(element)?.at(0);
        case "last-child":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === getSiblings(element)?.at(-1);
        case "only-child":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return getSiblings(element)?.length === 1;
        case "first-of-type":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === getSiblingsOfType(element)?.at(0);
        case "last-of-type":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return element === getSiblingsOfType(element)?.at(-1);
        case "only-of-type":
          if (ast.argument) {
            invalidSelector(ast.content);
          }
          return getSiblingsOfType(element)?.length === 1;
        case "nth-of-type":
        case "nth-last-of-type": {
          if (!ast.argument) {
            invalidSelector(ast.content);
          }
          const siblings = getSiblingsOfType(element);
          if (siblings == null) {
            return false;
          }
          const { childAst, indexMatches } = parseNth(ast.argument);
          if (childAst) {
            invalidSelector(ast.content);
          }
          if (ast.name === "nth-of-type") {
            return indexMatches(1 + siblings.indexOf(element));
          } else {
            return indexMatches(siblings.length - siblings.indexOf(element));
          }
        }
        case "nth-child":
        case "nth-last-child": {
          if (!ast.argument) {
            invalidSelector(ast.content);
          }
          let siblings = getSiblings(element);
          if (siblings == null) {
            return false;
          }
          const { childAst, indexMatches } = parseNth(ast.argument);
          if (childAst) {
            siblings = siblings.filter(
              (sibling) => matchesSelector(sibling, scope, childAst)
            );
          }
          if (ast.name === "nth-child") {
            return indexMatches(1 + siblings.indexOf(element));
          } else {
            return indexMatches(siblings.length - siblings.indexOf(element));
          }
        }
        case "is":
        case "where": {
          if (!ast.argument) {
            invalidSelector(ast.content);
          }
          return matchesSelector(element, scope, parse2(ast.argument));
        }
        case "not":
          if (!ast.argument) {
            invalidSelector(ast.content);
          }
          return !matchesSelector(element, scope, parse2(ast.argument));
        case "has":
          if (!ast.argument) {
            invalidSelector(ast.content);
          }
          return querySelector(
            `:scope ${ast.argument}`,
            getParent(element) || element,
            element
          ) != null;
        case "host":
        case "host-context":
          return invalidSelector(ast.content);
        default:
          return element.matches(ast.content);
      }
  }
  unreachable();
}
function invalidSelector(text) {
  throw new Error(`Invalid selector: ${text}`);
}
function unreachable() {
  throw new Error("This code should be unreachable");
}
function getContainerAndScope(container, scope) {
  if (container == null) {
    container = globalThis.document;
  }
  if (container == null) {
    throw new TypeError(
      "Container parameter is required in environments without global document"
    );
  }
  const containerElement = "documentElement" in container ? container.documentElement : container;
  return [containerElement, scope ?? containerElement];
}
function querySelector(selector, container, scope) {
  [container, scope] = getContainerAndScope(container, scope);
  const ast = parse2(selector);
  for (const element of walkComposedTree(container)) {
    if (matchesSelector(element, scope, ast)) {
      return element;
    }
  }
  return null;
}
function querySelectorAll(selector, container, scope) {
  [container, scope] = getContainerAndScope(container, scope);
  const ast = parse2(selector);
  const results = [];
  for (const element of walkComposedTree(container)) {
    if (matchesSelector(element, scope, ast)) {
      results.push(element);
    }
  }
  return results;
}

// src/inner-text.js
function innerText(element, exclude) {
  if (!element || !isElement(element)) {
    throw new TypeError("Parameter element must be a DOM Element");
  }
  if (exclude != null && typeof exclude !== "string") {
    throw new TypeError("Parameter exclude must be a string");
  }
  if (!element.isConnected) {
    return "";
  }
  const document = element.ownerDocument;
  if (!document) {
    throw new TypeError("Parameter element must be linked to a document");
  }
  const window = document.defaultView;
  if (!window) {
    throw new TypeError(
      "Parameter element must be linked to a document shown in a window"
    );
  }
  const { getComputedStyle } = window;
  const textContainer = document.createElement("div");
  document.body.append(textContainer);
  const originalDisplay = (
    /** @type {HTMLElement | SVGElement | MathMLElement} */
    element.style.display
  );
  element.style.display = "initial";
  const list = helper(element, void 0);
  element.style.display = originalDisplay;
  textContainer.remove();
  const cleanedList = [];
  let newLinesToInsert = 0;
  for (const item of list) {
    if (item === "") {
      continue;
    }
    if (typeof item === "string") {
      if (newLinesToInsert > 0) {
        cleanedList.push(newLinesToInsert);
        newLinesToInsert = 0;
      }
      cleanedList.push(item);
    } else {
      newLinesToInsert = Math.max(newLinesToInsert, item);
    }
  }
  if (typeof cleanedList.at(0) === "number") {
    cleanedList.shift();
  }
  if (typeof cleanedList.at(-1) === "number") {
    cleanedList.pop();
  }
  return cleanedList.map(
    (v) => typeof v === "number" ? v === 0.5 ? " " : "\n".repeat(v) : v
  ).join("");
  function helper(node, parentStyle) {
    if (isText(node)) {
      const ps = (
        /** @type {CSSStyleDeclaration} */
        parentStyle
      );
      if (ps.visibility !== "visible") {
        return [];
      }
      const text = (
        /** @type {Text} */
        node.cloneNode(true)
      );
      textContainer.append(text);
      textContainer.style.whiteSpace = ps.whiteSpace;
      textContainer.style.textTransform = ps.textTransform;
      const textContent = (
        /** @type {string} */
        text.textContent
      );
      const innerText2 = textContainer.innerText;
      text.remove();
      const result2 = [innerText2];
      if (innerText2.at(0) !== textContent.at(0)) {
        result2.unshift(0.5);
      }
      if (innerText2.at(-1) !== textContent.at(-1)) {
        result2.push(0.5);
      }
      return result2;
    } else if (!isElement(node)) {
      return [];
    }
    if (exclude && node.matches(exclude)) {
      return [];
    }
    const computedStyle = getComputedStyle(node);
    if (computedStyle.display === "none") {
      return [];
    }
    let childNodes;
    if (node.shadowRoot) {
      childNodes = node.shadowRoot.childNodes;
    } else if ("assignedNodes" in node) {
      const assignedNodes = (
        /** @type {HTMLSlotElement} */
        node.assignedNodes()
      );
      childNodes = assignedNodes.length ? assignedNodes : node.childNodes;
    } else {
      childNodes = node.childNodes;
    }
    const result = Array.from(
      childNodes,
      (child) => helper(child, computedStyle)
    ).flat();
    if (computedStyle.visibility !== "visible") {
      return result;
    }
    if (node.tagName === "BR") {
      result.push("\n");
    }
    if (computedStyle.display === "table-cell") {
    } else if (computedStyle.display === "table-row") {
    }
    if (node.tagName === "P") {
      return [2, ...result, 2];
    } else if (computedStyle.display.startsWith("block ") || computedStyle.display === "block" || computedStyle.display === "flex" || computedStyle.display === "grid" || computedStyle.display === "table" || computedStyle.display === "table-caption") {
      return [1, ...result, 1];
    }
    return result;
  }
  function isText(node) {
    return node.nodeType === 3;
  }
  function isElement(node) {
    return node.nodeType === 1;
  }
}
export {
  innerText,
  querySelector,
  querySelectorAll
};
