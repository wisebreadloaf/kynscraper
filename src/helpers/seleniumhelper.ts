import {
  Builder,
  By,
  until,
  WebDriver,
  WebElement,
  Condition,
  // Actions,
  // Key,
} from "selenium-webdriver";

export async function initDriver(): Promise<WebDriver> {
  return new Builder().forBrowser("chrome").build();
}

export async function clickElement(
  driver: WebDriver,
  xpath: string,
  timeout = 10000,
): Promise<void> {
  const element = await driver.wait(
    until.elementLocated(By.xpath(xpath)),
    timeout,
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.click();
}

export async function sendKeysToElement(
  driver: WebDriver,
  xpath: string,
  keys: string,
  timeout = 10000,
): Promise<void> {
  const element = await driver.wait(
    until.elementLocated(By.xpath(xpath)),
    timeout,
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.sendKeys(keys);
}

export async function getText(element: WebElement): Promise<string> {
  return await element.getText();
}

export async function waitForElements(
  driver: WebDriver,
  xpath: string,
  minCount: number,
  timeout = 15000,
): Promise<WebElement[]> {
  const start = Date.now();

  while (true) {
    // Check elapsed time
    const elapsed = Date.now() - start;
    if (elapsed > timeout) {
      throw new Error(
        `Timeout reached after ${timeout}ms: Unable to find ${minCount} elements matching '${xpath}'.`,
      );
    }

    // Find elements matching the XPath
    const elements = await driver.findElements(By.xpath(xpath));
    // Check if the required count is met and elements are visible
    if (elements.length >= minCount) {
      const allVisible = await Promise.all(
        elements.map((el) => el.isDisplayed()),
      );
      if (allVisible.every(Boolean)) {
        console.log(
          `Elapsed time: ${elapsed}ms, Found: ${elements.length} elements`,
        );
        return elements; // All elements are ready
      } else {
        console.log("Not all elements are visible yet. Continuing to wait...");
      }
    }
    // Sleep for a short interval before retrying
    await driver.sleep(2000);
  }
}

export const elementIsClickable = (element: WebElement): Condition<boolean> => {
  return new Condition("element to be clickable", async () => {
    const isDisplayed = await element.isDisplayed();
    const isEnabled = await element.isEnabled();
    return isDisplayed && isEnabled;
  });
};

export async function waitForPageLoad(
  driver: WebDriver,
  timeout = 30000,
): Promise<void> {
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    console.log(`chatURL: ${currentUrl}`);

    const readyState = await driver.executeScript("return document.readyState");
    console.log(
      `Document ready state: ${readyState}, waiting for ${currentUrl} to load`,
    );
    // Log the current URL
    return readyState === "complete";
  }, timeout);
}

export async function scrollToBottom(
  driver: WebDriver,
  options: {
    element?: WebElement; // Optional specific element to scroll
    waitTime?: number; // Time to wait after scroll in ms
    maxAttempts?: number; // Maximum number of scroll attempts
  } = {},
): Promise<boolean> {
  const { waitTime = 1000, maxAttempts = 3, element } = options;

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Get current and maximum scroll height with explicit number type casting
      const [currentScroll, maxScroll] = await (element
        ? Promise.all([
            driver.executeScript<number>(
              "return Number(arguments[0].scrollTop) || 0;",
              element,
            ),
            driver.executeScript<number>(
              "return Number(arguments[0].scrollHeight - arguments[0].clientHeight) || 0;",
              element,
            ),
          ])
        : Promise.all([
            driver.executeScript<number>(
              "return Number(window.pageYOffset) || 0;",
            ),
            driver.executeScript<number>(
              "return Number(document.documentElement.scrollHeight - document.documentElement.clientHeight) || 0;",
            ),
          ]));

      // Now TypeScript knows these are numbers
      if (currentScroll >= maxScroll) {
        return true;
      }

      // Perform the scroll
      if (element) {
        await driver.executeScript(
          "arguments[0].scrollTo(0, arguments[0].scrollHeight);",
          element,
        );
      } else {
        await driver.executeScript(
          "window.scrollTo(0, document.documentElement.scrollHeight);",
        );
      }

      // Wait for any dynamic content to load
      await driver.sleep(waitTime);
    }

    return true;
  } catch (error) {
    console.error("Failed to scroll to bottom:", error);
    return false;
  }
}
