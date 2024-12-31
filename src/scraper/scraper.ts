import { WebDriver, WebElement, By, until, Key } from "selenium-webdriver";
import path from "path";

import {
  initDriver,
  clickElement,
  getText,
  waitForElements,
  elementIsClickable,
  scrollToBottom,
} from "../helpers/seleniumhelper";
import { config } from "../config/env";
import { readFile, writeFile } from "../helpers/filehelper";
import { Posts } from "../types/types";
import fs from "fs/promises";
// import { processJson } from "../parser/jsonprocessor";

// Constants for XPaths
const XPATHS = {
  location: `//span[contains(@class, 'location-search-img-input-container')]`,
  explorebutton: `//button[contains(@class, 'explore-button')]`,
  closebutton: `//button[contains(@class, 'slide-in__close-btn')]`,
  posts: `//div[@class='post']`,
};

async function fetchPosts(driver: WebDriver, count: number): Promise<Posts[]> {
  const fetchedPosts: Posts[] = [];

  try {
    const [locInput] = await waitForElements(
      driver,
      `${XPATHS.location}//input`,
      1,
    );

    // Clear the input field
    await locInput.clear();

    // Enter "Avadi" into the input field
    await locInput.sendKeys("Avadi", Key.RETURN);

    await clickElement(driver, XPATHS.explorebutton);

    await clickElement(driver, XPATHS.closebutton);

    // Wait for the posts to load
    const postElements = await waitForElements(driver, XPATHS.posts, 1, 20000);

    // Loop until we have 50 posts
    while (postElements.length < count) {
      console.log(
        `Currently fetched ${postElements.length} posts. Scrolling to load more...`,
      );

      await scrollToBottom(driver);

      // Re-check for posts after scrolling
      const updatedPostElements = await waitForElements(
        driver,
        XPATHS.posts,
        postElements.length + 1,
        20000,
      );

      // Update the postElements with the newly found elements
      postElements.length = 0; // Clear the previous array
      postElements.push(...updatedPostElements); // Add new elements to the array
    }

    console.log(`Reached the target count of 50 posts.`);
    for (const postElement of postElements) {
      try {
        // Extract username
        const usernameElement = await postElement.findElement(
          By.xpath(".//div[@class='header-text']"),
        );
        const userName = await usernameElement.getText();

        // Extract userId from profile link
        const profileLink = await postElement.findElement(
          By.xpath(".//a[contains(@href, '/profile/')]"),
        );
        const userId = (await profileLink.getAttribute("href")).split(
          "/profile/",
        )[1];

        // Extract profile picture URL or set to empty
        let profilePicture = "";
        try {
          const profileImageElement = await postElement.findElement(
            By.xpath(".//img[@class='profile-image']"),
          );
          profilePicture = await profileImageElement.getAttribute("src");
          console.log("Profile Picture URL:", profilePicture); // Debugging
        } catch (error) {
          console.error("Profile picture not found:", error);
          profilePicture = ""; // Fallback value
        }

        // Check for verified badge
        let verified = false;
        try {
          await postElement.findElement(
            By.xpath(".//svg[contains(@class, 'badge-image')]"),
          );
          verified = true;
        } catch {
          verified = false; // No badge found
        }

        // Extract postId from the image URL
        let postId = "";
        let image = "";
        try {
          const postImageElement = await postElement.findElement(
            By.xpath(".//img[contains(@class, 'object-cover')]"),
          );
          const postImageUrl = await postImageElement.getAttribute("src");
          console.log("Post Image URL:", postImageUrl); // Debugging

          // Extract postId
          const postIdMatch = postImageUrl.match(
            /imagedelivery\.net\/([^/]+)\//,
          );
          postId = (postIdMatch && postIdMatch[1]) ?? "";
          image = postImageUrl; // Directly use the extracted URL
          console.log("Extracted postId:", postId);
        } catch (error) {
          console.error(
            "Post image not found or postId extraction failed:",
            error,
          );
          postId = ""; // Fallback value
          image = ""; // Fallback value for image
        }

        // Click description to load full text, then extract
        const descriptionElement = await postElement.findElement(
          By.xpath(".//div[@class='description']/p"),
        );
        await descriptionElement.click();
        const description = await descriptionElement.getText();

        // Extract likes
        let likes = 0;
        try {
          const likesElement = await postElement.findElement(
            By.xpath(".//div[@class='text-with-disc post-feet-footer']"),
          );
          const likesText = await likesElement.getText();
          likes = parseInt(likesText.split(" ")[0]);
        } catch {
          likes = 0; // No likes found
        }

        // Extract views if available
        let views = 0;
        try {
          const viewsElement = await postElement.findElement(
            By.xpath(".//div[contains(@class, 'video-feet-footer')]"),
          );
          const viewsText = await viewsElement.getText();
          const viewsMatch = viewsText.match(/(\d+) views/);
          if (viewsMatch) views = parseInt(viewsMatch[1]);
        } catch {
          views = 0; // No views found
        }

        // Extract time and location
        const timeLocationElement = await postElement.findElement(
          By.xpath(".//div[@class='header-location-time']"),
        );
        const timeLocationText = await timeLocationElement.getText();
        const [postedTime, location] = timeLocationText
          .split("•")
          .map((text) => text.trim());

        // Add the extracted data to the fetchedPosts array
        fetchedPosts.push({
          userName,
          userId,
          profilePicture,
          verified,
          post: {
            postId,
            description,
            postedTime,
            likes,
            views,
            location,
            image,
          },
        });
        const filePath = config.POSTS_FILE;
        await fs.writeFile(
          filePath,
          JSON.stringify(fetchedPosts, null, 2),
          "utf8",
        );
      } catch (error) {
        console.error("Error processing a post:", error);
      }
    }

    console.log(fetchedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
  }

  return fetchedPosts;
}

export async function automate(): Promise<void> {
  const driver = await initDriver();

  try {
    await driver.get(config.BASE_URL);
    await driver.wait(until.elementLocated(By.tagName("body")), 10000);

    await fetchPosts(driver, parseInt(config.NUM_POSTS));
  } catch (error) {
    console.error("Automation error:", error);
  } finally {
    console.log("Cleaning up and quitting driver...");
    // await driver.quit();
  }
}
