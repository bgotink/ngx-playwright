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
export function getDestructuredArguments(
  fn: (arg: any, ...rest: any[]) => any,
): string[] | null {
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

  if (!maybeConsume('{')) {
    // not destructured
    return null;
  }

  const names: string[] = [];

  maybeConsume(WHITESPACE);
  while (true) {
    if (peek() === '.') {
      throw new Error(
        "Rest properties aren't supported in the inScreen function",
      );
    }

    const delimiter = maybeConsume(/^["']/) as '"' | "'" | null;
    if (delimiter) {
      names.push(consume(new RegExp(`^[^${delimiter}]+`)));
      consume(delimiter);
    } else {
      names.push(consume(IDENTIFIER));
    }

    maybeConsume(WHITESPACE);

    if (maybeConsume(':')) {
      maybeConsume(WHITESPACE);

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
      } else {
        consume(IDENTIFIER);
      }

      maybeConsume(WHITESPACE);
    }

    if (maybeConsume('=')) {
      maybeConsume(WHITESPACE);
      consume(IDENTIFIER);
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

  return names;
}
