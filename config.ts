const config = {
  MicrosoftAppId: process.env.CLIENT_ID || process.env.BOT_ID,
  MicrosoftAppType: process.env.BOT_TYPE || "MultiTenant",
  MicrosoftAppTenantId: process.env.TENANT_ID,
  MicrosoftAppPassword: process.env.CLIENT_SECRET || process.env.CLIENT_PASSWORD,
};

export default config;