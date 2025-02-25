export function setupCounter(element) {
  let counter = 0;
  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => {
    setCounter(counter + 1);
    throw new Error("This is an error");
  });
  setCounter(0);
}
