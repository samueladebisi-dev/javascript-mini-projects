const currencyRates = {
  USD: 1, // USD to USD (1:1)
  EUR: 0.85, // USD to EUR (1 USD = 0.85 EUR)
  GBP: 0.74, // USD to GBP (1 USD = 0.74 GBP)
  INR: 83.52, // USD to INR (1 USD = 83.52 INR)
  // Add more currency rates here
};

document.getElementById('addCurrencyButton').addEventListener('click', function () {
  const customCurrencyCode = document.getElementById('customCurrency').value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(customCurrencyCode)) {
    alert('Invalid currency code. Please enter a three-letter code (e.g., CAD).');
  } else if (currencyRates[customCurrencyCode]) {
    alert(`Currency ${customCurrencyCode} already exists.`);
  } else {
    const exchangeRate = parseFloat(
      prompt(`Enter exchange rate for 1 USD to ${customCurrencyCode}`)
    );
    if (exchangeRate > 0) {
      currencyRates[customCurrencyCode] = exchangeRate;
      updateCurrencyOptions();
    } else {
      alert('Invalid exchange rate. Please enter a number greater than 0.');
    }
  }
});

function updateCurrencyOptions() {
  for (const id of ['fromCurrency', 'toCurrency']) {
    const select = document.getElementById(id);
    const selected = select.value;
    select.innerHTML = '';
    for (const currency in currencyRates) {
      const option = document.createElement('option');
      option.value = currency;
      option.innerText = currency;
      select.appendChild(option);
    }
    // Keep the user's choice when a currency is added.
    if (selected in currencyRates) select.value = selected;
  }
}

document.getElementById('convertButton').addEventListener('click', convertCurrency);

function convertCurrency() {
  const amount = parseFloat(document.getElementById('amount').value);
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency').value;
  const resultElement = document.getElementById('result');

  if (isNaN(amount)) {
    alert('Please enter a valid amount.');
    return;
  }

  const convertedAmount = (amount / currencyRates[fromCurrency]) * currencyRates[toCurrency];
  resultElement.value = convertedAmount.toFixed(2);
}

// Initialize currency options
updateCurrencyOptions();
