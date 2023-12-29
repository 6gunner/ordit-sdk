export const delay = async (time: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time)
  })
}
export const waitFor = async (fn: () => boolean) => {
  while (!fn()) {
    console.log("waiting for...");
    await delay(1000);
  }
};
export const waitForPromise = async (fn: () => Promise<boolean>) => {
  while (true) {
    let ready;
    try {
      ready = await fn();
    } catch (e: any) {
      console.warn("waitForPromise error", e);
    }
    if (!ready) {
      console.log("waiting for 1s...");
      await delay(1000);
    } else {
      break;
    }
  }
};