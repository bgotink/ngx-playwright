import type {ElementHandle, Frame, JSHandle, Page} from 'playwright-core';
import type {
  PageFunctionOn,
  EvaluationArgument,
  SmartHandle,
} from 'playwright-core/types/structs';

export class LazyBodyHandle implements ElementHandle<HTMLBodyElement> {
  private _loaded?: Promise<ElementHandle<HTMLBodyElement>> = undefined;

  constructor(private readonly _page: Page) {}

  private async _exec<R>(
    fn: (element: ElementHandle<HTMLBodyElement>) => Promise<R>,
  ): Promise<R> {
    this._loaded = (async () => {
      let element = (await (this._loaded ?? this._page.$('body')))!;

      try {
        // If the page was navigated to since the last time we queried the body,
        // we will have a stale handle.
        await element.isVisible();
      } catch {
        element = (await this._page.$('body'))!;
      }

      return element;
    })();

    return fn(await this._loaded);
  }

  $(selector: string): Promise<ElementHandle<HTMLElement | SVGElement> | null> {
    return this._exec(el => el.$(selector));
  }

  $$(selector: string): Promise<ElementHandle<HTMLElement | SVGElement>[]> {
    return this._exec(el => el.$$(selector));
  }

  $eval<R, E extends HTMLElement = HTMLElement>(
    selector: string,
    pageFunction: PageFunctionOn<E, void, R>,
    arg?: any,
  ): Promise<R> {
    return this._exec(el => el.$eval(selector, pageFunction, arg));
  }

  $$eval<R, E extends HTMLElement = HTMLElement>(
    selector: string,
    pageFunction: PageFunctionOn<E[], void, R>,
    arg?: any,
  ): Promise<R> {
    return this._exec(el => el.$$eval(selector, pageFunction, arg));
  }

  waitForSelector(
    selector: string,
    options: any,
  ): Promise<ElementHandle<HTMLElement | SVGElement>> {
    return this._exec(el => el.waitForSelector(selector, options));
  }

