const playwright = require('playwright');

const ID = '';
const PASSWORD = '';

(async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
    // args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
    // args: ['--disable-features=site-per-process']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // login page
  await page.goto('https://www.walmart.com/account/login');

  // enter email
  await page.type('#email', ID, {delay: 100});
  await page.screenshot({ path: 'img/id.png' });

  // check password field in a form
  const hasPassword = await page.$('#sign-in-form');
  if (hasPassword) {
    console.log('has password field')
    // enter password
    await page.type('#password', PASSWORD, {delay: 100});
    await page.screenshot({ path: 'img/password.png' });
  } else {
    console.log('no password field')
    await page.click('#sign-in-with-email-validation [type=submit]');

    // enter password
    await page.type('#password', PASSWORD, {delay: 100});
    await page.screenshot({ path: 'img/password.png' });
  }

  // login
  await page.click('#sign-in-form [type=submit]');

  setTimeout(async () => {
    await page.screenshot({ path: 'img/recaptcha-loaded.png' });
    await browser.close();
  }, 8500);

})();
