export const rateLimitDelay = (min: number, max: number): Promise<void> => {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
};
