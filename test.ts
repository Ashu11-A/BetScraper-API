import puppeteer from 'puppeteer'

async function printSectionWithText(url: string, textToSearch: string) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-insecure-localhost',
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors'
    ]
  })
    
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36')
  
  await page.goto('https://betano.com/', { waitUntil: 'networkidle2' })
  await page.setViewport({ width: 1080, height: 1024 })
  await page.setJavaScriptEnabled(false)

  // Finding and highlighting elements with the text 'Special Offer'
  const elements = await page.$$('*')
  const keywords = [
    'créditos', 'bônus', 'crédito', 'recompensa',
    'incentivo', 'gratificação', 'cupom', 'voucher',
    'bonificação', 'abono', 'saldo extra',
  ]

  let len = 0

  for (const element of elements) {
    const textContent =  await element.evaluate(el => el?.textContent || '')
    const foundKeywords = keywords.filter(keyword => textContent.includes(keyword))

    if (foundKeywords.length > 0) {
      console.log(textContent)
      len++

      try {
        await element.screenshot({
          path: `photos/${len}.png`,
          captureBeyondViewport: true
        })
      } catch (err) {
        console.log(err)
      }
    }
        
  }

  console.log(len)

  await browser.close()
}

// Example usage:
printSectionWithText('https://www.bet365.com', 'créditos')
  .catch(error => console.error(error))