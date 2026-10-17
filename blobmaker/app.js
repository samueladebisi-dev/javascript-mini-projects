const outputCode = document.getElementById('css-code');

const sliders = document.querySelectorAll("input[type='range']");
sliders.forEach(function (slider) {
  slider.addEventListener('input', createBlob);
});

const inputs = document.querySelectorAll("input[type='number']");
inputs.forEach(function (inp) {
  inp.addEventListener('change', createBlob);
});

function createBlob() {
  const radiusOne = sliders[0].value;
  const radiusTwo = sliders[1].value;
  const radiusThree = sliders[2].value;
  const radiusFour = sliders[3].value;

  const blobHeight = inputs[0].value;
  const blobWidth = inputs[1].value;

  const borderRadius = `${radiusOne}% ${100 - radiusOne}% ${
    100 - radiusThree
  }% ${radiusThree}% / ${radiusFour}% ${radiusTwo}% ${100 - radiusTwo}% ${100 - radiusFour}%`;

  document.getElementById(
    'blob'
  ).style.cssText = `border-radius: ${borderRadius}; height: ${blobHeight}px; width: ${blobWidth}px`;

  outputCode.value = `border-radius: ${borderRadius};`;
}

const copyButton = document.getElementById('copy');
copyButton.addEventListener('click', async function () {
  try {
    await navigator.clipboard.writeText(outputCode.value);
    copyButton.textContent = 'Copied!';
  } catch {
    // The Clipboard API needs a secure context (https or localhost).
    outputCode.select();
    copyButton.textContent = 'Press Ctrl+C to copy';
  }
  setTimeout(() => (copyButton.textContent = 'Copy'), 1500);
});

// Show the starting shape and its CSS before any slider is moved.
createBlob();
