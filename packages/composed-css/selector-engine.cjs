(() => {
	var b = Object.defineProperty;
	var v = Object.getOwnPropertyDescriptor;
	var $ = Object.getOwnPropertyNames;
	var R = Object.prototype.hasOwnProperty;
	var O = (e, n) => {
			for (var t in n) b(e, t, {get: n[t], enumerable: !0});
		},
		N = (e, n, t, r) => {
			if ((n && typeof n == "object") || typeof n == "function")
				for (let s of $(n))
					!R.call(e, s) &&
						s !== t &&
						b(e, s, {
							get: () => n[s],
							enumerable: !(r = v(n, s)) || r.enumerable,
						});
			return e;
		};
	var _ = (e) => N(b({}, "__esModule", {value: !0}), e);
	var F = {};
	O(F, {query: () => V, queryAll: () => W});
	var m = {
			attribute:
				/\[\s*(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)\s*(?:(?<operator>\W?=)\s*(?<value>.+?)\s*(\s(?<caseSensitive>[iIsS]))?\s*)?\]/gu,
			id: /#(?<name>[-\w\P{ASCII}]+)/gu,
			class: /\.(?<name>[-\w\P{ASCII}]+)/gu,
			comma: /\s*,\s*/g,
			combinator: /\s*[\s>+~]\s*/g,
			"pseudo-element": /::(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,
			"pseudo-class": /:(?<name>[-\w\P{ASCII}]+)(?:\((?<argument>¶*)\))?/gu,
			universal: /(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?\*/gu,
			type: /(?:(?<namespace>\*|[-\w\P{ASCII}]*)\|)?(?<name>[-\w\P{ASCII}]+)/gu,
		},
		U = new Set(["combinator", "comma"]),
		j = new Set([
			"not",
			"is",
			"where",
			"has",
			"matches",
			"-moz-any",
			"-webkit-any",
			"nth-child",
			"nth-last-child",
		]),
		C = /(?<index>[\dn+-]+)\s+of\s+(?<subtree>.+)/,
		q = {"nth-child": C, "nth-last-child": C},
		L = (e) => {
			switch (e) {
				case "pseudo-element":
				case "pseudo-class":
					return new RegExp(
						m[e].source.replace("(?<argument>\xB6*)", "(?<argument>.*)"),
						"gu",
					);
				default:
					return m[e];
			}
		};
	function M(e, n) {
		let t = 0,
			r = "";
		for (; n < e.length; n++) {
			let s = e[n];
			switch (s) {
				case "(":
					++t;
					break;
				case ")":
					--t;
					break;
			}
			if (((r += s), t === 0)) return r;
		}
		return r;
	}
	function z(e, n = m) {
		if (!e) return [];
		let t = [e];
		for (let [s, i] of Object.entries(n))
			for (let o = 0; o < t.length; o++) {
				let c = t[o];
				if (typeof c != "string") continue;
				i.lastIndex = 0;
				let u = i.exec(c);
				if (!u) continue;
				let h = u.index - 1,
					f = [],
					I = u[0],
					A = c.slice(0, h + 1);
				A && f.push(A), f.push({...u.groups, type: s, content: I});
				let k = c.slice(h + I.length + 1);
				k && f.push(k), t.splice(o, 1, ...f);
			}
		let r = 0;
		for (let s of t)
			switch (typeof s) {
				case "string":
					throw new Error(`Unexpected sequence ${s} found at index ${r}`);
				case "object":
					(r += s.content.length),
						(s.pos = [r - s.content.length, r]),
						U.has(s.type) && (s.content = s.content.trim() || " ");
					break;
			}
		return t;
	}
	var D = /(['"])([^\\\n]+?)\1/g,
		B = /\\./g;
	function G(e, n = m) {
		if (((e = e.trim()), e === "")) return [];
		let t = [];
		(e = e.replace(
			B,
			(i, o) => (t.push({value: i, offset: o}), "\uE000".repeat(i.length)),
		)),
			(e = e.replace(
				D,
				(i, o, c, u) => (
					t.push({value: i, offset: u}), `${o}${"\uE001".repeat(c.length)}${o}`
				),
			));
		{
			let i = 0,
				o;
			for (; (o = e.indexOf("(", i)) > -1; ) {
				let c = M(e, o);
				t.push({value: c, offset: o}),
					(e = `${e.substring(0, o)}(${"\xB6".repeat(
						c.length - 2,
					)})${e.substring(o + c.length)}`),
					(i = o + c.length);
			}
		}
		let r = z(e, n),
			s = new Set();
		for (let i of t.reverse())
			for (let o of r) {
				let {offset: c, value: u} = i;
				if (!(o.pos[0] <= c && c + u.length <= o.pos[1])) continue;
				let {content: h} = o,
					f = c - o.pos[0];
				(o.content = h.slice(0, f) + u + h.slice(f + u.length)),
					o.content !== h && s.add(o);
			}
		for (let i of s) {
			let o = L(i.type);
			if (!o) throw new Error(`Unknown token type: ${i.type}`);
			o.lastIndex = 0;
			let c = o.exec(i.content);
			if (!c)
				throw new Error(`Unable to parse content for ${i.type}: ${i.content}`);
			Object.assign(i, c.groups);
		}
		return r;
	}
	function p(e, {list: n = !0} = {}) {
		if (n && e.find((t) => t.type === "comma")) {
			let t = [],
				r = [];
			for (let s = 0; s < e.length; s++)
				if (e[s].type === "comma") {
					if (r.length === 0) throw new Error("Incorrect comma at " + s);
					t.push(p(r, {list: !1})), (r.length = 0);
				} else r.push(e[s]);
			if (r.length === 0) throw new Error("Trailing comma");
			return t.push(p(r, {list: !1})), {type: "list", list: t};
		}
		for (let t = e.length - 1; t >= 0; t--) {
			let r = e[t];
			if (r.type === "combinator") {
				let s = e.slice(0, t),
					i = e.slice(t + 1);
				return {
					type: "complex",
					combinator: r.content,
					left: p(s),
					right: p(i),
				};
			}
		}
		switch (e.length) {
			case 0:
				throw new Error("Could not build AST.");
			case 1:
				return e[0];
			default:
				return {type: "compound", list: [...e]};
		}
	}
	function* g(e, n) {
		switch (e.type) {
			case "list":
				for (let t of e.list) yield* g(t, e);
				break;
			case "complex":
				yield* g(e.left, e), yield* g(e.right, e);
				break;
			case "compound":
				yield* e.list.map((t) => [t, e]);
				break;
			default:
				yield [e, n];
		}
	}
	function d(e, {recursive: n = !0, list: t = !0} = {}) {
		let r = G(e);
		if (!r) return;
		let s = p(r, {list: t});
		if (!n) return s;
		for (let [i] of g(s)) {
			if (i.type !== "pseudo-class" || !i.argument || !j.has(i.name)) continue;
			let o = i.argument,
				c = q[i.name];
			if (c) {
				let u = c.exec(o);
				if (!u) continue;
				Object.assign(i, u.groups), (o = u.groups.subtree);
			}
			o && Object.assign(i, {subtree: d(o, {recursive: !0, list: !0})});
		}
		return s;
	}
	function K(e) {
		return e.tagName === "SLOT" && e.assignedNodes().length ?
				e.assignedElements()
			:	Array.from((e.shadowRoot ?? e).children);
	}
	function P(e) {
		return "documentElement" in e ? e.documentElement : e;
	}
	function* y(e) {
		yield e;
		for (let n of K(e)) yield* y(n);
	}
	function w(e) {
		return (
			e.assignedSlot ? e.assignedSlot
			: e.parentElement ? e.parentElement
			: e.parentNode?.host ? e.parentNode.host
			: null
		);
	}
	function S(e) {
		if (e.assignedSlot) {
			let n = e.assignedSlot.assignedElements();
			return n[n.indexOf(e) - 1] ?? null;
		}
		return e.previousElementSibling;
	}
	function a(e, n, t) {
		switch (t.type) {
			case "universal":
				return !0;
			case "attribute":
				return e.matches(t.content);
			case "class":
				return e.classList.contains(t.name);
			case "id":
				return e.id === t.name;
			case "type":
				return e.tagName.toLowerCase() === t.name.toLowerCase();
			case "list":
				for (let r of t.list) if (a(e, n, r)) return !0;
				return !1;
			case "compound":
				for (let r of t.list) if (!a(e, n, r)) return !1;
				return !0;
			case "pseudo-class":
				switch (t.name) {
					case "root":
						return (
							t.subtree && l(t.content), e === n.ownerDocument.documentElement
						);
					case "scope":
						return t.subtree && l(t.content), e === n;
					case "is":
					case "where":
						return t.subtree || l(t.content), a(e, n, t.subtree);
					case "has":
						return (
							t.argument || l(t.content), E(`:scope ${t.argument}`, e) != null
						);
					case "not":
						return t.subtree || l(t.content), !a(e, n, t.subtree);
					case "host":
					case "host-context":
						return l(t.content);
					default:
						return e.matches(t.content);
				}
			case "complex":
				switch (t.combinator) {
					case ">": {
						let r = w(e);
						return r != null && a(e, n, t.right) && a(r, n, t.left);
					}
					case " ": {
						let r = w(e);
						if (r == null || !a(e, n, t.right)) return !1;
						for (; r != null; ) {
							if (a(r, n, t.left)) return !0;
							r = w(r);
						}
						return !1;
					}
					case "+": {
						let r = S(e);
						return r != null && a(e, n, t.right) && a(r, n, t.left);
					}
					case "~": {
						let r = S(e);
						if (r == null || !a(e, n, t.right)) return !1;
						for (; r; ) {
							if (a(r, n, t.left)) return !0;
							r = S(r);
						}
						return !1;
					}
				}
				return x();
			case "pseudo-element":
				l(t.content);
		}
		x();
	}
	function l(e) {
		throw new Error(`Invalid selector: ${e}`);
	}
	function x() {
		throw new Error("This code should be unreachable");
	}
	function E(e, n = document) {
		let t = d(e) || l(e);
		n = P(n);
		for (let r of y(n)) if (a(r, n, t)) return r;
		return null;
	}
	function T(e, n = document) {
		let t = d(e) || l(e);
		n = P(n);
		let r = [];
		for (let s of y(n)) a(s, n, t) && r.push(s);
		return r;
	}
	function V(e, n) {
		return E(n, e);
	}
	function W(e, n) {
		return T(n, e);
	}
	return _(F);
})();
