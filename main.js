const playwright = require('playwright');
const got = require('got');

const ID = process.env.ID;
const PASSWORD = process.env.PASSWORD;

(async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
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
    await page.type('#sign-in-password-no-otp', PASSWORD, {delay: 100});
    await page.screenshot({ path: 'img/password.png' });

    // login
    await page.click('#sign-in-with-password-form [type=submit]');
  }

  // login
  await page.click('#sign-in-form [type=submit]');

  // retrive data from recaptcha
  const recaptcha = await page.waitForSelector('.g-recaptcha');
  const sitekey = await recaptcha.getAttribute('data-sitekey');
  const currentUrl = await page.url();

  // 2captcha
  const APIKEY = process.env.APIKEY;
  const twoCaptchaURL = `https://2captcha.com/in.php?key=${APIKEY}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${currentUrl}`;

  let requestId;
  try {
    const response = await got(twoCaptchaURL);
    const result = response.body;
    if (result.startsWith('OK|')) {
      requestId = result.split('|')[1];
      console.log('RequestId: ' + requestId);
    } else {
      throw new Error(`Wrong response: ${result}`);
    }
  } catch(e) {
    console.log(e.response.body);
    await browser.close();
  }

  const resultUrl = `https://2captcha.com/res.php?key=${APIKEY}&action=get&id=${requestId}`;
  const getCaptchaResult = () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await got(resultUrl);
          resolve(response.body);
        } catch(e) {
          reject(e.response.body);
        }
      }, 10000);
    });
  };


  let answer;
  let isNotSolved = true;
  while(isNotSolved) {
    try {
      const result = await getCaptchaResult();
      if (result.startsWith('OK|')) {
        answer = result.split('|')[1];
        isNotSolved = false;
      } else {
        throw new Error(`Wrong response: ${result}`);
      }
      console.log(result);
    } catch(e) {
      console.log('error')
      console.log(e);
    }
  }

  // enter recaptcha answer
  await page.$eval('#g-recaptcha-response', el => {
    el.style.display = 'block';
  });
  await page.fill('#g-recaptcha-response', answer, {delay: 30});

  await page.$eval('body', el => {
    document.querySelector('#sign-in-form').submit();
  });

  setTimeout(async () => {
    await page.screenshot({ path: 'img/recaptcha-loaded.png' });
    await browser.close();
  }, 8500);

})();
