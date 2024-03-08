const puppeteer = require("puppeteer");
const pool = require("../utlis/db");

const sendMessage = async (req, res) => {
  const { message, userIds, fbUsername, fbPassword } = req.body;
  const users = userIds.split(",");
  console.log("Request started");
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to Facebook login Page
    await page.goto("https://mbasic.facebook.com/");

    // Fill in login credentials (consider using environment variables)
    await page.type('input[name="email"]', fbUsername); // Use environment variable
    await page.type('input[name="pass"]', fbPassword); // Use environment variable

    await Promise.all([
      page.waitForNavigation(),
      page.click('input[name="login"]'),
    ]);

    for (let i = 0; i < users.length; i += 2) {
      for (let j = i; j < i + 2 && j < users.length; j++) {
        const user = users[j];
        try {
          await page.goto(`https://mbasic.facebook.com/${user}`);
          // Wait for the page to load
          await page.waitForSelector('a[href*="messages/thread"]');

          // Extract the href attribute of the link
          const messageLink = await page.$('a[href*="messages/thread"]');
          const href = await messageLink.getProperty("href");
          const hrefValue = await href.jsonValue();

          // Navigate to the extracted link
          await page.goto(hrefValue);

          await page.type('textarea[name="body"]', message);

          try {
            await Promise.all([
              page.waitForNavigation(),
              page.click('input[name="send"]'),
            ]);
          } catch (error) {
            await Promise.all([
              page.waitForNavigation(),
              page.click('input[name="Send"]'),
            ]);
          }

          console.log({
            sent: user,
            message: "success",
            time: new Date().toISOString(),
          });

          await pool.query(
            "INSERT INTO users (user_id, message, status) VALUES ($1, $2, $3)",
            [user, message, "success"]
          );
        } catch (error) {
          console.log(error.message);
          await pool.query(
            "INSERT INTO users (user_id, message, status) VALUES ($1, $2, $3)",
            [user, error.message, "failed"]
          );
          continue;
        }
      }

      // If not all users have been processed, wait for 30 seconds before proceeding
      if (i + 2 < users.length) {
        console.log("Secheduled next 2 after 1mins");
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }

    res.status(200).send({ message: "Message sent successfully" });
  } catch (error) {
    console.log("Error logging in: ", error);
    res.status(500).send({ message: "Failed to send message", error: error });
  } finally {
    console.log("Request Completed");
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { sendMessage };