  boundingBox(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null> {
    return this._exec(el => el.boundingBox());
  }

  check(options?: {
    force?: boolean | undefined;
    noWaitAfter?: boolean | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.check(options));
  }

  click(options?: {
    button?: 'left' | 'right' | 'middle' | undefined;
    clickCount?: number | undefined;
    delay?: number | undefined;
    force?: boolean | undefined;
    modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[] | undefined;
    noWaitAfter?: boolean | undefined;
    position?: {x: number; y: number} | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.click(options));
  }

  contentFrame(): Promise<Frame | null> {
    return this._exec(el => el.contentFrame());
  }

  dblclick(options?: {
    button?: 'left' | 'right' | 'middle' | undefined;
    delay?: number | undefined;
    force?: boolean | undefined;
    modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[] | undefined;
    noWaitAfter?: boolean | undefined;
    position?: {x: number; y: number} | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.dblclick(options));
  }

  dispatchEvent(type: string, eventInit?: EvaluationArgument): Promise<void> {
    return this._exec(el => el.dispatchEvent(type, eventInit));
  }

  fill(
    value: string,
    options?: {noWaitAfter?: boolean | undefined; timeout?: number | undefined},
  ): Promise<void> {
    return this._exec(el => el.fill(value, options));
  }

  focus(): Promise<void> {
    return this._exec(el => el.focus());
  }

  getAttribute(name: string): Promise<string | null> {
    return this._exec(el => el.getAttribute(name));
  }

  hover(options?: {
    force?: boolean | undefined;
    modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[] | undefined;
    position?: {x: number; y: number} | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.hover(options));
  }

  innerHTML(): Promise<string> {
    return this._exec(el => el.innerHTML());
  }

  innerText(): Promise<string> {
    return this._exec(el => el.innerText());
  }

  isChecked(): Promise<boolean> {
    return this._exec(el => el.isChecked());
  }

  isDisabled(): Promise<boolean> {
    return this._exec(el => el.isDisabled());
  }

  isEditable(): Promise<boolean> {
    return this._exec(el => el.isEditable());
  }

  isEnabled(): Promise<boolean> {
    return this._exec(el => el.isEnabled());
  }

  isHidden(): Promise<boolean> {
    return this._exec(el => el.isHidden());
  }

  isVisible(): Promise<boolean> {
    return this._exec(el => el.isVisible());
  }

  ownerFrame(): Promise<Frame | null> {
    return this._exec(el => el.ownerFrame());
  }

  press(
    key: string,
    options?: {
      delay?: number | undefined;
      noWaitAfter?: boolean | undefined;
      timeout?: number | undefined;
    },
  ): Promise<void> {
    return this._exec(el => el.press(key, options));
  }

  screenshot(options?: {
    omitBackground?: boolean | undefined;
    path?: string | undefined;
    quality?: number | undefined;
    timeout?: number | undefined;
    type?: 'png' | 'jpeg' | undefined;
  }): Promise<any> {
    return this._exec(el => el.screenshot(options));
  }

  scrollIntoViewIfNeeded(options?: {
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.scrollIntoViewIfNeeded(options));
  }

  selectOption(
    values:
      | string
      | ElementHandle<Node>
      | string[]
      | {
          value?: string | undefined;
          label?: string | undefined;
          index?: number | undefined;
        }
      | ElementHandle<Node>[]
      | {
          value?: string | undefined;
          label?: string | undefined;
          index?: number | undefined;
        }[]
      | null,
    options?: {noWaitAfter?: boolean | undefined; timeout?: number | undefined},
  ): Promise<string[]> {
    return this._exec(el => el.selectOption(values, options));
  }

  selectText(options?: {timeout?: number | undefined}): Promise<void> {
    return this._exec(el => el.selectText(options));
  }

  setInputFiles(
    files:
      | string
      | string[]
      | {name: string; mimeType: string; buffer: any}
      | {name: string; mimeType: string; buffer: any}[],
    options?: {noWaitAfter?: boolean | undefined; timeout?: number | undefined},
  ): Promise<void> {
    return this._exec(el => el.setInputFiles(files, options));
  }

  tap(options?: {
    force?: boolean | undefined;
    modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[] | undefined;
    noWaitAfter?: boolean | undefined;
    position?: {x: number; y: number} | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.tap(options));
  }

  textContent(): Promise<string | null> {
    return this._exec(el => el.textContent());
  }

  type(
    text: string,
    options?: {
      delay?: number | undefined;
      noWaitAfter?: boolean | undefined;
      timeout?: number | undefined;
    },
  ): Promise<void> {
    return this._exec(el => el.type(text, options));
  }

  uncheck(options?: {
    force?: boolean | undefined;
    noWaitAfter?: boolean | undefined;
    timeout?: number | undefined;
  }): Promise<void> {
    return this._exec(el => el.uncheck(options));
  }

  waitForElementState(
    state:
      | 'visible'
      | 'hidden'
      | 'stable'
      | 'enabled'
      | 'disabled'
      | 'editable',
    options?: {timeout?: number | undefined},
  ): Promise<void> {
    return this._exec(el => el.waitForElementState(state, options));
  }

  evaluate<R, O extends HTMLBodyElement = HTMLBodyElement>(
    pageFunction: PageFunctionOn<O, void, R>,
    arg?: any,
  ): Promise<R> {
    return this._exec(el => el.evaluate(pageFunction, arg));
  }

  evaluateHandle<R, O extends HTMLBodyElement = HTMLBodyElement>(
    pageFunction: PageFunctionOn<O, void, R>,
    arg?: any,
  ): Promise<SmartHandle<R>> {
    return this._exec(el => el.evaluateHandle(pageFunction, arg));
  }

  jsonValue(): Promise<HTMLBodyElement> {
    return this._exec(el => el.jsonValue());
  }

  asElement(): ElementHandle<HTMLBodyElement> {
    return this;
  }

  dispose(): Promise<void> {
    return this._exec(el => el.dispose());
  }

  getProperties(): Promise<Map<string, JSHandle<any>>> {
    return this._exec(el => el.getProperties());
  }

  getProperty(propertyName: string): Promise<JSHandle<any>> {
    return this._exec(el => el.getProperty(propertyName));
  }
}
