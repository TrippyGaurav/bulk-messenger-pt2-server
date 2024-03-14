const puppeteer = require("puppeteer");
const { pool } = require("../utlis/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const queries = require("../utlis/queries");

const checkTableExists = async (database) => {
  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const sentMessage = async (user, message, status, fbUsername, username) => {
  await pool.query(queries.addMessage, [
    user,
    message,
    status,
    fbUsername,
    username,
  ]);
};

const sendMessage = async (req, res) => {
  const { message, userIds, fbUsername, fbPassword } = req.body;
  const users = userIds.split(",");

  const token = req.headers.authorization.split(" ")[1];
  // Verify the token

  try {
    const facebookIdsTable = await checkTableExists("facebook_Ids");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // Access the user information from the decoded token
    const userId = decodedToken.id;
    const username = decodedToken.username;

    console.log("USER NAME : ", username);

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

      const loginFailed = await page.$("div#login_error");
      if (loginFailed) {
        res.status(200).send({ message: "Login Failed" });
        return;
      }

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

            if (facebookIdsTable) {
              pool.query(queries.addFacebookId, [fbUsername, username]);
            } else {
              await pool.query(queries.createfacebookIdsTable);
              pool.query(queries.addFacebookId, [fbUsername, username]);
            }

            const tableExists = await checkTableExists("messages");
            if (tableExists) {
              sentMessage(user, message, "success", fbUsername, username);
            } else {
              console.log("Table not exists");
              await pool.query(queries.createMessageTable);
              sentMessage(user, message, "success", fbUsername, username);
            }
          } catch (error) {
            console.log(error.message);
            sentMessage(user, message, "failed", fbUsername, username);
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
      res.status(500).send({ message: "Failed to send message", error: error });
    } finally {
      console.log("Request Completed");
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Token has expired, handle appropriately
      res.status(401).json({ error: "Token expired. Please log in again." });
    } else {
      // Other JWT verification errors
      res.status(401).json({ error: "Invalid token." });
    }
  }
};

const getAllMessages = async (req, res) => {
  try {
    const messages = await pool.query(queries.getAllMessages);
    res.status(200).json({ success: true, data: messages.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Error fetching messages" });
  }
};

module.exports = {
  sendMessage,
  getAllMessages,
};
