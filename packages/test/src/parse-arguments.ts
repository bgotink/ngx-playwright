/**
 * Get the names of all destructured properties from the first parameter in the given function
 *
 * This uses a quick and dirty "parser" rather than a fully fledged ES-compatible parser, because
 * that's overkill when only parsing a function (which we already know is valid because we pass in
 * the parsed and instantiated function)
 *
 * @param fn The function to inspect
 * @returns The destructured properties of the first parameter of the given function, null if not destructured
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getDestructuredArguments(fn: Function): string[] | null {
  return _getDestructuredArguments(fn)?.map(([name]) => name) ?? null;
}

/**
 * Get the names of all destructured properties used on the $ property of the first destructured argument in the given function
 *
 * This uses a quick and dirty "parser" rather than a fully fledged ES-compatible parser, because
 * that's overkill when only parsing a function (which we already know is valid because we pass in
 * the parsed and instantiated function)
 *
 * @param fn The function to inspect
 * @returns The destructured properties of the $ property of the first destructured argument in the given function, or null if either is not destructured
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getDestructured$Argument(fn: Function): string[] | null {
  return (
    _getDestructuredArguments(fn)?.find(([name]) => name === '$')?.[1] ?? null
  );
}

function _getDestructuredArguments(
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn: Function,
): [string, string[] | null][] | null {
  const str = fn.toString();

  let i = 0;

  function peek() {
    return str[i];
  }

  function pop() {
    return str[i++];
  }

  function maybeConsume(re: RegExp | string) {
    if (typeof re === 'string') {
      const {length} = re;

      if (re !== str.substr(i, length)) {
        return null;
      }

      i += length;
      return re;
    }

    let match: RegExpExecArray | null;

    while ((match = re.exec(str.slice(i)))) {
      i += match[0]!.length;
      return match[0];
    }

    return null;
  }

  function consume(expected: string | RegExp) {
    if (typeof expected === 'string') {
      const {length} = expected;
      if (expected !== str.substr(i, length)) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${str.substr(i, length)}`,
        );
      }

      i += length;
      return expected;
    } else {
      const match = expected.exec(str.slice(i));
      if (match == null) {
        throw new Error(
          `Expected match for ${expected.toString()}, got ${str.slice(i, 20)}`,
        );
      }

      i += match[0]!.length;
      return match[0]!;
    }
  }

  function maybeConsumeObjectLike(): boolean {
    const start = maybeConsume(STACK_START) as '{' | '(' | '[';
    if (start) {
      const stack: string[] = [STACK_END[start]];

      while (stack.length > 0) {
        maybeConsume(WHITESPACE);

        const char = pop();

        switch (char) {
          case stack[0]:
            stack.shift();
            break;
          case '(':
          case '{':
          case '[':
            stack.unshift(STACK_END[char]);
        }
      }
    }

    return !!start;
  }

  function consumeDestructured(
    goDeeper: true,
  ): [string, string[] | null][] | null;
  function consumeDestructured(goDeeper: false): string[] | null;
  function consumeDestructured(goDeeper: boolean) {
    if (!maybeConsume('{')) {
      // not destructured
      return null;
    }

    const args: [string, string[] | null][] = [];

    maybeConsume(WHITESPACE);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (peek() === '.') {
        throw new Error("Rest properties aren't supported");
      }

      let name: string;
      const delimiter = maybeConsume(/^["']/) as '"' | "'" | null;
      if (delimiter) {
        name = consume(new RegExp(`^[^${delimiter}]+`));
        consume(delimiter);
      } else {
        name = consume(IDENTIFIER);
      }

      maybeConsume(WHITESPACE);

      if (maybeConsume(':')) {
        maybeConsume(WHITESPACE);

        if (goDeeper && peek() === '{') {
          args.push([name, consumeDestructured(false)]);
        } else {
          args.push([name, null]);
          if (!maybeConsumeObjectLike()) {
            consume(IDENTIFIER);
          }
        }

        maybeConsume(WHITESPACE);
      } else {
        // no : -> no destructuring
        args.push([name, null]);
      }

      if (maybeConsume('=')) {
        maybeConsume(WHITESPACE);
        if (!maybeConsumeObjectLike()) {
          consume(IDENTIFIER);
        }
        maybeConsume(WHITESPACE);
      }

      if (maybeConsume('}')) {
        break;
      }

      consume(',');
      maybeConsume(WHITESPACE);

      if (maybeConsume('}')) {
        break;
      }
    }

    if (goDeeper) {
      return args;
    } else {
      return args.map(([name]) => name);
    }
  }

  const WHITESPACE = /^(?:\s|\/\/.*?\n|\/\*.*?\*\/)+/;
  const KEYWORD_ASYNC = 'async';
  const KEYWORD_FUNCTION = 'function';
  const IDENTIFIER =
    /^(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*/u;
  const STACK_START = /^[[({]/;
  const STACK_END = {'[': ']', '(': ')', '{': '}'};

  maybeConsume(WHITESPACE);
  maybeConsume(KEYWORD_ASYNC);
  maybeConsume(WHITESPACE);
  if (maybeConsume(KEYWORD_FUNCTION)) {
    // possibly a generator
    maybeConsume(WHITESPACE);
    maybeConsume('*');

    // function can have a name
    maybeConsume(WHITESPACE);
    maybeConsume(IDENTIFIER);

    // function must have an opening parenthesis
    maybeConsume(WHITESPACE);
    consume('(');
  } else {
    // arrow function, can have opening parenthesis
    maybeConsume(WHITESPACE);
    if (!maybeConsume('(')) {
      // without parenthesis the first paramter cannot be destructured
      return null;
    }
  }
  maybeConsume(WHITESPACE);

  return consumeDestructured(true);
}
