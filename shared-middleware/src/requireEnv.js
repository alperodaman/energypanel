function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    for (const name of missing) {
      console.error(`FATAL: Missing required environment variable: ${name}. Service cannot start.`);
    }
    process.exit(1);
  }
}

export { requireEnv };
